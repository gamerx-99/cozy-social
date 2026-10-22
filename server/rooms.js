import { randomBytes, randomUUID } from 'node:crypto';
import { CAPACITY, WORLD, STATIONS, GAMES } from '../shared/rules.js';
import { initialLayout, validatePlacement, walkable, FLOOR_COLORS, GRID } from '../shared/building.js';

export class Rooms {
  constructor({ now = Date.now, duration } = {}) { this.rooms = new Map(); this.now = now; this.duration = duration; }
  send(socket, data) { if (socket.readyState === 1) socket.send(JSON.stringify(data)); }
  fail(socket, message) { this.send(socket, { type: 'error', message }); }
  state(room) {
    return { code: room.code, host: room.host, layout:room.layout, players: [...room.players.values()].map(({ socket, lastMove, lastAction, lastChat, lastEmote, ...p }) => p), messages: room.messages, game: room.game, now: this.now() };
  }
  broadcast(room) { const data = { type: 'state', room: this.state(room) }; for (const p of room.players.values()) this.send(p.socket, data); }
  message(room, name, text, system = false) { room.messages.push({ id: randomUUID(), name, text, system }); room.messages = room.messages.slice(-60); }
  leave(socket) {
    const room = this.rooms.get(socket.roomCode);
    if (!room) return;
    const player = room.players.get(socket.playerId);
    room.players.delete(socket.playerId); socket.roomCode = null;
    if (!room.players.size) { this.rooms.delete(room.code); return; }
    if (room.host === socket.playerId) room.host = room.players.keys().next().value;
    this.message(room, '', `${player?.name || 'เพื่อน'} ออกจากห้องแล้ว`, true);
    this.broadcast(room);
  }
  handle(socket, data) {
    if (!data || typeof data !== 'object') return;
    const now = this.now();
    if (data.type === 'create' || data.type === 'join') {
      if (socket.roomCode) return this.fail(socket, 'ออกจากห้องเดิมก่อนนะ');
      let room;
      if (data.type === 'create') {
        if (this.rooms.size >= 500) return this.fail(socket, 'เซิร์ฟเวอร์เต็มชั่วคราว');
        let code; do { code = randomBytes(3).toString('hex').toUpperCase(); } while (this.rooms.has(code));
        room = { code, players: new Map(), messages: [], host: null, game: null, layout:initialLayout() };
        this.rooms.set(code, room);
      } else room = this.rooms.get(String(data.code || '').toUpperCase());
      if (!room) return this.fail(socket, 'ไม่พบห้องนี้ ลองตรวจรหัสอีกครั้ง');
      if (room.players.size >= CAPACITY) return this.fail(socket, 'ห้องเต็มแล้ว (10/10 คน)');
      const id = randomUUID();
      const p = { id, socket, name: String(data.name || 'เพื่อนใหม่').trim().slice(0, 20) || 'เพื่อนใหม่', look: Number.isInteger(data.look) && data.look >= 0 && data.look < 4 ? data.look : 0, x: 60 + room.players.size * 40, y: 420, direction:'down', moving:false, lastMove: now, lastAction: 0, lastChat: 0, lastEmote: 0, emote: '', emoteUntil: 0 };
      socket.roomCode = room.code; socket.playerId = id;
      room.players.set(id, p); room.host ||= id;
      this.message(room, '', `${p.name} มาแล้ว ♡`, true);
      this.send(socket, { type: 'joined', id }); this.broadcast(room); return;
    }
    const room = this.rooms.get(socket.roomCode), p = room?.players.get(socket.playerId);
    if (!p) return;
    if (data.type === 'leave') { this.leave(socket); this.send(socket, { type: 'left' }); return; }
    if (data.type === 'build') {
      if(room.host!==p.id)return this.fail(socket,'เจ้าของห้องเป็นคนจัดห้องนะ');
      if(room.game?.status==='playing')return this.fail(socket,'จบรอบมินิเกมก่อน แล้วค่อยจัดห้องนะ');
      if(data.revision!==room.layout.revision)return this.fail(socket,'ห้องมีการเปลี่ยนแปลง ลองวางอีกครั้ง');
      const layout=room.layout;
      if(data.op==='floor'){
        if(!Number.isInteger(data.x)||!Number.isInteger(data.y)||data.x<0||data.x>=GRID.cols||data.y<0||data.y>=GRID.rows||!Object.hasOwn(FLOOR_COLORS,data.floor))return;
        layout.floors[data.y*GRID.cols+data.x]=data.floor;
      }else if(data.op==='remove'){
        if(!layout.items.some(i=>i.id===data.id))return;
        layout.items=layout.items.filter(i=>i.id!==data.id);
      }else if(data.op==='place'||data.op==='move'){
        const existing=data.op==='move'?layout.items.find(i=>i.id===data.id):null;
        if(data.op==='move'&&!existing)return;
        if(!existing&&layout.items.length>=100)return this.fail(socket,'ห้องนี้วางได้สูงสุด 100 ชิ้น');
        const item={id:existing?.id||randomUUID(),kind:existing?.kind||data.kind,x:data.x,y:data.y,rotation:data.rotation};
        const error=validatePlacement(layout.items,item,[...room.players.values()]);if(error)return this.fail(socket,error);
        layout.items=layout.items.filter(i=>i.id!==item.id);layout.items.push(item);
      }else return;
      layout.revision++;this.broadcast(room);return;
    }
    if (data.type === 'move') {
      if (!Number.isFinite(data.x) || !Number.isFinite(data.y)) return;
      const elapsed = Math.min(0.3, Math.max(0, (now - p.lastMove) / 1000));
      const x = Math.max(WORLD.left, Math.min(WORLD.right, data.x)), y = Math.max(WORLD.top, Math.min(WORLD.bottom, data.y));
      const distance = Math.hypot(x - p.x, y - p.y), max = elapsed * 230;
      const ratio = distance ? Math.min(1, max / distance) : 0;
      const nx=p.x+(x-p.x)*ratio,ny=p.y+(y-p.y)*ratio,dx=nx-p.x,dy=ny-p.y;
      // Sweep in small increments; checking only the endpoint permits tunnelling.
      const steps=Math.max(1,Math.ceil(Math.hypot(dx,dy)/5));
      for(let i=1;i<=steps;i++){const tx=p.x+dx/steps,ty=p.y+dy/steps;if(!walkable(room.layout.items,tx,ty))break;p.x=tx;p.y=ty;}
      const sx=dx-dy,sy=dx+dy;p.direction=Math.abs(sx)>Math.abs(sy)*.5?(sx>0?'right':'left'):(sy>0?'down':'up');p.moving=Math.hypot(dx,dy)>.1;p.lastMove=now;return;
    }
    if (data.type === 'chat' && now - p.lastChat >= 500) {
      const value = String(data.text || '').trim().slice(0, 240); if (!value) return;
      p.lastChat = now; this.message(room, p.name, value); this.broadcast(room);
    }
    if (data.type === 'emote' && now - p.lastEmote >= 800 && ['♡', '👋', '✨', '😂'].includes(data.emote)) { p.emote = data.emote; p.emoteUntil = now + 3500; p.lastEmote = now; this.broadcast(room); }
    if (data.type === 'look' && Number.isInteger(data.look) && data.look >= 0 && data.look < 4) { p.look = data.look; this.broadcast(room); }
    if (data.type === 'start') {
      if (room.host !== p.id) return this.fail(socket, 'ให้เจ้าของห้องเริ่มเกมนะ');
      if (room.game?.status === 'playing') return this.fail(socket, 'รอบนี้ยังไม่จบ');
      if (!GAMES[data.game] || !['coop', 'pairs'].includes(data.mode)) return;
      const players = [...room.players.keys()];
      if (data.mode === 'pairs' && (players.length < 2 || players.length % 2)) return this.fail(socket, 'โหมดจับคู่ต้องมีผู้เล่นจำนวนคู่ 2–10 คน');
      const groups = data.mode === 'coop' ? [players] : Array.from({ length: players.length / 2 }, (_, i) => players.slice(i * 2, i * 2 + 2));
      room.game = { kind: data.game, mode: data.mode, status: 'playing', endsAt: now + (this.duration ?? GAMES[data.game].duration * 1000), teams: groups.map((members, i) => ({ id: i, members, score: 0, step: 0, readyAt: 0, lastWorker: null })) };
      this.message(room, '', `เริ่ม ${GAMES[data.game].name} แล้ว!`, true); this.broadcast(room);
    }
    if (data.type === 'action') {
      const g = room.game;
      if (!g || g.status !== 'playing' || now >= g.endsAt || now - p.lastAction < 500) return;
      const team = g.teams.find(t => t.members.includes(p.id));
      if (!team) return this.fail(socket, 'เข้าร่วมเล่นได้ในรอบถัดไป ตอนนี้ส่งกำลังใจให้เพื่อนได้');
      const station = STATIONS[team.step];
      if (Math.hypot(p.x - station.x, p.y - station.y) > 65) return this.fail(socket, 'เดินเข้าใกล้จุดงานที่มีแสงก่อนนะ');
      if (now < team.readyAt) return this.fail(socket, 'กำลังทำอยู่ รอแถบเวลาให้เต็มก่อน');
      p.lastAction = now;
      if (team.step === 2) { team.score += 100; team.step = 0; team.readyAt = 0; }
      else { team.step++; team.readyAt = team.step === 2 ? now + 3000 : 0; }
      team.lastWorker = p.name; this.broadcast(room);
    }
    if (data.type === 'lobby' && room.host === p.id) { room.game = null; this.broadcast(room); }
  }
  tick() {
    for (const room of this.rooms.values()) {
      for(const p of room.players.values())if(this.now()-p.lastMove>180)p.moving=false;
      if (room.game?.status === 'playing' && this.now() >= room.game.endsAt) { room.game.status = 'finished'; this.message(room, '', 'หมดเวลาแล้ว ขอบคุณที่ช่วยกันนะ ♡', true); }
      this.broadcast(room);
    }
  }
}

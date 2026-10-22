import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Rooms } from '../server/rooms.js';
function setup() {
 let now = 100000;
 const rooms = new Rooms({ now: () => now });
 const socket = () => ({ readyState: 1, messages: [], send(raw) { this.messages.push(JSON.parse(raw)); } });
 const host = socket(); rooms.handle(host, { type: 'create', name: 'Host' });
 const room = rooms.rooms.get(host.roomCode);
 return { rooms, host, room, socket, advance(ms) { now += ms; }, join(name='Friend') { const s=socket(); rooms.handle(s,{type:'join',code:room.code,name}); return s; }, start(kind='kitchen',mode='coop') { rooms.handle(host,{type:'start',game:kind,mode}); } };
}
test('ten members can join; eleventh is rejected without changing occupancy', () => {
 const s=setup(); for(let i=0;i<9;i++) s.join(); const extra=s.join();
 assert.equal(s.room.players.size,10); assert.equal(extra.roomCode,undefined); assert.match(extra.messages.at(-1).message,/10\/10/);
});
test('unknown rooms cannot be joined and chat is isolated', () => {
 const s=setup(), other=s.socket();s.rooms.handle(other,{type:'join',code:'BADBAD'});assert.equal(other.messages.at(-1).type,'error');
 s.rooms.handle(other,{type:'create',name:'Elsewhere'});s.rooms.handle(s.host,{type:'chat',text:'secret'});
 assert.ok(!s.rooms.rooms.get(other.roomCode).messages.some(m=>m.text==='secret'));
});
test('only host may start and paired mode requires an even count', () => {
 const s=setup(), friend=s.join();s.rooms.handle(friend,{type:'start',game:'kitchen',mode:'coop'});assert.equal(s.room.game,null);
 s.join();s.start('kitchen','pairs');assert.equal(s.room.game,null);
 s.join();s.start('kitchen','pairs');assert.equal(s.room.game.teams.length,2);assert.ok(s.room.game.teams.every(t=>t.members.length===2));
});
test('movement cannot teleport, leave bounds, or use non-finite input', () => {
 const s=setup(),p=s.room.players.get(s.host.playerId), old={x:p.x,y:p.y};
 s.advance(100);s.rooms.handle(s.host,{type:'move',x:99999,y:-99999});assert.ok(Math.hypot(p.x-old.x,p.y-old.y)<=23.001);
 const before=p.x;s.rooms.handle(s.host,{type:'move',x:Infinity,y:NaN});assert.equal(p.x,before);
 for(let i=0;i<30;i++){s.advance(300);s.rooms.handle(s.host,{type:'move',x:99999,y:-99999});}assert.ok(p.x>=8&&p.x<=712);assert.ok(p.y>=8&&p.y<=552);
});
test('work requires proximity, recipe sequence, and processing time', () => {
 const s=setup();s.start();const p=s.room.players.get(s.host.playerId),t=s.room.game.teams[0];
 p.x=900;p.y=600;s.rooms.handle(s.host,{type:'action'});assert.equal(t.step,0);
 p.x=220;p.y=400;s.rooms.handle(s.host,{type:'action'});assert.equal(t.step,1);
 s.advance(600);p.x=420;s.rooms.handle(s.host,{type:'action'});assert.equal(t.step,2);
 s.advance(600);p.x=620;s.rooms.handle(s.host,{type:'action'});assert.equal(t.score,0);
 s.advance(2500);s.rooms.handle(s.host,{type:'action'});assert.equal(t.score,100);assert.equal(t.step,0);
 s.rooms.handle(s.host,{type:'action'});assert.equal(t.score,100);
});
test('teammates can hand off work; competing pairs have separate progress', () => {
 const s=setup(),mate=s.join();s.join();s.join();s.start('makeover','pairs');
 const p=s.room.players.get(s.host.playerId),q=s.room.players.get(mate.playerId);p.x=220;p.y=400;s.rooms.handle(s.host,{type:'action'});
 q.x=420;q.y=400;s.rooms.handle(mate,{type:'action'});assert.equal(s.room.game.teams[0].step,2);assert.equal(s.room.game.teams[1].step,0);
});
test('late joiners spectate until the next round', () => {
 const s=setup();s.start();const friend=s.join();assert.ok(!s.room.game.teams[0].members.includes(friend.playerId));
 s.rooms.handle(friend,{type:'action'});assert.match(friend.messages.at(-1).message,/รอบถัดไป/);
 s.rooms.handle(s.host,{type:'lobby'});s.start();assert.ok(s.room.game.teams[0].members.includes(friend.playerId));
});
test('timer expires and prevents further score changes', () => {
 const s=setup();s.start();s.advance(120001);s.rooms.tick();assert.equal(s.room.game.status,'finished');
 s.rooms.handle(s.host,{type:'action'});assert.equal(s.room.game.teams[0].score,0);
});
test('host transfers on leave and empty rooms are deleted', () => {
 const s=setup(),friend=s.join();s.rooms.leave(s.host);assert.equal(s.room.host,friend.playerId);
 s.rooms.handle(friend,{type:'start',game:'kitchen',mode:'coop'});assert.equal(s.room.game.status,'playing');
 s.rooms.leave(friend);assert.equal(s.rooms.rooms.size,0);
});
test('chat and emotes are bounded and throttled', () => {
 const s=setup();s.rooms.handle(s.host,{type:'chat',text:'x'.repeat(500)});assert.equal(s.room.messages.at(-1).text.length,240);
 const count=s.room.messages.length;s.rooms.handle(s.host,{type:'chat',text:'spam'});assert.equal(s.room.messages.length,count);
 s.rooms.handle(s.host,{type:'emote',emote:'👋'});const p=s.room.players.get(s.host.playerId);assert.equal(p.emote,'👋');
 s.rooms.handle(s.host,{type:'emote',emote:'😂'});assert.equal(p.emote,'👋');
});
test('serialized state never contains sockets or internal rate limits', () => {
 const s=setup(),data=s.rooms.state(s.room);assert.ok(!('socket' in data.players[0]));assert.ok(!('lastMove' in data.players[0]));assert.doesNotThrow(()=>JSON.stringify(data));
});

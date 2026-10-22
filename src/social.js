import './social.css';
import './isometric.css';
import { RoomView, openCharacterStudio } from './RoomView.js';
import { pathfind, walkable } from '../shared/building.js';
import { LOOKS, GAMES, WORLD } from '../shared/rules.js';

const $ = s => document.querySelector(s);
const app = $('#app');
const safe = s => String(s).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
let profile = { name: '', look: 0 };
try { const p = JSON.parse(localStorage.getItem('cozy-profile') || 'null'); if (p) profile = { name: String(p.name || '').slice(0,20), look: Number.isInteger(p.look) && p.look >= 0 && p.look < 4 ? p.look : 0 }; } catch {}
let socket, room = null, myId, selectedGame = 'kitchen', mode = 'coop', destination, screen = 'creator', connection = 'connecting', clockOffset = 0, lanHosts = [];
let toastTimer, lastPlayers = '', lastMessages = '', lastGame = '', lastFrame = 0, lastMove = 0;
const keys = new Set();
let roomView, walkPath = [];
const avatar = (look, cls = '') => `<span class="avatar ${cls}" style="--look:${look}" aria-hidden="true"></span>`;
function toast(text) { $('#toast').textContent = text; $('#toast').classList.add('show'); clearTimeout(toastTimer); toastTimer = setTimeout(() => $('#toast').classList.remove('show'), 3500); }
function save() { try { localStorage.setItem('cozy-profile', JSON.stringify(profile)); } catch { toast('บันทึกลงเครื่องไม่ได้ แต่ยังเล่นต่อได้'); } }
function send(data) { if (socket?.readyState !== WebSocket.OPEN) { toast('ยังเชื่อมต่อไม่ได้ กดเชื่อมต่อใหม่แล้วลองอีกครั้ง'); return false; } socket.send(JSON.stringify(data)); return true; }
const brand = `<a class="brand" href="/" aria-label="Cozy Social หน้าหลัก"><b>✿</b><span>cozy social<small>พื้นที่เล็ก ๆ ของพวกเรา</small></span></a>`;
function creator() {
 screen = 'creator'; keys.clear(); destination = null; walkPath = []; roomView?.destroy();
 app.innerHTML = `<main class="dressing"><header>${brand}<nav><span class="current">01 &nbsp; เป็นตัวเอง</span><i></i><span>02 &nbsp; ไปเจอเพื่อน</span></nav><button class="circle" id="help" aria-label="วิธีเล่น">?</button></header>
 <div class="dressing-title"><span class="eyebrow">MAKE YOURSELF AT HOME</span><h1>วันนี้ อยากเป็นแบบไหน?</h1><p>เลือกลุคที่ชอบ แล้วไปสร้างความทรงจำกับเพื่อนกัน</p></div>
 <section class="wardrobe"><aside class="paper identity"><span class="eyebrow">HELLO, LITTLE YOU</span><h2>ยินดีที่ได้รู้จัก ♡</h2><label for="nickname">ให้เพื่อนเรียกว่าอะไรดี?</label><input id="nickname" maxlength="20" placeholder="ชื่อเล่นของคุณ" value="${safe(profile.name)}" autocomplete="nickname"><p class="muted">ชื่อนี้จะอยู่เหนือหัวตัวละคร</p><div class="divider"></div><h3>เลือกลุคของคุณ <small>4 สไตล์</small></h3><div class="portrait-grid">${LOOKS.map((l,i) => `<button data-look="${i}" class="portrait ${i===profile.look?'selected':''}" aria-label="${l.name}" aria-pressed="${i===profile.look}">${avatar(i)}<span>${l.name}</span></button>`).join('')}</div><div class="gentle-note">✿ &nbsp; ไม่ต้องรีบ เป็นตัวเองได้เต็มที่</div></aside>
 <div class="character-stage"><div class="stage-tag"><span></span> ห้องแต่งตัวของคุณ</div><div class="hero-character">${avatar(profile.look, 'full')}</div><div class="character-ground"></div><div class="name-chip">♡ &nbsp; <span id="name-preview">${safe(profile.name || 'เพื่อนใหม่')}</span></div><button class="random" id="random">⤨ &nbsp; สุ่มลุควันนี้</button><button class="studio-button" id="preview-rig">☺ ดูมุมมองและท่าตัวละคร</button></div>
 <aside class="paper outfit"><span class="eyebrow">YOUR COZY WARDROBE</span><h2>ลุคเล็ก ๆ ที่เป็นคุณ</h2><div class="look-preview">${avatar(profile.look)}<div><b id="look-name">${LOOKS[profile.look].name}</b><small>คอลเลกชัน Everyday Friends</small></div><span class="check">✓</span></div><div class="outfit-detail" id="outfit-detail"></div><div class="palette"><span style="background:#80523b"></span><span style="background:#f2dec1"></span><span style="background:#97aa8c"></span><span style="background:#dcac9b"></span><small>อบอุ่น เรียบง่าย ใกล้ตัว</small></div><p class="collection-note">ลุคสำเร็จทั้งชุด 4 แบบ<br>ทรงผม เสื้อผ้า และเครื่องประดับเปลี่ยนไปด้วยกัน</p><div class="friends-note"><span>☁</span><div><b>เพื่อน ๆ กำลังรออยู่</b><p>สร้างห้องส่วนตัว ชวนกันมาได้ถึง 10 คน</p></div></div></aside></section>
 <footer class="dressing-footer"><span>✧ &nbsp; วันธรรมดา ก็พิเศษได้เมื่ออยู่ด้วยกัน</span><button class="primary" id="continue">บันทึกลุค แล้วไปเจอเพื่อน <b>→</b></button></footer></main>`;
 updateOutfit();
 document.querySelectorAll('[data-look]').forEach(b => b.onclick = () => chooseLook(+b.dataset.look));
 $('#nickname').oninput = e => { profile.name = e.target.value; $('#name-preview').textContent = profile.name || 'เพื่อนใหม่'; };
 $('#preview-rig').onclick=()=>openCharacterStudio(()=>profile.look);
 $('#random').onclick = () => chooseLook((profile.look + 1 + Math.floor(Math.random()*3)) % 4);
 $('#help').onclick = () => toast('เลือกลุคและตั้งชื่อ → สร้างห้องหรือใส่รหัสเพื่อน → เดิน คุย และเล่นด้วยกัน');
 $('#continue').onclick = () => { profile.name = profile.name.trim() || 'เพื่อนใหม่'; save(); if (room) { send({type:'look',look:profile.look}); lobby(); } else entrance(); };
}
function updateOutfit() {
 const details = [ ['ผมลอนน้ำตาล','คาร์ดิแกนครีม','กระโปรงลายสก็อต','รองเท้าหนัง + กระเป๋าน้องหมี'], ['ผมสั้นน้ำตาล','คาร์ดิแกนถักสีครีม','กางเกงขายาวสีน้ำตาล','สนีกเกอร์ + กระเป๋าสะพาย'], ['ผมบ๊อบชมพู','คาร์ดิแกนสีเซจ','กระโปรงสีครีม','สนีกเกอร์ + กระเป๋าครีม'], ['ผมบลอนด์','คาร์ดิแกนสีฟ้าหม่น','กางเกงขาสั้นสีกรม','สนีกเกอร์ + กระเป๋าสะพาย'] ][profile.look];
 $('#outfit-detail').innerHTML = details.map((s,i) => `<div><span>${['〰','♧','▥','♡'][i]}</span><div><small>${['ทรงผม','เสื้อ','ท่อนล่าง','รองเท้าและของคู่ใจ'][i]}</small><b>${s}</b></div><em>✓</em></div>`).join('');
}
function chooseLook(i) {
 profile.look = i;
 document.querySelectorAll('[data-look]').forEach(b => { b.classList.toggle('selected', +b.dataset.look===i); b.setAttribute('aria-pressed', String(+b.dataset.look===i)); });
 $('.hero-character .avatar').style.setProperty('--look',i); $('.look-preview .avatar').style.setProperty('--look',i); $('#look-name').textContent=LOOKS[i].name; updateOutfit();
}
function entrance() {
 screen = 'entrance';
 const invite = new URLSearchParams(location.search).get('room') || '';
 app.innerHTML = `<main class="entry"><header>${brand}<button class="soft" id="edit-look">← กลับไปแต่งตัว</button></header><section class="entry-card paper"><span class="eyebrow">GOOD TIMES, BETTER TOGETHER</span><h1>ห้องเล็ก ๆ<br>สำหรับพวกเรา</h1><p>แวะมาคุย พักใจ หรือชวนกันทำอะไรสนุก ๆ</p><div class="entry-avatar">${avatar(profile.look)}</div><div class="connection" id="connection"></div><button class="primary" id="create-room">＋ สร้างห้องใหม่ <small>สูงสุด 10 คน</small></button><div class="or">หรือเข้าห้องของเพื่อน</div><form id="join-form"><input aria-label="รหัสห้อง" id="room-code" placeholder="รหัสห้อง 6 ตัว" maxlength="6" pattern="[A-Fa-f0-9]{6}" required value="${safe(invite.slice(0,6))}"><button class="soft" type="submit">เข้าร่วม →</button></form><small class="muted">ห้องส่วนตัว · แชตข้อความ · มินิเกม 2 แบบ</small></section></main>`;
 $('#edit-look').onclick = creator;
 $('#create-room').onclick = () => send({type:'create', ...profile});
 $('#join-form').onsubmit = e => { e.preventDefault(); send({type:'join',code:$('#room-code').value.trim().toUpperCase(), ...profile}); };
 showConnection();
}
function showConnection() {
 const el = $('#connection'); if (!el) return;
 el.replaceChildren();
 el.textContent = connection === 'online' ? '● พร้อมเจอเพื่อนแล้ว' : connection === 'connecting' ? '◌ กำลังเชื่อมต่อ…' : '○ การเชื่อมต่อขาดหาย ';
 if (connection === 'offline') { const b=document.createElement('button'); b.textContent='เชื่อมต่อใหม่'; b.className='soft'; b.onclick=connect; el.append(b); }
}
function connect() {
 if (socket && socket.readyState < 2) return;
 connection='connecting'; showConnection();
 socket = new WebSocket(`${location.protocol==='https:'?'wss':'ws'}://${location.host}/ws`);
 socket.onopen = () => { connection='online'; showConnection(); };
 socket.onmessage = e => {
  const data=JSON.parse(e.data);
  if (data.type==='network') lanHosts=data.hosts;
  if (data.type==='error') toast(data.message);
  if (data.type==='joined') myId=data.id;
  if (data.type==='left') { room=null; entrance(); }
  if (data.type==='state') { room=data.room; clockOffset=room.now-Date.now(); if (screen!=='lobby' && screen!=='creator-in-room') lobby(); updateLobby(); }
 };
 socket.onclose = () => { connection='offline'; const wasRoom=!!room; room=null; destination=null; keys.clear(); if(wasRoom) { entrance(); toast('หลุดจากห้องแล้ว เชื่อมต่อใหม่และใส่รหัสห้องอีกครั้ง'); } showConnection(); };
 socket.onerror = () => { connection='offline'; showConnection(); };
}
function lobby() {
 screen='lobby'; lastPlayers=lastMessages=lastGame=''; roomView?.destroy(); destination=null; walkPath=[];
 app.innerHTML=`<main class="social-shell"><header>${brand}<div class="room-badge"><span class="online-dot"></span> บ้านของพวกเรา <b>${room.code}</b></div><button class="soft" id="invite">↗ ชวนเพื่อน</button></header><div class="room-layout"><aside class="room-sidebar paper"><span class="eyebrow">OUR LITTLE HOME</span><h2>มาอยู่ด้วยกันนะ</h2><p class="muted">คุยเล่นได้ ไม่ต้องมีแผนก็ได้</p><div class="section-label">เพื่อนในห้อง <b id="count"></b></div><div id="players"></div><div class="sidebar-bottom"><button id="change-look" class="soft">✿ เปลี่ยนลุค</button><button id="leave" class="text-button">ออกจากห้อง ↗</button></div></aside><section class="room-center"><div class="world-wrap"><div class="world-heading"><span id="world-title">☀ มุมพักใจ</span><span id="world-status">เวลาของพวกเรา</span></div><canvas id="world" width="1000" height="660" tabindex="0" aria-label="พื้นที่เดินเล่น ใช้ WASD หรือลูกศร คลิกหรือแตะพื้นเพื่อเดิน กด E เพื่อทำงาน"></canvas><div class="world-bottom"><span><kbd>W A S D</kbd> เดิน &nbsp; <kbd>E</kbd> ทำงาน · แตะพื้นเพื่อเดิน</span><button class="soft" id="action">✦ ลงมือทำ</button></div></div><div class="game-controls paper"><div><span class="eyebrow">LET'S MAKE A LITTLE MEMORY</span><h2 id="game-heading">วันนี้ เล่นอะไรดี?</h2></div><div class="game-options">${Object.entries(GAMES).map(([id,g])=>`<button class="game-card ${id===selectedGame?'selected':''}" data-game="${id}"><span>${g.icon}</span><div><b>${g.name}</b><small>${g.english}</small></div><i>↗</i></button>`).join('')}</div><div class="mode-row"><div class="segmented"><button data-mode="coop" class="${mode==='coop'?'selected':''}">♡ ช่วยกันทั้งห้อง</button><button data-mode="pairs" class="${mode==='pairs'?'selected':''}">⚑ ทีมละ 2 คน</button></div><button id="start" class="primary">เริ่มเล่น →</button></div><p id="game-help" class="muted"></p><div id="scores"></div></div></section><aside class="chat paper"><div class="chat-title"><h2>คุยกันหน่อย ♡</h2><span>แชตในห้อง</span></div><div id="messages" role="log" aria-live="polite"></div><div class="emotes">${['👋','♡','✨','😂'].map(e=>`<button data-emote="${e}" aria-label="ส่งอีโมต ${e}">${e}</button>`).join('')}</div><form id="chat-form"><input id="chat-input" aria-label="ข้อความแชต" placeholder="วันนี้เป็นยังไงบ้าง…" maxlength="240" required autocomplete="off"><button aria-label="ส่งข้อความ">↑</button></form><small class="chat-note">พื้นที่สบาย ๆ ส่งความใจดีให้กัน</small></aside></div><footer class="social-footer">✿ &nbsp; Little moments. Lovely memories.<span>ห้องส่วนตัว · สูงสุด 10 คน</span></footer></main>`;
 $('#invite').onclick=()=>{
  const url=new URL(location.href);url.searchParams.set('room',room.code);
  const local=['localhost','127.0.0.1','[::1]'].includes(url.hostname);
  const dialog=document.createElement('dialog');dialog.className='invite-dialog paper';
  dialog.innerHTML=`<h2>ชวนเพื่อนมาอยู่ด้วยกัน ♡</h2><p>รหัสห้อง <strong>${room.code}</strong></p>${local?'<p class="muted">เล่นผ่าน Wi-Fi เดียวกัน: เลือก IP ของเครื่องนี้<br>เพื่อนนอกเครือข่ายต้องใช้เซิร์ฟเวอร์ที่เปิดออนไลน์</p>':''}<label for="invite-link">ลิงก์เข้าห้อง</label><input id="invite-link" readonly>${local&&lanHosts.length?'<select aria-label="ที่อยู่เครือข่าย" id="network-choice"></select>':''}<div><button class="soft" id="close-invite">ปิด</button><button class="primary" id="copy-invite">คัดลอกลิงก์</button></div>`;
  document.body.append(dialog);
  if(local&&lanHosts.length){url.hostname=lanHosts[0];const select=dialog.querySelector('select');lanHosts.forEach(ip=>{const o=document.createElement('option');o.value=ip;o.textContent=ip;select.append(o);});select.onchange=()=>{url.hostname=select.value;$('#invite-link').value=url.href;};}
  $('#invite-link').value=url.href;
  $('#close-invite').onclick=()=>dialog.close();dialog.onclose=()=>dialog.remove();
  $('#copy-invite').onclick=async()=>{try{await navigator.clipboard.writeText($('#invite-link').value);toast('คัดลอกลิงก์แล้ว ส่งให้เพื่อนได้เลย');}catch{$('#invite-link').select();toast('เลือกลิงก์ไว้แล้ว กดคัดลอกเพื่อส่งให้เพื่อน');}};
  dialog.showModal();
 };
 $('#leave').onclick=()=>send({type:'leave'});
 $('#change-look').onclick=()=>{ creator(); screen='creator-in-room'; $('#nickname').disabled=true; };
 document.querySelectorAll('[data-emote]').forEach(b=>b.onclick=()=>send({type:'emote',emote:b.dataset.emote}));
 $('#chat-form').onsubmit=e=>{e.preventDefault();if(send({type:'chat',text:$('#chat-input').value})) $('#chat-input').value='';};
 document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>{selectedGame=b.dataset.game;lastGame='';updateLobby();});
 document.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;lastGame='';updateLobby();});
 $('#start').onclick=()=>send(room.game ? {type:'lobby'} : {type:'start',game:selectedGame,mode});
 $('#action').onclick=()=>send({type:'action'});
 roomView=new RoomView($('#world'),{getRoom:()=>room,getId:()=>myId,send,toast,onWalk:point=>{
  const me=room.players.find(p=>p.id===myId);if(!point||!me){destination=null;walkPath=[];return;}
  walkPath=pathfind(room.layout.items,me,point);destination=walkPath.shift();if(!destination)toast('เลือกช่องว่างที่เดินไปถึงได้นะ');
 }});

 updateLobby();
}
function updateLobby() {
 if(screen!=='lobby'||!room)return;
 const people=JSON.stringify(room.players.map(p=>[p.id,p.name,p.look]));
 if(people+room.host!==lastPlayers){lastPlayers=people+room.host;$('#count').textContent=`${room.players.length} / 10`;$('#players').innerHTML=room.players.map(p=>`<div class="person">${avatar(p.look)}<div><b>${safe(p.name)} ${p.id===myId?'<small>(คุณ)</small>':''}</b><small>${p.id===room.host?'♔ เจ้าของห้อง':'พร้อมใช้เวลาด้วยกัน'}</small></div><span class="online-dot"></span></div>`).join('')+Array.from({length:Math.max(0,Math.min(3,10-room.players.length))},()=>'<div class="empty-seat"><span>＋</span> ที่ว่างสำหรับเพื่อน</div>').join('');}
 const messages=JSON.stringify(room.messages);
 if(messages!==lastMessages){lastMessages=messages;const box=$('#messages');const bottom=box.scrollHeight-box.scrollTop-box.clientHeight<60;box.innerHTML=room.messages.map(m=>m.system?`<p class="system-message">${safe(m.text)}</p>`:`<div class="message ${m.name===profile.name?'own':''}"><b>${safe(m.name)}</b><p>${safe(m.text)}</p></div>`).join('');if(bottom)box.scrollTop=box.scrollHeight;}
 const state=JSON.stringify([room.game,room.host,selectedGame,mode]);
 if(state!==lastGame){lastGame=state;const g=room.game;$('#world-title').textContent=g?`${GAMES[g.kind].icon} ${GAMES[g.kind].name}`:'☀ มุมพักใจ';$('#game-heading').textContent=g?(g.status==='finished'?'เก่งมาก ขอบคุณที่ช่วยกัน ♡':'ช่วยกันทีละนิด สนุกไปด้วยกัน'):'วันนี้ เล่นอะไรดี?';$('#start').disabled=room.host!==myId;$('#start').textContent=room.host!==myId?'รอเจ้าของห้อง':g?'กลับห้องพัก':'เริ่มเล่น →';$('#action').hidden=!g||g.status!=='playing';$('.game-options').hidden=!!g;$('.mode-row .segmented').hidden=!!g;
 document.querySelectorAll('[data-game]').forEach(b=>b.classList.toggle('selected',b.dataset.game===selectedGame));document.querySelectorAll('[data-mode]').forEach(b=>b.classList.toggle('selected',b.dataset.mode===mode));
 const team=g?.teams.find(t=>t.members.includes(myId));
 $('#game-help').textContent=g?(g.status==='finished'?'หมดเวลาแล้ว! เจ้าของห้องกดกลับห้องพักเพื่อเริ่มรอบใหม่':team?`${GAMES[g.kind].steps.join(' → ')} · ทุกคนในทีมทำงานต่อกันได้ · ปรุง/ประกอบใช้เวลา 3 วินาที`:'คุณเข้ามาระหว่างเกม ดูเพื่อนเล่นก่อน แล้วร่วมรอบถัดไปได้เลย'): `${GAMES[selectedGame].description} · รอบละ 2 นาที${mode==='pairs'?' · จับคู่ตามลำดับเข้าห้อง ต้องมีจำนวนคนคู่':' · ลองคนเดียวหรือชวนเพื่อนมาช่วยได้'}`;
 $('#scores').innerHTML=g?g.teams.map(t=>`<div class="score ${t.members.includes(myId)?'my-team':''}"><b>${g.mode==='coop'?'ทุกคนในห้อง':`ทีม ${t.id+1}`}</b><span>${t.members.map(id=>safe(room.players.find(p=>p.id===id)?.name||'ออกจากห้อง')).join(' + ')}</span><strong>${t.score} <small>แต้ม</small></strong></div>`).join(''):'';
 }
 const g=room.game;$('#world-status').textContent=g?.status==='playing'?`◷ ${Math.max(0,Math.ceil((g.endsAt-Date.now()-clockOffset)/1000))} วินาที`:g?'จบรอบแล้ว ♡':'เวลาของพวกเรา';
}

function draw(time) {
 requestAnimationFrame(draw);
 const delta=Math.min(.05,(time-lastFrame)/1000||0);lastFrame=time;
 if(screen!=='lobby'||!room)return;
 const me=room.players.find(p=>p.id===myId);
 if(me){let dx=0,dy=0; const typing=['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||!!document.querySelector('dialog[open]');
 if(!typing){dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0);dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0);}
 if(roomView?.build){dx=dy=0;destination=null;walkPath=[];}
 if(dx||dy){destination=null;walkPath=[];const screenX=dx;dx=screenX+dy*2;dy=dy*2-screenX;}
 if(destination){dx=destination.x-me.x;dy=destination.y-me.y;if(Math.hypot(dx,dy)<5){dx=dy=0;destination=walkPath.shift();}}
 if(dx||dy){const norm=Math.hypot(dx,dy);const distance=destination?Math.min(170*delta,norm):170*delta;const nx=Math.max(WORLD.left,Math.min(WORLD.right,me.x+dx/norm*distance)),ny=Math.max(WORLD.top,Math.min(WORLD.bottom,me.y+dy/norm*distance));
 if(walkable(room.layout.items,nx,ny)){me.x=nx;me.y=ny;me.moving=true;const sx=dx-dy,sy=dx+dy;me.direction=Math.abs(sx)>Math.abs(sy)*.5?(sx>0?'right':'left'):(sy>0?'down':'up');if(time-lastMove>45){send({type:'move',x:me.x,y:me.y});lastMove=time;}}else{destination=null;walkPath=[];}}

 }
 roomView?.draw(room,myId,time,clockOffset,destination?[destination,...walkPath]:[]);
 updateLobby();
}
window.addEventListener('keydown',e=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement?.tagName)||document.querySelector('dialog[open]'))return;const key=e.key.toLowerCase();if(screen==='lobby'&&['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright','e',' '].includes(key)){e.preventDefault();keys.add(key);if(key==='e'&&!e.repeat)send({type:'action'});}});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));window.addEventListener('blur',()=>{keys.clear();destination=null;walkPath=[];});document.addEventListener('visibilitychange',()=>{if(document.hidden){keys.clear();destination=null;walkPath=[];}});
creator();connect();requestAnimationFrame(draw);

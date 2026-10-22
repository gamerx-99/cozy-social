import WebSocket from 'ws';
import assert from 'node:assert/strict';
const clients=[];
async function client() {
 const socket=new WebSocket('ws://127.0.0.1:5188/ws');const messages=[];
 socket.on('message',raw=>messages.push(JSON.parse(raw)));
 await new Promise((resolve,reject)=>{socket.once('open',resolve);socket.once('error',reject);});
 const c={socket,messages,send(data){socket.send(JSON.stringify(data));}};clients.push(c);return c;
}
async function wait(c,predicate){const end=Date.now()+5000;while(Date.now()<end){const found=c.messages.find(predicate);if(found)return found;await new Promise(r=>setTimeout(r,20));}throw new Error('Timed out waiting for network event');}
try{
 const host=await client();host.send({type:'create',name:'Host'});const state=await wait(host,m=>m.type==='state');const code=state.room.code;
 for(let i=1;i<10;i++){const c=await client();c.send({type:'join',code,name:`Friend ${i}`});await wait(c,m=>m.type==='joined');}
 await wait(host,m=>m.type==='state'&&m.room.players.length===10);
 const extra=await client();extra.send({type:'join',code,name:'Eleventh'});const failure=await wait(extra,m=>m.type==='error');assert.match(failure.message,/10\/10/);
 host.send({type:'start',game:'makeover',mode:'pairs'});const running=await wait(host,m=>m.room?.game?.status==='playing');assert.equal(running.room.game.teams.length,5);
 for(const c of clients.slice(1,10))await wait(c,m=>m.room?.game?.teams.length===5);
 console.log('PASS: real WebSocket room with 10 players, 11th rejected, five pairs synced to all clients.');
}finally{for(const c of clients)c.socket.close();}

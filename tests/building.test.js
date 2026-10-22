import { test } from 'node:test';
import assert from 'node:assert/strict';
import { Rooms } from '../server/rooms.js';
import { GRID,project,unproject,initialLayout,footprint,validatePlacement,pathfind,blocked } from '../shared/building.js';
const socket=()=>({readyState:1,messages:[],send(raw){this.messages.push(JSON.parse(raw));}});
function setup(){let now=100000;const rooms=new Rooms({now:()=>now}),host=socket(),guest=socket();rooms.handle(host,{type:'create'});const room=rooms.rooms.get(host.roomCode);rooms.handle(guest,{type:'join',code:room.code});return{rooms,host,guest,room,advance(ms){now+=ms;},build(data,who=host){rooms.handle(who,{type:'build',revision:room.layout.revision,...data});}};}
test('isometric screen/world projection round-trips throughout the map',()=>{for(let x=0;x<=720;x+=40)for(let y=0;y<=560;y+=40){const p=project(x,y),q=unproject(p.x,p.y);assert.ok(Math.abs(q.x-x)<.001&&Math.abs(q.y-y)<.001);}});
test('rotation swaps occupied dimensions',()=>{assert.deepEqual(footprint({kind:'desk',rotation:0}),{w:2,h:1});assert.deepEqual(footprint({kind:'desk',rotation:1}),{w:1,h:2});});
test('placement rejects overlaps, invalid coordinates, occupied players and service corridor',()=>{
 const items=initialLayout().items;
 const at=(x,y,kind='plant')=>({id:'new',kind,x,y,rotation:0});
 assert.equal(validatePlacement(items,at(5,5)),null);
 assert.ok(validatePlacement(items,at(1,0)));assert.ok(validatePlacement(items,at(5,9)));assert.ok(validatePlacement(items,at(18,5)));assert.ok(validatePlacement(items,at(NaN,5)));assert.ok(validatePlacement(items,at(5,5,'__proto__')));
 assert.ok(validatePlacement(items,at(5,5),[{x:220,y:220}]));
});
test('cannot seal off a free pocket with furniture',()=>{
 const items=[{id:'a',kind:'plant',x:0,y:1,rotation:0}];
 assert.match(validatePlacement(items,{id:'b',kind:'plant',x:1,y:0,rotation:0}),/ปิดทาง/);
});
test('pathfinding routes around solid furniture and never enters blocked cells',()=>{
 const items=initialLayout().items,start={x:60,y:420},end={x:500,y:180},path=pathfind(items,start,end);assert.ok(path.length>0);
 let previous=start;for(const p of path){assert.ok(!blocked(items,Math.floor(p.x/40),Math.floor(p.y/40)));assert.equal(Math.abs(previous.x-p.x)+Math.abs(previous.y-p.y),40);previous=p;}
 assert.equal(pathfind(items,start,{x:60,y:20}).length,0);
});
test('host placement, movement, floor paint and deletion sync to the other player',()=>{
 const s=setup();s.build({op:'place',kind:'plant',x:5,y:5,rotation:0});assert.equal(s.room.layout.revision,1);
 const item=s.room.layout.items.at(-1);assert.equal(s.guest.messages.at(-1).room.layout.items.at(-1).id,item.id);
 s.build({op:'move',id:item.id,x:6,y:5,rotation:1});assert.equal(s.room.layout.items.at(-1).x,6);
 s.build({op:'floor',x:5,y:5,floor:'sage'});assert.equal(s.room.layout.floors[5*GRID.cols+5],'sage');
 s.build({op:'remove',id:item.id});assert.ok(!s.room.layout.items.some(i=>i.id===item.id));assert.equal(s.room.layout.revision,4);
});
test('unauthorized, stale and mid-game build requests cannot change layout',()=>{
 const s=setup(),request={op:'place',kind:'plant',x:5,y:5,rotation:0};s.build(request,s.guest);assert.equal(s.room.layout.revision,0);
 s.rooms.handle(s.host,{type:'build',revision:-1,...request});assert.equal(s.room.layout.revision,0);
 s.rooms.handle(s.host,{type:'start',game:'kitchen',mode:'coop'});s.build(request);assert.equal(s.room.layout.revision,0);
});
test('movement sweep prevents crossing a one-cell obstacle even at maximum packet distance',()=>{
 const s=setup();s.room.layout.items=[{id:'obstacle',kind:'plant',x:3,y:5,rotation:0}];const p=s.room.players.get(s.host.playerId);p.x=100;p.y=220;s.advance(300);s.rooms.handle(s.host,{type:'move',x:169,y:220});assert.ok(p.x<120);assert.equal(p.y,220);
});
test('late join receives current layout and new host can continue editing',()=>{
 const s=setup();s.build({op:'place',kind:'plant',x:5,y:5,rotation:0});const late=socket();s.rooms.handle(late,{type:'join',code:s.room.code});assert.equal(late.messages.at(-1).room.layout.revision,1);
 s.rooms.leave(s.host);s.build({op:'place',kind:'plant',x:6,y:5,rotation:0},s.guest);assert.equal(s.room.layout.revision,2);
});

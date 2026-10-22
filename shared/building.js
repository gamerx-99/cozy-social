// Deterministic grid shared by server collision, builder, and client pathfinding.
export const GRID={cols:18,rows:14,cell:40,tileW:52,tileH:26,originX:448,originY:180};
export const CATALOG={
 desk:{name:'โต๊ะทำงาน',icon:'🖥️',w:2,h:1,sprite:0,height:100},
 chair:{name:'เก้าอี้ชมพู',icon:'🪑',w:1,h:1,sprite:1,height:87},
 sofa:{name:'โซฟาครีม',icon:'🛋️',w:2,h:1,sprite:2,height:95},
 shelf:{name:'ชั้นหนังสือ',icon:'📚',w:2,h:1,sprite:3,height:160},
 coffee:{name:'เคาน์เตอร์กาแฟ',icon:'☕',w:2,h:1,sprite:4,height:110},
 plant:{name:'ต้นไม้กระถาง',icon:'🪴',w:1,h:1,sprite:5,height:96},
 table:{name:'โต๊ะส่วนกลาง',icon:'📔',w:2,h:2,sprite:6,height:115},
 wall:{name:'ผนังแบ่งห้อง',icon:'▥',w:2,h:1,sprite:7,height:100},
 sage:{name:'โซฟาเซจ',icon:'🛋️',w:2,h:1,sprite:8,height:95},
 rug:{name:'พรมทอ',icon:'◈',w:3,h:2,height:0,walkable:true},
 bed:{name:'เตียงไม้ผ้าห่มเซจ',icon:'🛏️',w:2,h:3,sprite:0,atlas:'extra',height:110},
 teaTable:{name:'โต๊ะน้ำชาทรงกลม',icon:'🫖',w:2,h:2,sprite:1,atlas:'extra',height:65},
 beanbag:{name:'บีนแบ็กสีฟ้า',icon:'🛋️',w:1,h:1,sprite:2,atlas:'extra',height:65},
 lamp:{name:'โคมไฟตั้งพื้น',icon:'💡',w:1,h:1,sprite:3,atlas:'extra',scale:.6,height:130},
 fridge:{name:'ตู้เย็นสีชมพู',icon:'🧊',w:1,h:1,sprite:4,atlas:'extra',height:120},
 sink:{name:'เคาน์เตอร์อ่างล้างจาน',icon:'🚰',w:2,h:1,sprite:5,atlas:'extra',height:90},
 stove:{name:'เตาอบพร้อมเคาน์เตอร์',icon:'🍳',w:2,h:1,sprite:6,atlas:'extra',height:90},
 cabinet:{name:'ตู้ไม้เก็บของ',icon:'🗄️',w:2,h:1,sprite:7,atlas:'extra',height:85},
 catTree:{name:'คอนโดแมว',icon:'🐈',w:1,h:1,sprite:8,atlas:'extra',height:110}
};
export const FURNITURE_CATEGORIES={all:{name:'ทั้งหมด',items:Object.keys(CATALOG)},living:{name:'นั่งเล่น',items:['sofa','sage','chair','table','teaTable','beanbag','rug']},work:{name:'ทำงาน / เก็บของ',items:['desk','shelf','cabinet']},kitchen:{name:'ครัว',items:['coffee','fridge','sink','stove']},cozy:{name:'พักผ่อน / ตกแต่ง',items:['bed','lamp','plant','wall','catTree']}};
export const FLOOR_COLORS={oak:'#dfb081',cream:'#ead7b5',sage:'#b6c2a1',rose:'#dec1b5'};
export const SERVICE_CELLS=[{x:4,y:8},{x:9,y:8},{x:14,y:8}];
export function project(x,y,z=0){return{x:GRID.originX+(x-y)/40*26,y:GRID.originY+(x+y)/40*13-z};}
export function unproject(x,y){const a=(x-GRID.originX)/26,b=(y-GRID.originY)/13;return{x:(a+b)*20,y:(b-a)*20};}
export function footprint(i){const a=CATALOG[i.kind];return i.rotation===1?{w:a.h,h:a.w}:{w:a.w,h:a.h};}
export function covers(i,x,y){const{w,h}=footprint(i);return x>=i.x&&x<i.x+w&&y>=i.y&&y<i.y+h;}
export function blocked(items,x,y){return x<0||y<0||x>=GRID.cols||y>=GRID.rows||items.some(i=>!CATALOG[i.kind].walkable&&covers(i,x,y))||SERVICE_CELLS.some(s=>x>=s.x&&x<s.x+2&&y===s.y);}
export function walkable(items,x,y){return !blocked(items,Math.floor(x/40),Math.floor(y/40));}
export function pathfind(items,from,to){
 const start={x:Math.floor(from.x/40),y:Math.floor(from.y/40)},end={x:Math.floor(to.x/40),y:Math.floor(to.y/40)};
 if(blocked(items,end.x,end.y))return[];
 const key=p=>`${p.x},${p.y}`,queue=[start],parents=new Map([[key(start),null]]);
 for(let n=0;n<queue.length;n++){const p=queue[n];if(key(p)===key(end)){const path=[];let cur=p;while(parents.get(key(cur))){path.unshift({x:cur.x*40+20,y:cur.y*40+20});cur=parents.get(key(cur));}return path;}
 for(const[dx,dy]of[[1,0],[0,1],[-1,0],[0,-1]]){const q={x:p.x+dx,y:p.y+dy};if(!blocked(items,q.x,q.y)&&!parents.has(key(q))){parents.set(key(q),p);queue.push(q);}}}return[];
}
export function validatePlacement(items,item,players=[]){
 if(!Object.hasOwn(CATALOG,item.kind)||![0,1].includes(item.rotation)||!Number.isInteger(item.x)||!Number.isInteger(item.y))return'ชิ้นส่วนหรือตำแหน่งไม่ถูกต้อง';
 const{w,h}=footprint(item);if(item.x<0||item.y<0||item.x+w>GRID.cols||item.y+h>GRID.rows)return'วางนอกพื้นที่ห้องไม่ได้';
 for(let y=item.y;y<item.y+h;y++)for(let x=item.x;x<item.x+w;x++){
 if(y>=8&&y<=10)return'เว้นทางเดินและพื้นที่มินิเกมไว้ก่อนนะ';
 if(items.some(i=>i.id!==item.id&&!!CATALOG[i.kind].walkable===!!CATALOG[item.kind].walkable&&covers(i,x,y)))return'ตำแหน่งนี้มีของอยู่แล้ว';
 if(!CATALOG[item.kind].walkable&&players.some(p=>Math.floor(p.x/40)===x&&Math.floor(p.y/40)===y))return'มีเพื่อนยืนอยู่ตรงนี้';}
 if(!CATALOG[item.kind].walkable){const next=[...items.filter(i=>i.id!==item.id),item],visited=new Set(),queue=[{x:1,y:10}];
 for(let n=0;n<queue.length;n++){const p=queue[n],k=`${p.x},${p.y}`;if(visited.has(k)||blocked(next,p.x,p.y))continue;visited.add(k);for(const[dx,dy]of[[1,0],[0,1],[-1,0],[0,-1]])queue.push({x:p.x+dx,y:p.y+dy});}
 for(let y=0;y<GRID.rows;y++)for(let x=0;x<GRID.cols;x++)if(!blocked(next,x,y)&&!visited.has(`${x},${y}`))return'อย่าปิดทางเดินจนเข้ามุมห้องไม่ได้นะ';}
 return null;
}
export function initialLayout(){
 const list=[['shelf',1,0,0],['shelf',4,0,0],['plant',7,0,0],['sage',1,3,0],['rug',1,4,0],['table',2,5,0],['plant',0,6,0],['wall',8,1,1],['wall',8,4,1],['desk',11,1,0],['chair',12,3,0],['desk',14,1,0],['chair',15,3,0],['plant',17,1,0],['desk',11,5,0],['chair',12,7,0],['plant',16,6,0],['coffee',1,12,0],['plant',0,11,0],['sofa',10,12,0],['rug',12,11,0],['sofa',16,11,1],['plant',17,13,0],['plant',7,12,0]];
 return{revision:0,items:list.map(([kind,x,y,rotation],i)=>({id:`seed-${i}`,kind,x,y,rotation})),floors:Array.from({length:GRID.rows},(_,y)=>Array.from({length:GRID.cols},(_,x)=>x<8&&y<8?'oak':x>=10&&y<8?'cream':y>10&&x>8?'rose':'oak')).flat()};
}

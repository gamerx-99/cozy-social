import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import {project,GRID} from '../shared/building.js';
const browser=await chromium.launch({channel:'chrome',headless:true});
const host=await browser.newPage({viewport:{width:1440,height:1000}}),guest=await browser.newPage({viewport:{width:1100,height:900}});
let state,other;const errors=[];
for(const [p,isHost]of[[host,true],[guest,false]]){p.on('pageerror',e=>errors.push(e.message));p.on('websocket',ws=>ws.on('framereceived',e=>{try{const d=JSON.parse(e.payload);if(d.type==='state'){if(isHost)state=d.room;else other=d.room;}}catch{}}));}
async function wait(check){const end=Date.now()+5000;while(Date.now()<end){if(check())return;await new Promise(r=>setTimeout(r,50));}throw new Error('State did not synchronize');}
async function clickCell(x,y,zoom=1){const canvas=host.locator('#world'),box=await canvas.boundingBox(),p=project(x*40+20,y*40+20);await canvas.click({position:{x:(500+(p.x-500)*zoom)/1000*box.width,y:(330+(p.y-330)*zoom)/660*box.height}});}
try{
 await host.goto('http://127.0.0.1:5188');
 for(let look=0;look<4;look++){
  await host.locator(`[data-look="${look}"]`).click();await host.locator('#preview-rig').click();await host.waitForTimeout(350);
  const front=await host.locator('#rig-preview').evaluate(el=>el.toDataURL());await host.locator('[data-facing="3"]').click();await host.waitForTimeout(100);const back=await host.locator('#rig-preview').evaluate(el=>el.toDataURL());assert.notEqual(front,back,`look ${look} back view`);
  await host.locator('[data-action="1"]').click();await host.waitForTimeout(100);assert.notEqual(back,await host.locator('#rig-preview').evaluate(el=>el.toDataURL()),`look ${look} carrying pose`);
  await host.locator('#rig-walk').check();await host.waitForTimeout(170);const frame=await host.locator('#rig-preview').evaluate(el=>el.toDataURL());await host.waitForTimeout(170);assert.notEqual(frame,await host.locator('#rig-preview').evaluate(el=>el.toDataURL()),`look ${look} animation`);
  await host.locator('#rig-close').click();
 }
 await host.locator('#nickname').fill('Builder');await host.locator('#continue').click();await host.locator('#connection').filter({hasText:'พร้อมเจอเพื่อน'}).waitFor();await host.locator('#create-room').click();await wait(()=>state);
 await guest.goto(`http://127.0.0.1:5188/?room=${state.code}`);await guest.locator('#nickname').fill('Friend');await guest.locator('#continue').click();await guest.locator('#connection').filter({hasText:'พร้อมเจอเพื่อน'}).waitFor();await guest.locator('#join-form button').click();await wait(()=>other?.players.length===2);
 await guest.locator('#build-toggle').click();assert.equal(await guest.locator('.build-panel').isVisible(),false);
 await host.bringToFront();await host.locator('#build-toggle').click();await host.locator('[data-piece="desk"]').click();await host.locator('#rotate-piece').click();await clickCell(5,5);await wait(()=>state.layout.revision===1&&other.layout.revision===1);
 const placed=state.layout.items.at(-1);assert.equal(placed.rotation,1);assert.equal(placed.x,5);assert.equal(placed.y,5);
 await host.locator('[data-tool="move"]').click();await clickCell(5,5);await clickCell(6,4);await wait(()=>state.layout.revision===2);assert.equal(state.layout.items.at(-1).x,6);
 await host.locator('[data-tool="remove"]').click();await clickCell(6,4);await wait(()=>state.layout.revision===3);assert.ok(!state.layout.items.some(i=>i.id===placed.id));
 await host.locator('#floor-choice').selectOption('sage');await clickCell(4,4);await wait(()=>other.layout.floors[4*GRID.cols+4]==='sage');
 await host.locator('[data-category="kitchen"]').click();assert.equal(await host.locator('[data-piece]:visible').count(),4);await host.locator('[data-piece="fridge"]').click();await clickCell(7,5);await wait(()=>state.layout.revision===5&&other.layout.revision===5);assert.equal(state.layout.items.at(-1).kind,'fridge');assert.ok(await host.locator('[data-thumb="fridge"]').evaluate(el=>{const d=el.getContext('2d').getImageData(0,0,84,74).data;return d.some((v,i)=>i%4===3&&v>0);}));
 await host.locator('[data-category="all"]').click();assert.equal(await host.locator('[data-piece]:visible').count(),19);
 await host.locator('[data-piece="plant"]').click();await host.locator('#zoom-in').click();await clickCell(5,5,1.2);await wait(()=>state.layout.revision===6&&other.layout.revision===6);
 await host.locator('#zoom-fit').click();await host.screenshot({path:'output/qa/isometric-build.png',fullPage:true});
 await host.locator('#rig-open').click();await host.locator('[data-facing="2"]').click();await host.locator('#rig-walk').check();await host.waitForTimeout(300);await host.screenshot({path:'output/qa/character-studio.png'});await host.locator('#rig-close').click();
 await host.setViewportSize({width:390,height:844});await host.screenshot({path:'output/qa/isometric-mobile.png',fullPage:true});assert.ok(await host.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
 assert.deepEqual(errors,[]);console.log('PASS: all four 4-direction character sheets/actions/animation, host-only builder, rotated placement, move, remove, floor paint, zoom hit testing, multiplayer sync, mobile overflow.');
}finally{await browser.close();}

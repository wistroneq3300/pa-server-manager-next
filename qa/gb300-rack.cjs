/* Isolated fixture/renderer acceptance. Never connect to a real device. */
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/kobei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const base=process.env.PA_PREVIEW_URL||'http://127.0.0.1:8769';
const output=path.join(__dirname,'artifacts');
const expected=[['BLANK-TOP-01',48,1,'blanking'],['BLANK-TOP-02',47,1,'blanking'],['SW-01',46,1,'switch'],['SW-02',45,1,'switch'],...Array.from({length:4},(_,i)=>[`PS-0${i+1}`,44-i,1,'powershelf']),['SERVER-04U',40,4,'server'],['SERVER-03U',36,3,'server'],['SERVER-02U',33,2,'server'],...Array.from({length:9},(_,i)=>[`NVLINK-0${i+1}`,31-i,1,'nvlink']),...Array.from({length:9},(_,i)=>[`SERVER-0${i+1}`,22-i,1,'server']),...Array.from({length:4},(_,i)=>[`PS-0${i+5}`,13-i,1,'powershelf']),['BLANK-RESERVE-05U',9,5,'blanking'],['CDU-01',4,4,'cdu']];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1600,height:1100}});
 const page=await context.newPage(),errors=[],external=[],results=[];
 page.on('pageerror',e=>errors.push(e.message));
 page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
 page.on('request',r=>{if(/^https?:/.test(r.url())&&!r.url().startsWith(base))external.push(r.url());});
 const ready=()=>page.waitForFunction(()=>document.querySelector('#ew-rack-canvas')?.dataset.rackState==='ready');
 const state=()=>page.evaluate(()=>document.querySelector('#ew-rack-canvas').paRackScene.getState());
 const settle=()=>page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
 const select=async name=>{await page.locator('#ew-rack-component').selectOption(name);await settle();};
 try{
  await page.goto(base+'/#/rack/proj_k');await ready();await settle();
  const initial=await state();assert.equal(initial.count,35);assert.equal(initial.occupiedU,48);assert.equal(initial.invalid.length,0);assert.equal(initial.geometryBuffers,36);
  for(const [name,top,size,type] of expected){const p=initial.placements.find(p=>p.name===name);assert.deepEqual(p,{name,type,top,bottom:top-size+1,size});}
  results.push('Exact approved 35-component / 48U arrangement; mixed 1/2/3/4U and 5U blank; 9 independent NVLink trays');
  await page.getByRole('button',{name:'Expand view',exact:true}).click();
  for(const theme of ['dark','light']){
   await page.evaluate(t=>applyTheme(t),theme);await settle();
   for(const view of ['Perspective','Front','Rear']){
    await page.getByRole('button',{name:view,exact:true}).click();await settle();
    await page.screenshot({path:path.join(output,`gb300-rack-${theme}-${view.toLowerCase()}.png`)});
    assert.equal((await state()).theme,theme);
   }
  }
  await page.evaluate(()=>applyTheme('dark'));
  await page.getByRole('button',{name:'Perspective',exact:true}).click();
  for(const name of ['SERVER-04U','SERVER-03U','SERVER-02U','SERVER-01','NVLINK-01','PS-01','SW-01','CDU-01']){
   await select(name);assert.equal((await state()).selected,name);
   await page.getByRole('button',{name:'Inspect in 3D',exact:true}).click();await settle();
   await page.screenshot({path:path.join(output,`gb300-detail-${name.toLowerCase()}.png`)});
  }
  results.push('Front/rear/orbit views, selection/focus and both material themes rendered');
  await page.getByRole('button',{name:'Reset',exact:true}).click();await settle();
  assert.equal((await state()).zoom,1);
  await page.locator('.ew-inspector-actions button').last().focus();await page.keyboard.press('Tab');
  assert.equal(await page.locator('.ew-expand').evaluate(e=>e===document.activeElement),true,'Expanded viewport traps focus inside its visible controls');
  await page.getByRole('button',{name:'Placement / type',exact:true}).click();await page.waitForSelector('#rm-move-u');
  assert.equal(await page.locator('.ew-rack-deck').evaluate(e=>e.classList.contains('is-expanded')),false,'Placement dialog must not be hidden behind the expanded stage');
  await page.locator('#rm-dialog .modal-head button').first().click();
  await page.getByRole('button',{name:'Expand view',exact:true}).click();
  await page.locator('#ew-rack-canvas').press('Escape');assert.equal(await page.locator('.ew-rack-deck').evaluate(e=>e.classList.contains('is-expanded')),false);
  await page.getByRole('button',{name:'Front',exact:true}).click();
  const box=await page.locator('#ew-rack-canvas').boundingBox();
  await page.mouse.move(box.x+box.width/2,box.y+box.height/2);await page.mouse.down();await page.mouse.move(box.x+box.width/2+80,box.y+box.height/2+25,{steps:8});await page.mouse.up();assert.notEqual((await state()).yaw,0);assert.equal((await state()).dragging,false);
  await page.getByRole('button',{name:'Reset',exact:true}).click();
  await page.evaluate(()=>{window.__qaOldRackScene=document.querySelector('#ew-rack-canvas').paRackScene;});
  await page.locator('.nav-btn[data-view="dashboard"]').click();await page.waitForSelector('#system-core');assert.equal(await page.evaluate(()=>__qaOldRackScene.getState().disposed),true);assert.equal(await page.evaluate(()=>__qaOldRackScene.getState().geometryBuffers),0);
  await page.goto(base+'/#/rack/proj_k');await ready();
  // Check two arbitrary units beyond the demonstration without changing application data.
  const dynamic=await page.evaluate(()=>{const scene=document.querySelector('#ew-rack-canvas').paRackScene;scene.setComponents([{name:'CUSTOM-07U',mgx_type:'nvlink',rack_u:40,rack_size:7},{name:'CUSTOM-06U',mgx_type:'pdu',rack_u:20,rack_size:6}]);return scene.getState();});
  assert.equal(dynamic.occupiedU,13);assert.equal(dynamic.placements[0].size,7);assert.equal(dynamic.placements[1].bottom,15);
  await page.reload();await ready();assert.equal((await state()).count,35);
  results.push('Drag gestures, full-rack reset, expanded-view Escape, cleanup and arbitrary 6U/7U models verified');
  const svgAudit=await page.evaluate(()=>{
   const kinds=['server','switch','nvlink','powershelf','pdu','cdu','storage','network','blanking'];
   return kinds.map(type=>{const holder=document.createElement('div');holder.innerHTML=PAHardwareVisuals.render({mgx_type:type,rack_size:type==='cdu'?4:1});return {type,rendered:holder.querySelector('svg')?.dataset.hardwareType,shapes:holder.querySelectorAll('path,rect,circle,ellipse,line,polygon').length};});
  });
  for(const row of svgAudit){assert.equal(row.rendered,row.type);assert.ok(row.shapes>8,row.type+' needs a device-specific illustration');}
  const gallery=await context.newPage();
  await gallery.goto(base+'/#/machine/host_a');await gallery.waitForSelector('.pd-hardware-stage');
  await gallery.evaluate(()=>{
   const kinds=['server','switch','nvlink','powershelf','pdu','cdu','storage','network','blanking'];
   const cards=kinds.map(type=>`<article><h2>${PAHardwareVisuals.label(type)}</h2>${PAHardwareVisuals.render({mgx_type:type,rack_size:type==='cdu'?4:type==='storage'?2:1})}</article>`).join('');
   document.body.innerHTML=`<main style="display:grid;grid-template-columns:repeat(3,1fr);gap:24px;padding:30px">${cards}</main>`;
   const style=document.createElement('style');style.textContent='body{margin:0!important;background:#101a22!important;color:#dce7ee;font:14px system-ui}article{border:1px solid #354855;border-radius:12px;padding:20px;background:#1b2a35;min-width:0}h2{font-size:15px;font-weight:500}svg{width:100%;height:225px}';document.head.append(style);
  });
  await gallery.screenshot({path:path.join(output,'gb300-all-device-identities.png'),fullPage:true});await gallery.close();
  results.push({deviceIllustrations:svgAudit});
  for(const width of [1440,1600,1920]){
   await page.setViewportSize({width,height:1100});
   for(const name of ['host_a','SW-01','NVLINK-01','PS-01','CDU-01','SERVER-04U']){
    await page.goto(base+'/#/machine/'+name);await page.waitForFunction(n=>document.querySelector('.pd-workspace')?.dataset.system===n,name);await page.waitForSelector('.pd-hardware-stage svg');
    const bounded=await page.evaluate(()=>{const a=document.querySelector('.pd-showcase').getBoundingClientRect(),b=document.querySelector('.pd-hardware-stage svg').getBoundingClientRect(),c=document.querySelector('.pd-stage-caption').getBoundingClientRect();return b.left>=a.left&&b.right<=a.right&&b.top>=a.top&&b.bottom<=a.bottom&&c.right<=a.right&&c.bottom<=a.bottom;});
    assert.ok(bounded,`${name} ${width}: static device drawing/caption cropped`);
   }
  }
  await page.setViewportSize({width:1600,height:1100});
  for(const name of ['host_a','CDU-01','NVLINK-01']){
   await page.goto(base+'/#/machine/'+name);await page.waitForFunction(n=>document.querySelector('.pd-workspace')?.dataset.system===n,name);await page.waitForSelector('.pd-hardware-stage svg');
   await page.screenshot({path:path.join(output,`gb300-system-detail-${name.toLowerCase()}.png`),fullPage:true});
  }
  results.push('Single-device illustrations and captions fully contained at 1440/1600/1920; compute, switch, NVLink, power and CDU verified');
  await page.goto(base+'/#/rack/proj_k');await ready();
  // Lose/restore on the actual rack, then force no-WebGL fallback in a new isolated page.
  await page.evaluate(()=>{const gl=document.querySelector('#ew-rack-canvas').getContext('webgl');window.__qaRackLoss=gl.getExtension('WEBGL_lose_context');__qaRackLoss.loseContext();});
  await page.waitForSelector('.ew-gl-fallback');
  await page.evaluate(()=>__qaRackLoss.restoreContext());await ready();await page.waitForSelector('.ew-gl-fallback',{state:'detached'});
  const fallback=await context.newPage();
  await fallback.addInitScript(()=>{const native=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(kind,...args){return /webgl/i.test(kind)?null:native.call(this,kind,...args);};});
  await fallback.goto(base+'/#/rack/proj_k');await fallback.waitForSelector('.ew-gl-fallback');await fallback.locator('.ew-gl-fallback').getByRole('button',{name:'48U placement',exact:true}).click();assert.equal(await fallback.locator('.rm-u .mono').count(),48);await fallback.close();
  results.push('WebGL restoration and 48U edit fallback remain functional');
  assert.deepEqual(errors,[]);assert.deepEqual(external,[]);
  fs.writeFileSync(path.join(output,'gb300-rack.json'),JSON.stringify({passed:true,results,errors,external},null,2));
  console.log(JSON.stringify({passed:true,results},null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

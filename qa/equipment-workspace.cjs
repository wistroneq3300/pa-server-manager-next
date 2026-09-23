const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'C:/Users/kobei/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright');
const out=path.join(__dirname,'artifacts');
const base=process.env.PA_PREVIEW_URL||'http://127.0.0.1:8769';
const results=[];
(async()=>{
 const scope={window:{}};vm.createContext(scope);vm.runInContext(fs.readFileSync('static/js/workspace-reliability.js','utf8'),scope);
 const validate=scope.window.PAWorkspaceReliability.validatePlacements;
 const overlap=validate([{name:'a',rack_u:38,rack_size:4},{name:'b',rack_u:36,rack_size:2},{name:'c',rack_u:4,rack_size:4},{name:'d',rack_u:0,rack_size:1}]);
 assert.equal(overlap.issues.length,2);assert.equal(overlap.usedU,4);assert.equal(overlap.pending.length,1);
 const browser=await chromium.launch({headless:true,executablePath:process.env.CHROME_PATH||'C:/Program Files/Google/Chrome/Application/chrome.exe'});
 const context=await browser.newContext({viewport:{width:1600,height:1000}});
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try {
  await page.goto(base+'/#/rack/proj_k');
  await page.waitForFunction(()=>document.querySelector('#ew-rack-canvas')?.dataset.rackState==='ready');
  const state=()=>page.evaluate(()=>document.querySelector('#ew-rack-canvas').paRackScene.getState());
  const initial=await state();assert.equal(initial.count,35);assert.equal(initial.occupiedU,48);
  for(const [name,top,bottom,size]of [['SERVER-04U',40,37,4],['SERVER-03U',36,34,3],['SERVER-02U',33,32,2],['BLANK-RESERVE-05U',9,5,5],['CDU-01',4,1,4]]){
   const part=initial.placements.find(p=>p.name===name);assert.ok(part,name);assert.equal(part.top,top);assert.equal(part.bottom,bottom);assert.equal(part.size,size);
  }
  assert.equal(initial.placements.filter(p=>p.type==='nvlink'&&p.size===1).length,9);
  await page.screenshot({path:path.join(out,'equipment-rack-dark.png'),fullPage:true});
  await page.getByRole('button',{name:'Rear',exact:true}).click();assert.equal((await state()).view,'rear');
  await page.getByRole('button',{name:'Front',exact:true}).click();assert.equal((await state()).yaw,0);
  await page.locator('#ew-rack-canvas').press('ArrowLeft');assert.notEqual((await state()).yaw,0);
  await page.getByRole('button',{name:'Reset',exact:true}).click();assert.equal((await state()).view,'perspective');
  for(const kind of ['switch','nvlink','powershelf','cdu','blanking','server','pdu','storage','network']) {
   const scaleOnly=['pdu','storage','network'].includes(kind),project=scaleOnly?'L11-Rack-01':'proj_k';
   await page.goto(base+'/'+(scaleOnly?'?preview=scale':'')+'#/rack/'+project);await page.waitForFunction(()=>document.querySelector('#ew-rack-canvas')?.dataset.rackState==='ready');
   const item=await page.evaluate(({project,kind})=>machines.filter(m=>m.project===project).find(m=>m.mgx_type===kind),{project,kind});assert.ok(item,kind);
   await page.locator('#ew-rack-component').selectOption(item.name);
   assert.equal((await state()).selected,item.name);
   await page.getByRole('button',{name:'Open component',exact:true}).click();
   await page.waitForSelector('.pd-workspace');
   assert.equal(await page.locator('.pd-hardware-stage svg').getAttribute('data-hardware-type'),kind);
  }
  await page.goto(base+'/#/rack/proj_k');await page.waitForFunction(()=>document.querySelector('#ew-rack-canvas')?.dataset.rackState==='ready');
  for(const width of [1440,1600,1920]) {
   await page.setViewportSize({width,height:1000});
   for(const theme of ['light','dark']) {
    await page.evaluate(t=>applyTheme(t),theme);
    assert.ok(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
    await page.screenshot({path:path.join(out,`equipment-rack-${theme}-${width}.png`)});
   }
  }
  await page.getByRole('button',{name:'48U placement',exact:true}).click();await page.waitForSelector('.rm-rack');assert.equal(await page.locator('.rm-u .mono').count(),48);
  results.push('3D geometry: 35 components / 48U, mixed 1/2/3/4/5U heights, camera, selection, all 9 type identities, 48U edit, 3 widths / 2 themes');
  await page.goto(base+'/?preview=scale#/dashboard');await page.waitForFunction(()=>window.PA_PREVIEW&&machines.length>50);
  const scale=await page.evaluate(()=>({systems:machines.filter(m=>m.level!=='rack').length,racks:projects.filter(p=>p.level==='rack').length}));assert.equal(scale.systems,50);assert.equal(scale.racks,3);
  results.push(scale);
  await page.evaluate(()=>productLevel('system'));await page.waitForSelector('#proj-sort-list');
  assert.equal(await page.locator('#proj-sort-list tbody tr:visible').count(),50);
  await page.evaluate(()=>{projects.filter(p=>p.level==='system').forEach(p=>projectCollapsed[p.name]=true);setView('projects');});
  await page.getByRole('textbox',{name:'\u641c\u5c0b\u5c08\u6848\u8207\u7cfb\u7d71'}).fill('L10-Project-10-SYS-05');
  assert.equal(await page.locator('#proj-sort-list tbody tr:visible').count(),1);
  await page.evaluate(()=>{projects.push({name:'Empty-L11',level:'rack',desc:'QA only'});productRack('Empty-L11');});
  await page.waitForSelector('#ew-rack-canvas');assert.equal((await state()).count,0);
  assert.equal(await page.locator('.rack-sel select').inputValue(),'Empty-L11');
  results.push('50 visible systems, collapsed-project search, empty typed L11 rack');
  await page.evaluate(()=>{const p=projects.find(p=>p.level==='rack'&&p.name!=='Empty-L11');machines.filter(m=>m.project===p.name).forEach(m=>m.rack_u=0);productRack(p.name);});
  await page.waitForSelector('#ew-rack-canvas');assert.equal((await state()).count,0);
  assert.ok(await page.locator('#ew-rack-component option').count()>1);assert.match(await page.locator('.ew-placement-warning').innerText(),/unplaced/);
  results.push('All-unplaced rack retains component selection and placement warnings');
  await page.goto(base+'/#/machine/host_a');await page.waitForSelector('[data-pd-tab="hardware"]');
  await page.locator('[data-pd-tab="hardware"]').click();assert.ok(await page.locator('.ew-inventory-section').count()>=5);
  await page.screenshot({path:path.join(out,'equipment-hardware.png'),fullPage:true});
  await page.locator('[data-pd-tab="sensors"]').click();await page.waitForSelector('.ew-analysis');assert.equal(await page.locator('.ew-analysis #sensor-ai').count(),1);
  await page.screenshot({path:path.join(out,'equipment-sensors.png'),fullPage:true});
  results.push('Hardware groups and separated Sensor AI');
  assert.deepEqual(errors,[]);
  fs.writeFileSync(path.join(out,'equipment-workspace.json'),JSON.stringify({passed:true,results,errors},null,2));
  console.log(JSON.stringify({passed:true,results}));
 } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});

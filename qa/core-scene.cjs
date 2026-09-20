/* Deterministic unit checks for the native WebGL model and lifecycle.
 * Run: node qa/core-scene.cjs
 * No browser or dependencies. The WebGL double verifies geometry/uploads,
 * state and lifecycle; real shader compilation and pixels require browser QA.
 */
'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const source=fs.readFileSync(path.join(__dirname,'../static/js/core-scene.js'),'utf8');
const results=[];

function harness({reduced=false,unavailable=false}={}){
  let clock=0,nextFrame=0,draws=0,deletedBuffers=0,deletedPrograms=0,compileFailure=false;
  const frames=new Map(),events=new Map(),uploads=[],captured=new Set(),dispatched=[];
  let resizeCallback=()=>{},observerDisconnected=false;
  const gl=new Proxy({
    NO_ERROR:0,getParameter:()=>4096,getShaderParameter:()=>!compileFailure,
    getProgramParameter:()=>true,getShaderInfoLog:()=> 'Injected shader compile failure',
    getAttribLocation:()=>0,getUniformLocation:()=>({}),getError:()=>0,
    createShader:()=>({}),createProgram:()=>({}),createBuffer:()=>({}),
    bufferData:(_,data)=>uploads.push(data),drawArrays:()=>draws++,
    deleteBuffer:()=>deletedBuffers++,deleteProgram:()=>deletedPrograms++
  },{get:(target,key)=>key in target?target[key]:(/^[A-Z_]+$/.test(key)?1:()=>{})});
  const canvas={
    style:{touchAction:'pan-y'},dataset:{},width:0,height:0,
    getContext:()=>unavailable?null:gl,getBoundingClientRect:()=>({width:810,height:610}),
    addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name),
    dispatchEvent:event=>dispatched.push(event.type),focus(){},
    setPointerCapture:id=>captured.add(id),hasPointerCapture:id=>captured.has(id),
    releasePointerCapture:id=>{captured.delete(id);events.get('lostpointercapture')?.({pointerId:id});}
  };
  const sandbox={
    window:{devicePixelRatio:1,addEventListener(){},removeEventListener(){}},
    Float32Array,Math,Number,String,Object,Array,
    performance:{now:()=>clock},matchMedia:()=>({matches:reduced}),
    ResizeObserver:class{constructor(fn){resizeCallback=fn;}observe(){}disconnect(){observerDisconnected=true;}},
    CustomEvent:class{constructor(type){this.type=type;}},
    requestAnimationFrame:fn=>{frames.set(++nextFrame,fn);return nextFrame;},
    cancelAnimationFrame:id=>frames.delete(id)
  };
  vm.runInNewContext(source,sandbox,{filename:'core-scene.js'});
  const scene=sandbox.window.PACoreScene.mount(canvas);
  function frame(){const pending=[...frames.values()];frames.clear();clock+=17;pending.forEach(fn=>fn(clock));}
  function flush(n=40){for(let i=0;i<n;i++)frame();}
  return {
    scene,canvas,uploads,events,frames,dispatched,frame,flush,
    event:(name,event={})=>events.get(name)?.(event),
    resize:()=>resizeCallback(),failCompilation:()=>{compileFailure=true;},
    stats:()=>({draws,deletedBuffers,deletedPrograms,observerDisconnected})
  };
}
function check(name,fn){fn();results.push(name);console.log('PASS '+name);}

check('Complete finite geometry; seven uploads; no idle rendering',()=>{
  const h=harness();h.frame();
  assert.equal(h.canvas.dataset.coreState,'ready');assert.equal(h.scene.getState().geometryBuffers,7);
  assert.equal(h.uploads.length,7);let vertices=0;
  for(const data of h.uploads){
    assert.equal(data.length%12,0);vertices+=data.length/12;
    for(let offset=0;offset<data.length;offset+=12){
      for(let n=0;n<12;n++)assert.ok(Number.isFinite(data[offset+n]),'non-finite geometry');
      const normal=Math.hypot(data[offset+3],data[offset+4],data[offset+5]);
      assert.ok(Math.abs(normal-1)<.00001,'surface normal must be normalized');
      assert.ok(Math.abs(data[offset])<10&&Math.abs(data[offset+1])<10&&Math.abs(data[offset+2])<10,'invalid mesh bounds');
    }
  }
  assert.equal(vertices,66480);assert.equal(h.stats().draws,2);assert.equal(h.frames.size,0);
  const initialDistance=Number(h.canvas.dataset.coreCameraDistance);
  h.scene.setOrbit(-1.4,-1.134);h.frame();assert.ok(Number(h.canvas.dataset.coreCameraDistance)>initialDistance*1.15,'tall rotated tray must fit the viewport');
  h.scene.setOrbit(0,0);h.frame();assert.ok(Math.abs(Number(h.canvas.dataset.coreCameraDistance)-initialDistance)<.0001,'authored L10 framing must be preserved');
  const priorDraws=h.stats().draws;
  h.scene.setProgress(1);h.frame();assert.equal(h.stats().draws-priorDraws,34);
  assert.equal(h.uploads.length,7,'scroll must not rebuild geometry');
  assert.equal(h.scene.getState().computeTrays,18);assert.equal(h.scene.getState().switchTrays,9);h.scene.destroy();
});

check('Four horizontal quadrants, rear view, top/bottom and release persistence',()=>{
  const h=harness();h.frame();
  for(const yaw of [0,Math.PI/2,Math.PI,-Math.PI/2]){
    h.scene.setOrbit(yaw,.7);h.frame();
    const expected=yaw===Math.PI?-Math.PI:yaw;
    assert.ok(Math.abs(h.scene.getState().yaw-expected)<.00001);
    h.scene.setPointer(.9,-.8);h.scene.setProgress(0);
    assert.equal(h.scene.getState().yaw,expected);assert.equal(h.frames.size,0);
  }
  h.scene.setOrbit(7*Math.PI,2);h.frame();assert.equal(h.scene.getState().pitch,1.55);
  h.scene.setOrbit(0,-2);h.frame();assert.equal(h.scene.getState().pitch,-1.55);
  h.event('pointerdown',{button:0,pointerId:1,clientX:200,clientY:100});
  h.event('pointermove',{pointerId:1,clientX:420,clientY:320});h.frame();
  assert.equal(h.scene.getState().dragging,true);
  h.event('pointerup',{pointerId:1});const held=h.scene.getState();h.flush();
  assert.equal(held.dragging,false);assert.equal(h.scene.getState().yaw,held.yaw);assert.equal(h.scene.getState().pitch,held.pitch);assert.equal(h.frames.size,0);
  h.scene.destroy();
});

check('Reversible scroll settles into authored angle and stops scheduling frames',()=>{
  const h=harness();h.frame();h.scene.setOrbit(1.3,-.8);h.frame();h.scene.setProgress(.5);
  assert.equal(h.scene.getState().settling,true);h.frame();
  assert.ok(h.scene.getState().yaw>0&&h.scene.getState().yaw<1.3);h.flush();
  assert.equal(h.scene.getState().yaw,0);assert.equal(h.scene.getState().pitch,0);assert.equal(h.frames.size,0);
  h.scene.setProgress(1);h.frame();h.scene.setProgress(0);h.frame();assert.equal(h.scene.getState().progress,0);
  h.scene.setOrbit(Math.PI,.5);h.frame();h.scene.resetOrbit();h.flush();assert.equal(h.scene.getState().yaw,0);assert.equal(h.frames.size,0);h.scene.destroy();
});

check('Keyboard orbit and reset; Reduced Motion still permits deliberate inspection',()=>{
  const h=harness({reduced:true});h.frame();let prevented=0;
  h.event('keydown',{key:'ArrowRight',preventDefault:()=>prevented++});h.frame();assert.equal(h.scene.getState().yaw,.1200000000000001);
  h.event('keydown',{key:'ArrowDown',shiftKey:true,preventDefault:()=>prevented++});h.frame();assert.equal(h.scene.getState().pitch,.24);
  h.event('keydown',{key:'Home',preventDefault:()=>prevented++});h.frame();assert.equal(h.scene.getState().yaw,0);assert.equal(h.scene.getState().pitch,0);
  assert.equal(prevented,3);assert.equal(h.scene.getState().settling,false);assert.equal(h.frames.size,0);h.scene.destroy();
});

check('Theme, resize and complete idempotent disposal',()=>{
  const h=harness();h.frame();h.scene.setTheme('light');h.frame();assert.equal(h.scene.getState().theme,'light');
  h.scene.setTheme(false);h.frame();assert.equal(h.scene.getState().theme,'dark');h.resize();h.frame();
  assert.equal(h.canvas.width,810);assert.equal(h.canvas.height,610);
  h.scene.setOrbit(1,.3);h.scene.resetOrbit();h.scene.destroy();h.scene.destroy();
  assert.equal(h.frames.size,0);assert.equal(h.events.size,0);assert.equal(h.stats().deletedBuffers,7);assert.equal(h.stats().deletedPrograms,1);
  assert.equal(h.stats().observerDisconnected,true);assert.equal(h.canvas.style.touchAction,'pan-y');assert.equal(h.canvas.dataset.coreState,'disposed');assert.equal(h.canvas.paCoreScene,undefined);
});

check('WebGL unavailable fallback does not install interactive listeners',()=>{
  const h=harness({unavailable:true});assert.equal(h.scene.supported,false);assert.equal(h.canvas.dataset.coreState,'fallback');assert.equal(h.events.size,0);assert.equal(h.frames.size,0);
  h.scene.setOrbit(1,1);h.scene.setProgress(1);h.scene.setTheme('light');h.scene.destroy();
});

check('Context loss, successful restoration, failed restoration and cleanup',()=>{
  const h=harness();h.frame();let prevented=false;
  h.event('webglcontextlost',{preventDefault(){prevented=true;}});assert.equal(prevented,true);assert.equal(h.canvas.dataset.coreState,'fallback');
  h.scene.setOrbit(1,.4);h.scene.setProgress(.5);assert.equal(h.frames.size,0);
  h.event('webglcontextrestored');h.flush();assert.equal(h.canvas.dataset.coreState,'ready');assert.equal(h.uploads.length,14);
  h.event('webglcontextlost',{preventDefault(){}});h.failCompilation();h.event('webglcontextrestored');
  assert.equal(h.canvas.dataset.coreState,'fallback');assert.match(h.canvas.dataset.coreError,/compilation failed/);
  h.scene.setOrbit(-1,.5);h.scene.setProgress(1);h.scene.setTheme('light');h.resize();h.flush();assert.equal(h.frames.size,0);
  h.scene.destroy();assert.equal(h.events.size,0);assert.equal(h.canvas.dataset.coreState,'disposed');
});

console.log('\n'+results.length+'/'+results.length+' core-scene checks passed. Browser visual/GL validation is still required.');

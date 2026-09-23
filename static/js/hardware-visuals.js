/* Original, dependency-free equipment illustrations. Public product references
 * inform the silhouettes, never the machine's inventory or measured values.
 * SN2000 is a family: the generic switch face borrows SN2700's 32-port layout.
 * CDU: rack-mounted cooling appliance; PDU: horizontal in-rack form factor.
 * No vendor photograph, CAD, texture, trademark or model file is redistributed. */
(() => {
  'use strict';
  const TYPES = {
    server: {label:'伺服器',en:'COMPUTE SYSTEM',height:48,depth:125,reference:'通用伺服器機身示意'},
    switch: {label:'網路交換器',en:'NETWORK SWITCH',height:34,depth:105,reference:'SN2000 系列外觀參考，非機型辨識'},
    cdu: {label:'冷卻分配單元',en:'COOLANT DISTRIBUTION',height:102,depth:92,reference:'通用機架式 CDU 示意，非特定機型'},
    pdu: {label:'電源分配器',en:'POWER DISTRIBUTION',height:43,depth:52,reference:'通用水平式 PDU 示意，非特定機型'},
    powershelf: {label:'電源模組層',en:'POWER SHELF',height:70,depth:102,reference:'通用 Power Shelf 示意，非特定機型'},
    storage: {label:'儲存設備',en:'STORAGE ARRAY',height:74,depth:126,reference:'通用磁碟陣列示意，非特定機型'},
    network: {label:'網路設備',en:'NETWORK APPLIANCE',height:42,depth:85,reference:'通用網路設備示意，非特定機型'},
    blanking: {label:'擋板',en:'BLANKING PANEL',height:52,depth:8,reference:'機櫃擋板示意，不代表設備'}
  };
  let sequence = 0;
  const safe = value => String(value ?? '').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  function typeOf(machine) {
    if (typeof machine === 'string') return Object.hasOwn(TYPES,machine) ? machine : 'server';
    if (machine && Object.hasOwn(TYPES,machine.mgx_type)) return machine.mgx_type;
    if (typeof mgxTypeOf === 'function') {
      const result = mgxTypeOf(machine);
      if (Object.hasOwn(TYPES,result)) return result;
    }
    return 'server';
  }
  const label = type => TYPES[typeOf(type)].label;
  const caption = type => TYPES[typeOf(type)].reference + ' · 非本機實際外觀';
  function rect(x,y,w,h,fill,stroke='',rx=0,extra='') {
    return `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${rx}" fill="${fill}"${stroke?` stroke="${stroke}" stroke-width=".6"`:''}${extra?` ${extra}`:''}/>`;
  }
  const circle = (x,y,r,fill,extra='') => `<circle cx="${x}" cy="${y}" r="${r}" fill="${fill}" ${extra}/>`;
  function front(type, id) {
    const h = TYPES[type].height;
    const metal = `url(#${id}-${['server','switch'].includes(type)?'champagne':'front'})`, dark=`url(#${id}-dark)`, vent=`url(#${id}-vent)`;
    let content = rect(0,0,440,h,type==='blanking'?dark:metal,'#8d9ca3',2);
    content += `<path d="M3 2H437" stroke="#f0f2eb" opacity=".65"/><path d="M2 ${h-2}H438" stroke="#050d12" opacity=".75"/>`;
    for (const x of [6,434]) for (const y of [7,h-7]) content += circle(x,y,1.8,'#172831') + `<path d="M${x-1} ${y}h2" stroke="#d8e0e1" stroke-width=".5"/>`;
    const status = (x,y) => circle(x,y,1.7,'#A1CC56') + circle(x,y+6,1.4,'#536870');
    const handle = (x,y,height) => rect(x,y,9,height,`url(#${id}-edge)`,'#d1d8d6',3) + rect(x+2.5,y+4,4,height-8,'#0d1f29','',2);
    const smallPort = (x,y,w=17,ph=9) => rect(x,y,w,ph,'#a7b5b7','#cad5d4',.6)+rect(x+1.4,y+1.4,w-2.8,ph-2.8,'#071a24','',.6)+`<path d="M${x+3} ${y+ph-2}h${w-6}" stroke="#9da48c" stroke-width=".7"/>`;
    const grille = (x,y,w,gh) => rect(x,y,w,gh,vent,'#3c4e57',1);
    if (type === 'switch') {
      content += rect(14,5,403,24,'#12232b','#617079',1);
      // A reference face, not a reported port count. 16 columns × 2 rows.
      for (let row=0;row<2;row++) for (let col=0;col<16;col++) {
        const x=19+col*24.25,y=8+row*10;
        content += smallPort(x,y,21,8) + circle(x+19,y+3,.6,col%5===0?'#97b36b':'#314e56');
      }
      content += status(425,11)+rect(14,1.5,403,1.5,'#7e9971');
    } else if (type === 'server') {
      content += handle(13,7,h-14)+handle(418,7,h-14);
      content += grille(31,7,108,31)+grille(307,7,101,31);
      for(let i=0;i<6;i++) {
        const x=149+i*24.4;
        content += rect(x,8,22,30,dark,'#7d8c93',1)+rect(x+2,10,17,20,vent)+rect(x+5,32,11,2,'#adb8b7')+circle(x+18,34,.7,'#7f9e68');
      }
      content += status(398,14)+rect(341,40,50,2,'#577181');
    } else if (type === 'cdu') {
      content += handle(13,14,h-28)+handle(418,14,h-28);
      content += rect(34,10,370,82,`url(#${id}-satin)`,'#99a7ab',2);
      content += rect(52,24,124,49,'#273e49','#718993',3)+rect(58,29,111,38,'#061c2a','#a4bdc3',1);
      content += `<path d="M64 35h31M64 40h48M64 55h23M96 55h28M134 35h26M134 41h26" stroke="#87a9b7" stroke-width="1.5" opacity=".85"/>`;
      content += `<path d="M65 61H155M96 43v18M126 43v18" stroke="#237a91" stroke-width="1"/><path d="M66 57l15-5 16 2 14-7 15 3 17-5 13 3" stroke="#A1CC56" stroke-width="1.4" fill="none"/>`;
      content += grille(213,19,172,64);
      content += rect(185,23,9,10,'#1e313b','#8b9b9e',2)+status(189,44);
      content += `<path d="M48 83H178" stroke="#8a9da2"/><path d="M48 86H138" stroke="#8a9da2" stroke-width=".5"/>`;
    } else if (type === 'pdu') {
      content += rect(15,6,324,31,dark,'#263f4b',1);
      for(let i=0;i<8;i++) {
        const x=21+i*39.2;
        content += rect(x,9,32,25,i<4?'#23333a':'#354035','#71817b',2);
        content += `<path d="M${x+8} 13h16l3 4v13H${x+5}V17Z" fill="#081219" stroke="#627174" stroke-width=".5"/>`;
        content += rect(x+11,18,2.5,7,'#69766e')+rect(x+20,18,2.5,7,'#69766e')+rect(x+15.6,25,2.5,5,'#69766e');
      }
      content += rect(350,7,51,28,'#162e38','#8b9d9d',2)+rect(356,11,39,14,'#051f2e','',1);
      content += `<path d="M362 18h7m4 0h7m4 0h5" stroke="#7cacb8" stroke-width="1.5"/>`;
      content += circle(365,29,1.5,'#87a966')+circle(375,29,1.5,'#536b75')+circle(385,29,1.5,'#536b75')+status(415,15);
    } else if (type === 'powershelf') {
      for(let i=0;i<6;i++) {
        const x=16+i*67.7;
        content += rect(x,7,62,56,dark,'#a6b1af',2)+grille(x+4,12,39,42)+rect(x+48,17,8,34,`url(#${id}-edge)`,'#bfcaca',2)+rect(x+50,22,4,24,'#172a33','',1)+circle(x+52,57,1.4,'#9ac467');
      }
    } else if (type === 'storage') {
      content += handle(12,12,h-24)+handle(419,12,h-24);
      for(let row=0;row<3;row++) for(let col=0;col<8;col++) {
        const x=28+col*48.2,y=8+row*20;
        content += rect(x,y,45,18,dark,'#778b94',1)+grille(x+2,y+2,28,13)+rect(x+33,y+2,8,12,'#7b8b8c','',1)+circle(x+39,y+14,.9,'#99b677');
      }
    } else if (type === 'network') {
      content += rect(15,7,120,27,dark,'#4e6874',2)+rect(22,13,53,12,'#092735','',1);
      content += `<path d="M27 19h12m4 0h23" stroke="#85a9b8" stroke-width="1"/>`;
      content += status(85,15)+smallPort(102,14,23,12);
      for(let i=0;i<8;i++) content+=smallPort(153+i*24.5,13,20,13);
      content += smallPort(360,13,22,13)+smallPort(388,13,22,13)+rect(353,32,63,1.4,'#779361');
    } else {
      content += `<path d="M20 10H420M20 ${h-10}H420" stroke="#5a6c74" opacity=".55"/><path d="M17 ${h/2}H423" stroke="#94a2a7" opacity=".16"/>`;
      content += rect(207,h/2-1,26,2,'#5b747e','',1);
    }
    return content;
  }
  function render(machineOrType, options = {}) {
    const type = typeOf(machineOrType), spec = TYPES[type];
    // Counter suffix avoids collisions even when callers reuse idPrefix.
    const id = `pa-hw-${String(options.idPrefix || type).replace(/[^a-zA-Z0-9_-]/g,'')}-${++sequence}`;
    const view = options.view === 'front' ? 'front' : 'perspective';
    const h=spec.height, y=type==='cdu'?167:type==='powershelf'||type==='storage'?191:218, d=spec.depth;
    const face=front(type,id), cls=safe(options.className || '');
    const definitions=`<defs><linearGradient id="${id}-top" x1="0" y1="0" x2=".65" y2="1"><stop stop-color="#c8cfd0"/><stop offset=".28" stop-color="#9aa8ae"/><stop offset=".56" stop-color="#637885"/><stop offset="1" stop-color="#b1bfc3"/></linearGradient><linearGradient id="${id}-front" x1="0" y1="0" x2="0" y2="1"><stop stop-color="#c7cbc5"/><stop offset=".09" stop-color="#929f9f"/><stop offset=".5" stop-color="#4e646e"/><stop offset=".88" stop-color="#758a92"/><stop offset="1" stop-color="#273e49"/></linearGradient><linearGradient id="${id}-side" x2="1" y2="1"><stop stop-color="#617c89"/><stop offset="1" stop-color="#122b3a"/></linearGradient><linearGradient id="${id}-dark" x2="0" y2="1"><stop stop-color="#324954"/><stop offset=".24" stop-color="#1b303a"/><stop offset="1" stop-color="#071b26"/></linearGradient><linearGradient id="${id}-edge" x2="1"><stop stop-color="#d9ddd7"/><stop offset=".23" stop-color="#8f9b96"/><stop offset=".48" stop-color="#cad1c9"/><stop offset="1" stop-color="#596e73"/></linearGradient><linearGradient id="${id}-satin" x2="1" y2=".2"><stop stop-color="#aebbbb"/><stop offset=".48" stop-color="#d2d7d1"/><stop offset="1" stop-color="#8d9b9d"/></linearGradient><pattern id="${id}-vent" width="4" height="4" patternUnits="userSpaceOnUse"><rect width="4" height="4" fill="#233943"/><circle cx="1.9" cy="1.9" r="1.15" fill="#081a24"/><path d="M1 3.4H3" stroke="#607681" stroke-width=".3"/></pattern></defs>`;
    let drawing;
    if(view === 'front') drawing=`<g transform="translate(14,8)">${face}</g>`;
    else {
      const right=500,dy=30.8,dx=d*.52;
      drawing=`<ellipse cx="307" cy="${y+h+33}" rx="221" ry="14" fill="#082333" opacity=".15"/><path d="M60 ${y}L${60+dx} ${y-d}L${right+dx} ${y-d+dy}L${right} ${y+dy}Z" fill="url(#${id}-top)" stroke="#c4d0d1" stroke-width=".7"/><path d="M${right} ${y+dy}L${right+dx} ${y-d+dy}V${y-d+dy+h}L${right} ${y+dy+h}Z" fill="url(#${id}-side)" stroke="#506f7f" stroke-width=".7"/>`;
      if(type!=='blanking') {
        drawing+=`<path d="M76 ${y-9}L${69+dx} ${y-d+8}L${right+dx-12} ${y-d+dy+7}" fill="none" stroke="#d6dfde" stroke-width=".65" opacity=".64"/><path d="M${right+7} ${y+dy-12}L${right+dx-5} ${y-d+dy+13}" stroke="#a9bac0" stroke-width="1"/>`;
        for(let i=0;i<4;i++) drawing+=circle(83+i*126+dx*.7,y-d*.7+i*8.8,1.5,'#293f4a')+circle(83+i*126+dx*.7,y-d*.7+i*8.8-.5,.75,'#dbe3e1');
        // Subtle pressed-metal seams rather than invented internal hardware.
        drawing+=`<path d="M${78+dx*.25} ${y-d*.25}L${right-13+dx*.25} ${y-d*.25+dy}" stroke="#6e8793" stroke-width=".55" opacity=".7"/>`;
      }
      drawing+=`<g transform="matrix(1 .07 0 1 60 ${y})">${face}</g>`;
      if(type==='cdu') drawing+=`<g fill="url(#${id}-edge)" stroke="#456577" stroke-width="1"><ellipse cx="${right+dx-9}" cy="${y-d+dy+45}" rx="7" ry="11"/><ellipse cx="${right+dx-15}" cy="${y-d+dy+73}" rx="7" ry="11"/></g><path d="M${right+dx-9} ${y-d+dy+39}v12M${right+dx-15} ${y-d+dy+67}v12" stroke="#167d9b" stroke-width="3"/>`;
    }
    const champagne=`<defs><linearGradient id="${id}-champagne" x2=".15" y2="1"><stop stop-color="#ded6bb"/><stop offset=".12" stop-color="#b6a475"/><stop offset=".50" stop-color="#8e7a4e"/><stop offset=".80" stop-color="#c7b786"/><stop offset="1" stop-color="#695b3b"/></linearGradient></defs>`;
    return `<svg class="pa-hardware-visual ${cls}" data-hardware-type="${type}" data-hardware-view="${view}" viewBox="${view==='front'?`0 0 468 ${h+16}`:'0 0 630 360'}" role="img" aria-label="${safe(label(type)+'：'+caption(type))}" xmlns="http://www.w3.org/2000/svg"><title>${safe(label(type))}</title><desc>${safe(caption(type))}。面板配置為外觀示意，不代表即時狀態、連接埠數量或硬體規格。</desc>${definitions}${champagne}${drawing}</svg>`;
  }
  window.PAHardwareVisuals=Object.freeze({typeOf,label,caption,render,types:Object.freeze(Object.keys(TYPES))});
})();

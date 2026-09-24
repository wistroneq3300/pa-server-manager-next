/* Project-local physical wiring and logical node mappings. Never operates devices. */
(() => {
  'use strict';
  const h = value => String(value ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const id = () => crypto.randomUUID();
  const roles = {host:'Host management',dpu:'DPU management',data:'Data network',uplink:'Switch interconnect',other:'Other'};
  let state = null, root;
  const rack = () => state.doc.racks.find(r => r.id === state.rack);
  const device = key => rack().devices.find(d => d.id === key);
  const val = key => root.querySelector('#nt-'+key)?.value || '';
  const options = (entries, selected) => entries.map(([value,label]) => `<option value="${h(value)}" ${value === selected ? 'selected' : ''}>${h(label)}</option>`).join('');
  const field = (key, label, value='', type='text') => `<label>${h(label)}<input id="nt-${key}" type="${type}" value="${h(value)}" maxlength="160" ${type==='number'?'min="1" max="256"':''}></label>`;
  const select = (key, label, entries, value='') => `<label>${h(label)}<select id="nt-${key}">${options(entries,value)}</select></label>`;
  const button = (action,label,key='',cls='') => `<button type="button" class="btn ${cls}" data-action="${action}" data-key="${h(key)}">${h(label)}</button>`;
  function error(e) { const box=root.querySelector('#nt-message');box.textContent=e.message || String(e);box.className='nt-message nt-error'; }
  function changed() { state.dirty=true;state.editor=null;render(); }
  function occupied(d,p,exclude='') { return rack().links.some(l=>l.id!==exclude&&[l.a,l.b].some(e=>e.device===d&&e.port===p)); }
  function endpoint(e) { const d=device(e.device);return `${d?.name || '?'} / ${d?.ports.find(p=>p.id===e.port)?.name || '?'}`; }
  async function confirmDraft(message) {
    const pending=confirmUser(message), dialog=document.getElementById('rm-dialog');
    const previous=dialog?.style.zIndex;
    if(dialog)dialog.style.zIndex='16000';
    root.inert=true;dialog?.querySelector('button')?.focus();
    try{return await pending;}finally{if(dialog)dialog.style.zIndex=previous;root.inert=false;root.querySelector('[data-action="close"]')?.focus();}
  }
  async function open(project) {
    if(!project) return notifyUser('\u8acb\u5148\u9078\u64c7\u5c08\u6848');
    if(root) return;
    root=document.createElement('div');root.className='nt-overlay';root.setAttribute('role','dialog');root.setAttribute('aria-modal','true');root.setAttribute('aria-label','Networking Topology');
    root.innerHTML='<section class="nt-window"><p role="status">Loading topology...</p></section>';document.body.append(root);
    state={project,doc:null,rack:'',dirty:false,editor:null,filter:'all',search:'',focus:'',busy:false,opener:document.activeElement};
    root.addEventListener('click',async event=>{const b=event.target.closest('[data-action]');if(!b||state.busy)return;try{await action(b.dataset.action,b.dataset.key);}catch(e){error(e);}});
    root.addEventListener('submit',async event=>{event.preventDefault();if(state.busy)return;try{await submit();}catch(e){error(e);}});
    root.addEventListener('change',event=>{
      if(state.busy)return;
      if(state.editor && ['nt-rack','nt-filter'].includes(event.target.id)){event.target.value=event.target.id==='nt-rack'?state.rack:state.filter;error(Error('Apply or cancel the open form first.'));return;}
      if(event.target.id==='nt-rack'){state.rack=event.target.value;state.focus='';state.editor=null;render();}
      if(event.target.id==='nt-template'){const preset=event.target.value==='vera';root.querySelector('#nt-nodes').value=preset?'4':'1';root.querySelector('#nt-paired').value=preset?'yes':'no';}
      if(event.target.id==='nt-filter'){state.filter=event.target.value;render();}
      if(['nt-a-device','nt-b-device'].includes(event.target.id)){
        const side=event.target.id==='nt-a-device'?'a':'b'; const d=device(event.target.value);
        root.querySelector('#nt-'+side+'-port').innerHTML=options(d.ports.map(p=>[p.id,p.name+(occupied(d.id,p.id,state.editor.key)?' (in use)':'')]),'');
      }
    });
    root.addEventListener('keydown',event=>{
      const target=event.target.closest('g[data-action]');
      if(target&&['Enter',' '].includes(event.key)){event.preventDefault();action(target.dataset.action,target.dataset.key).catch(error);return;}
      if(event.key==='Escape'){event.stopImmediatePropagation();event.preventDefault();if(state.editor){action('cancel');}else close();}
      if(event.key==='Tab'){const list=[...root.querySelectorAll('button,input,select,textarea,[tabindex="0"]')].filter(e=>!e.disabled&&e.offsetParent!==null);const first=list[0],last=list.at(-1);if(event.shiftKey&&document.activeElement===first){event.preventDefault();last?.focus();}else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first?.focus();}}
    });
    try { state.doc=await api('/api/projects/'+encodeURIComponent(project)+'/topology');state.rack=state.doc.racks[0]?.id || '';render(); }
    catch(e){root.innerHTML=`<section class="nt-window"><h2>Networking Topology</h2><div id="nt-message" role="alert"></div>${button('close','Close')}</section>`;error(e);}
  }
  async function close() {
    if(state.busy)return;
    if((state.dirty||state.editor)&&!await confirmDraft('\u6709\u672a\u5132\u5b58\u7684\u62d3\u64b2\u7de8\u8f2f\uff0c\u78ba\u5b9a\u653e\u68c4\u4e26\u95dc\u9589\uff1f'))return;
    const opener=state.opener;root.remove();root=null;state=null;opener?.focus();
  }
  function render() {
    const r=rack(),devices=r?.devices || [],connections=r?.links || [];
    root.innerHTML=`<section class="nt-window">
      <header class="nt-header"><div><small>${h(state.project)} / NETWORK WORKSPACE</small><h2>Networking Topology</h2><p>\u5be6\u9ad4\u63a5\u7dda\u8207\u7bc0\u9ede\u5c0d\u61c9\u3002\u9023\u7dda\u72c0\u614b\u70ba\u624b\u52d5\u78ba\u8a8d\uff0c\u975e\u5373\u6642\u5075\u6e2c\u3002</p></div><div class="nt-actions">${button('export','Export JSON')}${button('close','\u95dc\u9589')}</div></header>
      <div class="nt-toolbar">${select('rack','Rack',state.doc.racks.map(r=>[r.id,r.name]),state.rack)}${button('rack','+ Rack')}${r?button('rename-rack','\u91cd\u65b0\u547d\u540d')+button('delete-rack','\u522a\u9664 Rack'):''}<span class="nt-save-state">${state.dirty?'\u672a\u5132\u5b58':'\u5df2\u5132\u5b58'} · Revision ${state.doc.revision}</span>${button('reload','\u91cd\u65b0\u8f09\u5165')}${button('save','\u5132\u5b58\u62d3\u64b2','','primary')}</div>
      <div id="nt-message" class="nt-message" role="status" aria-live="polite"></div>
      ${r?`<div class="nt-toolbar">${button('import','\u5f9e\u5c08\u6848\u52a0\u5165\u8a2d\u5099')}${button('device','+ \u81ea\u8a02\u8a2d\u5099')}${button('link','+ \u914d\u5c0d\u9023\u7dda')}${button('batch','\u6279\u6b21\u63a5\u7dda')}${select('filter','\u986f\u793a\u7db2\u8def',[['all','All networks'],...Object.entries(roles)],state.filter)}<span>${devices.length} devices · ${devices.reduce((n,d)=>n+d.nodes.length,0)} nodes · ${connections.length} cables</span></div>
      <div class="nt-body"><main><div class="nt-map">${map(r)}</div><div class="nt-device-grid">${devices.map(d=>card(d)).join('') || '<p class="nt-empty">\u5f9e\u5c08\u6848\u52a0\u5165 Server / Switch\uff0c\u6216\u65b0\u589e\u81ea\u8a02\u8a2d\u5099\u958b\u59cb\u914d\u7dda\u3002</p>'}</div><h3>\u9023\u7dda\u6e05\u55ae</h3><div class="nt-links">${connections.filter(l=>state.filter==='all'||l.network===state.filter).map(l=>`<article class="nt-link"><span class="nt-tag nt-${l.network}">${h(roles[l.network])}</span><strong>${h(endpoint(l.a))} ↔ ${h(endpoint(l.b))}</strong><span>${l.state==='confirmed'?'\u5df2\u78ba\u8a8d\u63a5\u7dda':'\u898f\u5283\u4e2d'} · Live: Unknown</span><small>${h(l.note)}</small><div>${button('link','\u7de8\u8f2f',l.id)} ${button('delete-link','\u522a\u9664',l.id)}</div></article>`).join('')||'<p>\u5c1a\u7121\u9023\u7dda\u3002\u4f7f\u7528\u300c\u914d\u5c0d\u9023\u7dda\u300d\u6216\u300c\u6279\u6b21\u63a5\u7dda\u300d\u3002</p>'}</div></main><aside id="nt-editor">${editor()}</aside></div>`:'<div class="nt-empty"><h3>\u5efa\u7acb\u9019\u500b\u5c08\u6848\u7684\u7b2c\u4e00\u500b Rack</h3><p>\u5404\u5c08\u6848\u7368\u7acb\u5132\u5b58\uff0c\u53ef\u81ea\u8a02\u591a\u500b Rack\u3001\u7bc0\u9ede\u8207\u9023\u63a5\u57e0\u3002</p></div>'+`<aside id="nt-editor">${editor()}</aside>`}
    </section>`;
    root.querySelector(state.editor?'#nt-editor input, #nt-editor select':'[data-action="close"]')?.focus();
  }
  function map(r) {
    if(!r.devices.length)return '';
    const switches=r.devices.filter(d=>d.kind==='switch'),others=r.devices.filter(d=>d.kind!=='switch');
    const positions=new Map();let width=Math.max(700,switches.length*190+40,Math.min(others.length,4)*190+40);
    switches.forEach((d,i)=>positions.set(d.id,{x:40+i*190,y:25}));others.forEach((d,i)=>positions.set(d.id,{x:40+(i%4)*190,y:160+Math.floor(i/4)*100}));
    const height=Math.max(260,230+Math.ceil(others.length/4)*100);
    return `<p class="nt-map-hint">\u9ede\u9078\u8a2d\u5099\u7a81\u51fa\u9023\u7dda\uff1b\u5be6\u7dda\uff1d\u5df2\u78ba\u8a8d\uff0c\u865b\u7dda\uff1d\u898f\u5283\u4e2d\u3002 ${state.focus?button('focus','\u986f\u793a\u5168\u90e8'):''}</p><div class="nt-svg-scroll"><svg role="img" aria-label="Physical wiring diagram" viewBox="0 0 ${width} ${height}" style="min-width:${width}px">${r.links.filter(l=>state.filter==='all'||l.network===state.filter).map(l=>{const a=positions.get(l.a.device),b=positions.get(l.b.device);if(!a||!b)return '';const dim=state.focus&&![l.a.device,l.b.device].includes(state.focus);return `<path class="nt-wire nt-${l.network} ${dim?'nt-dim':''}" d="M${a.x+70},${a.y+30} C${a.x+70},${a.y+100} ${b.x+70},${b.y-60} ${b.x+70},${b.y+30}" ${l.state==='planned'?'stroke-dasharray="6 5"':''}><title>${h(endpoint(l.a)+' ↔ '+endpoint(l.b))}</title></path>`;}).join('')}${r.devices.map(d=>{const p=positions.get(d.id);return `<g role="button" tabindex="0" aria-label="${h(d.name)}" data-action="focus" data-key="${h(d.id)}"><rect x="${p.x}" y="${p.y}" width="150" height="58" rx="8"/><text x="${p.x+10}" y="${p.y+24}">${h(d.name.length>19?d.name.slice(0,18)+'…':d.name)}</text><text class="nt-svg-small" x="${p.x+10}" y="${p.y+44}">${h(d.kind)} · ${d.nodes.length} nodes</text></g>`;}).join('')}</svg></div>`;
  }
  function card(d) {
    const focused=state.focus===d.id;
    return `<article class="nt-device ${focused?'nt-focused':''}"><div class="nt-card-head"><strong>${h(d.name)}</strong><small>${h(d.kind)}</small></div><small>${d.nodes.length} nodes · ${d.ports.length} ports ${d.inventory?'· Inventory':''}</small><div class="nt-actions">${button('focus',focused?'\u6536\u5408':'\u5c55\u958b',focused?'':d.id)}${button('device','\u7de8\u8f2f',d.id)}${button('delete-device','\u522a\u9664',d.id)}</div>${focused?`<div class="nt-actions">${button('node','+ Node',d.id)}${button('port','+ Port',d.id)}</div>${d.nodes.map(n=>`<div class="nt-node"><strong>${h(n.name)} ↔ ${h(n.bf4||'No DPU')}</strong><dl>${[['host_os','Host OS'],['host_bmc','Host BMC'],['dpu_os','DPU OS'],['dpu_bmc','DPU BMC']].map(([k,l])=>`<dt>${l}</dt><dd>${h(n[k]||'—')}</dd>`).join('')}</dl>${button('edit-node','\u7de8\u8f2f',n.id)} ${button('delete-node','\u522a\u9664',n.id)}</div>`).join('')}${d.ports.map(p=>`<div class="nt-port"><strong>${h(p.name)}</strong><small>${h(roles[p.role])} · ${occupied(d.id,p.id)?'Connected':'Unpaired'}</small><small>Nodes: ${h(p.nodes.map(n=>d.nodes.find(x=>x.id===n)?.name).join(', ')||'—')}</small>${button('edit-port','\u7de8\u8f2f',p.id)} ${button('delete-port','\u522a\u9664',p.id)}</div>`).join('')}`:''}</article>`;
  }
  function templateFields() {
    return select('template','Server template',[['custom','Custom node count'],['vera','Vera preset (editable)'],['blank','Empty / configure later']])+
      field('nodes','Nodes per server (1-64)',1,'number')+
      select('paired','Create one DPU per node',[['no','No DPU'],['yes','One DPU per node']])+
      field('dpu-label','DPU model / label','BF4');
  }
  function editor() {
    const e=state.editor;if(!e)return '<div class="nt-help"><h3>\u914d\u7dda\u5de5\u4f5c\u5340</h3><p>1. \u52a0\u5165\u5c08\u6848\u8a2d\u5099\u6216\u81ea\u8a02\u8a2d\u5099\u3002</p><p>2. \u8a2d\u5b9a\u7bc0\u9ede\u3001DPU \u8207\u7ba1\u7406\u57e0\u3002</p><p>3. \u9078\u64c7\u5169\u7aef\u8a2d\u5099\u548c\u57e0\u865f\u914d\u5c0d\u3002</p><p>4. \u5132\u5b58\u62d3\u64b2\u3002</p><p>\u7bc0\u9ede IP \u70ba\u62d3\u64b2\u8a3b\u8a18\uff0c\u4e0d\u6703\u66f4\u6539\u8a2d\u5099\u7db2\u8def\u6216\u767b\u5165\u8cc7\u6599\u3002</p></div>';
    let body='';const d=e.device?device(e.device):null;
    if(e.type==='rack'||e.type==='rename-rack')body=field('name','Rack name',e.type==='rename-rack'?rack().name:'');
    if(e.type==='device') {const x=e.key?device(e.key):null;body=field('name','Device name',x?.name)+select('kind','Type',[['server','Server'],['switch','Switch'],['other','Other']],x?.kind||'server');if(!x)body+=templateFields()+field('count','Switch port count',32,'number');}
    if(e.type==='import')body=`<p>\u52a0\u5165\u8a2d\u5099\u7684\u62d3\u64b2\u526f\u672c\uff0c\u4e0d\u8b8a\u66f4\u5eab\u5b58\u3002</p><div class="nt-checks">${machines.filter(m=>m.project===state.project&&!rack().devices.some(d=>d.inventory===m.name)).map(m=>`<label><input type="checkbox" name="inventory" value="${h(m.name)}">${h(m.name)}</label>`).join('')}</div>${templateFields()}${field('count','Switch port count',48,'number')}`;
    if(e.type==='node'){const n=d.nodes.find(n=>n.id===e.key)||{};body=field('name','Node name',n.name)+field('bf4','Paired DPU label',n.bf4)+['host_os','host_bmc','dpu_os','dpu_bmc'].map(k=>field(k,k.replaceAll('_',' ').toUpperCase()+' IP',n[k])).join('');}
    if(e.type==='port'){const p=d.ports.find(p=>p.id===e.key)||{};body=field('name','Physical port name',p.name)+select('role','Role',Object.entries(roles),p.role||'host')+`<p>\u6b64\u57e0\u7ba1\u7406\u7684\u7bc0\u9ede\uff08\u53ef\u591a\u9078\uff09</p><div class="nt-checks">${d.nodes.map(n=>`<label><input type="checkbox" name="node" value="${h(n.id)}" ${p.nodes?.includes(n.id)?'checked':''}>${h(n.name)}</label>`).join('')}</div>`;}
    if(e.type==='link'){const l=rack().links.find(l=>l.id===e.key)||{};body=['a','b'].map((side,i)=>{const dev=device(l[side]?.device)||rack().devices[i]||rack().devices[0];return select(side+'-device','Device '+side.toUpperCase(),rack().devices.map(d=>[d.id,d.name]),dev?.id)+select(side+'-port','Port '+side.toUpperCase(),(dev?.ports||[]).map(p=>[p.id,p.name+(occupied(dev.id,p.id,e.key)?' (in use)':'')]),l[side]?.port);}).join('')+select('network','Network',Object.entries(roles),l.network||'host')+select('state','Wiring confirmation',[['planned','\u898f\u5283\u4e2d / unverified'],['confirmed','\u5df2\u78ba\u8a8d\u63a5\u7dda']],l.state||'planned')+field('note','Note / VLAN / cable label',l.note);}
    if(e.type==='batch')body=`<p>\u4f9d\u52fe\u9078\u8a2d\u5099\u9806\u5e8f\u914d\u5c0d Switch \u9023\u7e8c\u57e0\u865f\u3002\u5148\u7522\u751f\u898f\u5283\u7dda\uff0c\u5132\u5b58\u524d\u53ef\u6aa2\u67e5\u3002</p>${select('switch','Target switch',rack().devices.filter(d=>d.kind==='switch').map(d=>[d.id,d.name]))}${select('role','Server port role',Object.entries(roles),'host')}${field('start','Start switch port (list position)',1,'number')}<div class="nt-checks">${rack().devices.filter(d=>d.kind==='server').map(d=>`<label><input type="checkbox" name="servers" value="${h(d.id)}" checked>${h(d.name)}</label>`).join('')}</div>`;
    return `<form class="nt-form"><h3>${h({rack:'Add Rack','rename-rack':'Rename Rack',device:'Device',import:'Add inventory',node:'Node / DPU mapping',port:'Physical port',link:'Connect ports',batch:'Batch wiring'}[e.type])}</h3>${body}<div class="nt-actions"><button class="btn primary" type="submit">\u5957\u7528\u81f3\u8349\u7a3f</button>${button('cancel','\u53d6\u6d88')}</div></form>`;
  }
  function makeDevice(name,kind,template,count,inventory='',nodeCount=1,paired=false,dpuLabel='DPU') {
    const d={id:id(),name,kind,inventory,nodes:[],ports:[]};
    if(template!=='blank'&&kind==='server'){
      d.nodes=Array.from({length:nodeCount},(_,i)=>({id:id(),name:'Node '+(i+1),bf4:paired?dpuLabel+' #'+(i+1):'',host_os:'',host_bmc:'',dpu_os:'',dpu_bmc:''}));
      d.ports=(paired?['host','dpu']:['host']).map((role,i)=>({id:id(),name:'RJ45 #'+(i+1),role,nodes:d.nodes.map(n=>n.id)}));
    }
    if(kind==='switch')d.ports=Array.from({length:count},(_,i)=>({id:id(),name:String(i+1),role:'other',nodes:[]}));
    return d;
  }
  function number(key,max=256){const n=Number(val(key));if(!Number.isInteger(n)||n<1||n>max)throw Error('Enter a whole number from 1 to '+max);return n;}
  function required(key){const value=val(key).trim();if(!value)throw Error(key+' is required');return value;}
  const checked=name=>[...root.querySelectorAll(`input[name="${name}"]:checked`)].map(e=>e.value);
  async function submit() {
    const e=state.editor,r=rack();if(!e)return;
    if(e.type==='rack'){const x={id:id(),name:required('name'),devices:[],links:[]};state.doc.racks.push(x);state.rack=x.id;}
    if(e.type==='rename-rack')r.name=required('name');
    if(e.type==='device') {const name=required('name'),kind=val('kind');if(e.key)Object.assign(device(e.key),{name,kind});else r.devices.push(makeDevice(name,kind,val('template'),kind==='switch'?number('count'):0,'',kind==='server'&&val('template')!=='blank'?number('nodes',64):1,val('paired')==='yes',val('dpu-label').trim()||'DPU'));}
    if(e.type==='import') {const count=number('count'),names=checked('inventory'),nodeCount=val('template')==='blank'?1:number('nodes',64),paired=val('paired')==='yes',dpuLabel=val('dpu-label').trim()||'DPU';if(!names.length)throw Error('Select at least one device');names.forEach(name=>{const m=machines.find(m=>m.name===name),type=mgxTypeOf(m);r.devices.push(makeDevice(name,['server','switch'].includes(type)?type:'other',val('template'),count,name,nodeCount,paired,dpuLabel));});}
    if(e.type==='node'){const d=device(e.device),n={id:e.key||id(),name:required('name'),bf4:val('bf4').trim()};for(const k of ['host_os','host_bmc','dpu_os','dpu_bmc'])n[k]=val(k).trim();const index=d.nodes.findIndex(x=>x.id===e.key);if(index<0)d.nodes.push(n);else d.nodes[index]=n;}
    if(e.type==='port'){const d=device(e.device),name=required('name');if(d.ports.some(p=>p.id!==e.key&&p.name===name))throw Error('Port name already exists');const p={id:e.key||id(),name,role:val('role'),nodes:checked('node')};const index=d.ports.findIndex(x=>x.id===e.key);if(index<0)d.ports.push(p);else d.ports[index]=p;}
    if(e.type==='link') {const l={id:e.key||id(),a:{device:required('a-device'),port:required('a-port')},b:{device:required('b-device'),port:required('b-port')},network:val('network'),state:val('state'),note:val('note').trim()};if(l.a.device===l.b.device)throw Error('Choose two different devices');if([l.a,l.b].some(x=>occupied(x.device,x.port,e.key)))throw Error('Physical port already connected. Edit or remove its existing cable first.');const index=r.links.findIndex(x=>x.id===e.key);if(index<0)r.links.push(l);else r.links[index]=l;}
    if(e.type==='batch') {const sw=device(required('switch')),start=number('start')-1,role=val('role'),servers=checked('servers');if(!servers.length)throw Error('Select servers');const additions=servers.map((key,i)=>{const d=device(key),ports=d.ports.filter(p=>p.role===role),sp=sw.ports[start+i];if(ports.length!==1)throw Error(d.name+': needs exactly one '+roles[role]+' port; use manual pairing for multiple ports');if(!sp)throw Error('Not enough switch ports');if(occupied(d.id,ports[0].id)||occupied(sw.id,sp.id))throw Error(d.name+' / switch '+sp.name+': port already connected');return {id:id(),a:{device:d.id,port:ports[0].id},b:{device:sw.id,port:sp.id},network:role,state:'planned',note:''};});r.links.push(...additions);}
    changed();
  }
  async function action(name,key) {
    if(name==='close')return close();
    if(name==='save'){
      if(state.editor)throw Error('Apply or cancel the open form before saving.');
      state.busy=true;root.querySelector('[data-action="save"]').disabled=true;
      try{state.doc=await api('/api/projects/'+encodeURIComponent(state.project)+'/topology',{method:'PUT',headers:{'Content-Type':'application/json'},body:JSON.stringify(state.doc)});state.dirty=false;render();}finally{state.busy=false;const b=root?.querySelector('[data-action="save"]');if(b)b.disabled=false;}return;
    }
    if(name==='reload'){if((state.dirty||state.editor)&&!await confirmDraft('Discard draft and load the latest saved topology?'))return;state.busy=true;try{state.doc=await api('/api/projects/'+encodeURIComponent(state.project)+'/topology');state.rack=state.doc.racks[0]?.id||'';state.dirty=false;state.editor=null;state.focus='';render();}finally{state.busy=false;}return;}
    if(name==='export'){const url=URL.createObjectURL(new Blob([JSON.stringify(state.doc,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='topology.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);return;}
    if(name==='cancel'){if(!await confirmDraft('Discard unapplied form changes?'))return;state.editor=null;render();return;}
    if(name==='focus'){if(state.editor)throw Error('Apply or cancel the open form first.');state.focus=key;render();return;}
    if(name.startsWith('delete-')){
      if(!await confirmDraft('Remove this item and its dependent wiring/mappings from the draft?'))return;
      const r=rack();
      if(name==='delete-rack'){state.doc.racks=state.doc.racks.filter(x=>x.id!==r.id);state.rack=state.doc.racks[0]?.id||'';state.focus='';}
      if(name==='delete-device'){r.devices=r.devices.filter(d=>d.id!==key);r.links=r.links.filter(l=>![l.a.device,l.b.device].includes(key));if(state.focus===key)state.focus='';}
      if(name==='delete-link')r.links=r.links.filter(l=>l.id!==key);
      if(name==='delete-node'){const d=device(state.focus);d.nodes=d.nodes.filter(n=>n.id!==key);d.ports.forEach(p=>p.nodes=p.nodes.filter(n=>n!==key));}
      if(name==='delete-port'){const d=device(state.focus);d.ports=d.ports.filter(p=>p.id!==key);r.links=r.links.filter(l=>![l.a,l.b].some(x=>x.device===d.id&&x.port===key));}
      changed();return;
    }
    if(state.editor&&!await confirmDraft('Discard unapplied form changes?'))return;
    if(['node','port'].includes(name)){state.focus=key;state.editor={type:name,device:key,key:''};}
    else if(['edit-node','edit-port'].includes(name))state.editor={type:name.slice(5),device:state.focus,key};
    else state.editor={type:name,key};
    render();
  }
  window.addEventListener('beforeunload',event=>{if(state?.dirty||state?.editor){event.preventDefault();event.returnValue='';}});
  window.PATopology={open};
})();

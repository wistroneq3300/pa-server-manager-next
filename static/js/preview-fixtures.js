/* Isolated browser-only fixtures. No API request or terminal reaches a host.
 * QA query: ?preview=empty (empty workspace), loading (1.6s detail delay),
 * error (detail fails once per machine, then succeeds when retried).
 * All mutations reset on reload. No credentials are recorded in diagnostics. */
(() => {
  const nativeFetch = window.fetch.bind(window);
  const scenario = new URLSearchParams(location.search).get('preview') || 'normal';
  const requests = [], failedDetails = new Set();
  const pause = ms => new Promise(resolve => setTimeout(resolve,ms));
  const projects = [
    {name:'fleet_l',desc:'System validation / GPU platforms',level:'system',order:0},
    {name:'node_i',desc:'System integration / compute nodes',level:'system',order:1},
    {name:'host_e',desc:'Firmware qualification',level:'system',order:2},
    {name:'node_h',desc:'Hardware verification',level:'system',order:3},
    {name:'client_c',desc:'System compatibility',level:'system',order:4},
    {name:'proj_k',desc:'Rack integration / compute, network, power & cooling',level:'rack',order:5}
  ];
  const machines = [];
  [4,3,2,2,1].forEach((count,p) => {
    for(let i=0;i<count;i++) {
      const n=machines.length+1;
      machines.push({name:['host_a','host_g','host_f','host_b'][i] && p===0 ? ['host_a','host_g','host_f','host_b'][i] : projects[p].name+'-'+String(i+1).padStart(2,'0'), project:projects[p].name,level:'system',mgx_type:'server',os_ip:'192.0.2.'+(20+n),bmc_ip:'198.51.100.'+(20+n),os_user:'demo',os_pass:'preview-only',bmc_user:'demo',bmc_pass:'preview-only',os_port:22,bmc_port:22,os_alive:n!==4&&n!==9,bmc_alive:n!==9,power:n===9?'OFF':'ON',order:i,rack_u:0,rack_size:1});
    }
  });
  const rack=[['SW-01','switch',48,2],['SW-02','switch',46,2],['GPU-01','server',44,4],['GPU-02','server',40,4],['GPU-03','server',36,4],['GPU-04','server',32,4],['GPU-05','server',28,4],['GPU-06','server',24,4],['PS-01','powershelf',20,3],['PS-02','powershelf',17,3],['PDU-01','pdu',14,2],['CDU-01','cdu',12,6],['BLANK-01','blanking',6,2]];
  rack.forEach(([name,kind,u,size],i)=>machines.push({name,project:'proj_k',level:'rack',mgx_type:kind,rack_u:u,rack_size:size,order:i,os_ip:kind==='blanking'?'':'192.0.2.'+(100+i),os_user:'demo',os_pass:'preview-only',os_port:22,bmc_ip:kind==='server'?'198.51.100.'+(100+i):'',bmc_user:'demo',bmc_pass:'preview-only',os_alive:kind==='blanking'?null:i!==6,bmc_alive:kind==='server',power:kind==='blanking'?null:'ON',passive:kind==='blanking'}));
  let links=machines.filter(m=>m.project==='proj_k'&&m.mgx_type==='server').slice(0,3).map((m,i)=>({a:m.name,b:'SW-01',type:'eth',a_port:'eth0',b_port:'1/'+(i+1)}));
  if(scenario==='empty'){projects.length=0;machines.length=0;links=[];}
  const now=Math.floor(Date.now()/1000);
  let library,lastScan=now,newMachineSequence=1;
  const response=(data,status=200)=>Promise.resolve(new Response(JSON.stringify(data),{status,headers:{'Content-Type':'application/json'}}));
  const fail=(detail,status=400)=>response({ok:false,detail},status);
  const projectList=()=>projects.map(p=>({...p,machine_count:machines.filter(m=>m.project===p.name).length})).sort((a,b)=>a.order-b.order);
  const machineList=()=>[...machines].sort((a,b)=>a.order-b.order);
  const powerStatus=m=>'Chassis Power is '+(m.power==='ON'?'on':'off');
  function placementError(m){
    if(m.level!=='rack'||!m.rack_u)return '';
    const top=Number(m.rack_u),height=Number(m.rack_size)||1,bottom=top-height+1;
    if(!Number.isInteger(top)||!Number.isInteger(height)||top>48||bottom<1||height<1)return '元件位置必須在 U1–U48 範圍內。';
    return machines.some(x=>x.name!==m.name&&x.level==='rack'&&x.project===m.project&&x.rack_u>0&&bottom<=x.rack_u&&top>=x.rack_u-(x.rack_size||1)+1)?'目標 U 槽已被其他元件占用。':'';
  }
  const defs={server:{cpu_used:{label:'CPU',unit:'%',color:'#007b9e'},mem_used_pct:{label:'Memory',unit:'%',color:'#889f30'},gpu_power:{label:'GPU power',unit:'W',color:'#4893ac'}},switch:{port_rx:{label:'Port RX',unit:'MB/s'},port_tx:{label:'Port TX',unit:'MB/s'},temp:{label:'Temperature',unit:'°C'}},powershelf:{power_w:{label:'Power',unit:'W'},voltage:{label:'Voltage',unit:'V'},current_a:{label:'Current',unit:'A'}},pdu:{power_w:{label:'Power',unit:'W'},current_a:{label:'Current',unit:'A'}},cdu:{flow_lpm:{label:'Flow',unit:'L/min'},inlet_temp:{label:'Inlet',unit:'°C'},outlet_temp:{label:'Outlet',unit:'°C'},pressure:{label:'Pressure',unit:'bar'}}};
  window.fetch=async (input,options={})=>{
    const url=new URL(typeof input==='string'?input:input.url,location.href),path=decodeURIComponent(url.pathname),method=(options.method||'GET').toUpperCase();
    if(!path.startsWith('/api/'))return nativeFetch(input,options);
    requests.push({method,path});if(requests.length>300)requests.shift();
    const minutes=Math.min(1440,Math.max(1,Number(url.searchParams.get('minutes'))||60));
    const sampleNow=Math.floor(Date.now()/1000),ts=Array.from({length:25},(_,i)=>sampleNow-minutes*60+i*minutes*60/24),wave=(base,amp)=>ts.map((_,i)=>Math.round((base+Math.sin(i*.65)*amp+Math.cos(i*.19)*amp*.3)*10)/10);
    let body={};try{body=JSON.parse(options.body||'{}');}catch{}
    if(path==='/api/machines'&&method==='GET'){if(url.searchParams.has('force_scan')){await pause(350);lastScan=Math.max(lastScan+1,Math.floor(Date.now()/1000));}return response({machines:machineList(),last_scan:lastScan});}
    if(path==='/api/projects'&&method==='GET')return response({projects:projectList()});
    if((path==='/api/projects/reorder'||path==='/api/machines/reorder')&&method==='POST'){
      const items=path.includes('/projects/')?projects:machines,names=body.names;
      if(!Array.isArray(names)||new Set(names).size!==names.length||names.some(name=>!items.some(item=>item.name===name)))return fail('排序項目無效。');
      names.forEach((name,order)=>{items.find(item=>item.name===name).order=order;});return response({ok:true});
    }
    if(path==='/api/links'){if(method==='DELETE')links=links.filter(l=>l.a!==body.a||l.b!==body.b);else if(method!=='GET')return fail('拓樸建立功能尚未開放。',501);return response({links});}
    if(path==='/api/ai/gpu-alerts')return response({alerts:[],count:0});
    if(path==='/api/rack/ping')return response({nodes:machines.filter(m=>m.project===url.searchParams.get('project'))});
    if(path==='/api/ping-ip')return response({alive:true,ok:true});
    if(path.includes('/testlibrary')){
      library=library||await nativeFetch('/fixtures/tests.json').then(r=>r.json());
      const sheets=Object.values(library.sheets);
      if(path.endsWith('/meta'))return response({total:library.total,sheets:sheets.map(s=>({sheet:s.name,label:s.label,count:s.items.length,auto:s.items.filter(i=>i.ai_can_execute==='YES').length,partial:s.items.filter(i=>i.ai_can_execute==='PARTIAL').length,no:s.items.filter(i=>i.ai_can_execute==='NO').length}))});
      return response(sheets.find(s=>s.name===url.searchParams.get('sheet'))||{items:[]});
    }
    if(path.endsWith('/analyze')){await pause(180);return response({analysis:'[模擬分析] 範例溫度與電力讀值穩定。請選擇系統及時間範圍檢查指標。此結果未連線至設備。',counts:{total:6,ok:6,ns:0,warning:0,critical:0}});}
    if(path.includes('/copilot'))return response({reply:'[Design preview] L10 System Level and L11 Rack Level are separate project groups. Choose a project to review its systems, telemetry and operations.',answer:'[Design preview] Select a project to inspect its managed systems.'});
    if(path.includes('/rack/')&&path.endsWith('/telemetry')){
      const members=machines.filter(m=>m.project===path.split('/')[3]&&m.mgx_type!=='blanking'),kinds=[...new Set(members.map(m=>m.mgx_type))],data={};
      kinds.forEach(k=>{const d=defs[k]||defs.server;data[k]={defs:d,machines:members.filter(m=>m.mgx_type===k).map(m=>({name:m.name,...Object.fromEntries(Object.keys(d).map((key,i)=>[key,Math.round(20+i*12)]))})),history:Object.fromEntries(Object.entries(d).map(([key,v],i)=>[key,{...v,agg:'avg',ts,values:wave(20+i*12,3)}]))};});
      return response({project:path.split('/')[3],window_min:minutes,kinds,kinds_count:Object.fromEntries(kinds.map(k=>[k,members.filter(m=>m.mgx_type===k).length])),components:members,data});
    }
    if(path.startsWith('/api/machine/')){
      const [, , ,name,action]=path.split('/'),m=machines.find(m=>m.name===name);
      if(!m)return fail('找不到這台系統。',404);
      if(action==='detail'&&scenario==='loading')await pause(1600);
      if(action==='detail'&&scenario==='error'&&!failedDetails.has(name)){failedDetails.add(name);return fail('模擬暫時無法取得資料，請重新載入。',503);}
      if(action==='detail')return response({machine:m,power:'Chassis Power is '+(m.power==='ON'?'on':'off'),fw:[{key:'Firmware Revision',value:'2.10.0 (sample)'},{key:'IPMI Version',value:'2.0'},{key:'Manufacturer',value:'Wistron'}],os_info:{fetched_at:'Design preview',os:{distro:'Ubuntu 24.04 LTS',uptime:'12 days',cpu:'384',mem:'1536 GB'},hw:{cpu:{model:'AMD EPYC 9654 · sample inventory',sockets:2,cores:96,threads:2},dimm:{count:24,types:['DDR5'],speeds:['4800 MT/s'],parts:['64 GB ECC RDIMM']},ssd:[{name:'nvme0n1',model:'Enterprise NVMe',size:'3.84 TB'},{name:'nvme1n1',model:'Enterprise NVMe',size:'3.84 TB'}],gpu:Array.from({length:8},(_,i)=>({name:'NVIDIA H100 · GPU '+i,mem:'80 GB',util:'Sample'})),nic:['01:00.0 Ethernet controller: Mellanox Technologies ConnectX-7'],firmware:{bios:{vendor:'AMI',version:'1.20 (sample)'},gpu:[{index:'0–7',fw:'Sample VBIOS'}]}}}});
      if(action==='sensors')return response({sensors:{total:6,ok:6,critical:0,warning:0,ns:0,entries:['CPU1 Temp | 48 degrees C | ok','CPU2 Temp | 46 degrees C | ok','Inlet Temp | 24 degrees C | ok','Fan1 | 8400 RPM | ok','PSU1 | 230 Volts | ok','PSU2 | 230 Volts | ok']}});
      if(action==='telemetry')return response({os:{os:ts.map((t,i)=>({ts:t,cpu_used:wave(45,9)[i],cpu_temp_c:wave(48,3)[i],load1:4,load5:3,load15:2,mem_used_pct:38,mem_total_gb:1536,mem_used_gb:583.68,mem_avail_gb:952.32})),disk:[{mount:'/',ts,pct:wave(26,1),used_gb:wave(180,2)}],net:[{iface:'eth0',points:ts.map((t,i)=>({ts:t,rx:wave(20e6,3e6)[i],tx:wave(10e6,2e6)[i]}))}]},gpu:{series:Array.from({length:8},(_,i)=>({gpu:i,name:'NVIDIA H100',ts,util:wave(45+i*6,6),mem_used:wave(30+i,2),temp:wave(55+i,3),power:wave(310+i*10,15)}))}});
      if(action==='diagnose'){await pause(240);return response({ok:true,report:'[模擬診斷]\nOS：'+(m.os_alive?'可連線':'離線')+'\nBMC：'+(m.bmc_alive?'可連線':'未連線')+'\n電源：'+m.power+'\n此報告使用預覽資料，沒有執行設備指令。',collected_at:new Date().toISOString(),collect:{os:'Sample Ubuntu / AMD EPYC / 8 GPUs',bmc:'Sample SEL: no critical entries',bmc_mode:'preview'}});}
      if(method==='POST'&&['power','reboot','aux'].includes(action)){await pause(150);m.power=action==='power'&&(body.action==='off'||body.on===false)?'OFF':'ON';m.os_alive=Boolean(m.power==='ON'&&m.os_ip);return response({ok:true,output:'Preview only; no command executed.',power:m.power,power_status:powerStatus(m),info:'模擬操作完成'});}
    }
    if(path==='/api/machines/probe-bmc')return response({ok:true,bmc_ip:'198.51.100.250',hostname:'demo-new-system'});
    if(path.includes('/kvm/'))return response({sync_ok:true,ok:true,machines:[],reason:'Preview only'});
    if(path==='/api/projects'&&method==='POST'){
      if(!body.name?.trim())return fail('請填專案名稱。');
      if(projects.some(p=>p.name===body.name))return fail('專案名稱已存在。',409);
      projects.push({...body,name:body.name.trim(),order:projects.length});return response({ok:true,projects:projectList()});
    }
    if(path.startsWith('/api/projects/')){
      const p=projects.find(p=>p.name===path.split('/')[3]);if(!p)return fail('找不到專案。',404);
      if(method==='PATCH'){if(body.name&&projects.some(x=>x!==p&&x.name===body.name))return fail('專案名稱已存在。',409);const oldName=p.name;Object.assign(p,body);machines.filter(m=>m.project===oldName).forEach(m=>{m.project=p.name;});}
      if(method==='DELETE'){if(machines.some(m=>m.project===p.name))return fail('此專案還有機台，無法刪除。',409);projects.splice(projects.indexOf(p),1);}
      return response({ok:true,projects:projectList()});
    }
    if((path==='/api/machines'||path==='/api/rack/passive')&&method==='POST'){
      if(!projects.some(p=>p.name===body.project))return fail('請選擇有效的專案。');
      const passive=path==='/api/rack/passive',name=passive?String(body.name||'').trim():body.name||'demo-system-'+newMachineSequence++;
      if(!name)return fail('請填元件名稱。');if(machines.some(m=>m.name===name))return fail('系統名稱已存在。',409);
      const m={...body,name,mgx_type:body.mgx_type||'server',level:passive?'rack':body.level||'system',passive,os_ip:passive?body.manage_ip||'':body.os_ip,os_alive:passive?(body.manage_ip?true:null):true,bmc_alive:Boolean(body.bmc_ip),power:passive?null:'ON',order:machines.filter(x=>x.project===body.project).length,rack_u:passive?Number(body.rack_u):0,rack_size:Number(body.rack_size)||1};
      const error=placementError(m);if(error)return fail(error,409);
      machines.push(m);return response({ok:true,machine:m,name:m.name,machines:machineList()});
    }
    if(path.startsWith('/api/machines/')){
      const m=machines.find(m=>m.name===path.split('/')[3]);if(!m)return fail('找不到這台系統。',404);
      if(method==='PATCH'){const error=placementError({...m,...body});if(error)return fail(error,409);Object.assign(m,body);if(body.level==='system')m.rack_u=0;}
      if(method==='DELETE'){machines.splice(machines.indexOf(m),1);links=links.filter(l=>l.a!==m.name&&l.b!==m.name);}
      if(body.new_os_ip)m.os_ip=body.new_os_ip;if(body.new_bmc_ip)m.bmc_ip=body.new_bmc_ip;
      return response({ok:true,machine:m,machines:machineList()});
    }
    return response({ok:false,detail:'This action is not connected in the design preview.'},400);
  };
  class PreviewSocket extends EventTarget{
    static CONNECTING=0;static OPEN=1;static CLOSING=2;static CLOSED=3;
    constructor(url){super();this.url=String(url);this.readyState=0;this.targets=[];this.openTimer=setTimeout(()=>{if(this.readyState!==0)return;this.readyState=1;this.onopen?.(new Event('open'));this.dispatchEvent(new Event('open'));if(!this.url.includes('rack-broadcast'))this.emit('\r\nWISTRON PA / DESIGN PREVIEW\r\nNo SSH connection. No commands are executed.\r\n\r\ndemo@preview:~$ ');},120);}
    emit(data){if(this.readyState!==1)return;const e=new MessageEvent('message',{data});this.onmessage?.(e);this.dispatchEvent(e);}
    send(data){
      if(this.readyState!==1)return;let j;try{j=JSON.parse(data);}catch{}
      if(this.url.includes('rack-broadcast')){
        if(Array.isArray(j?.targets)){this.targets=j.targets;setTimeout(()=>{this.emit(JSON.stringify({type:'ready',joined:this.targets,failed:[]}));this.targets.forEach(name=>this.emit(JSON.stringify({type:'out',name,data:'\r\nWISTRON PA / BROADCAST PREVIEW\r\nNo commands are executed.\r\ndemo@preview:~$ '})));},40);}
        else if(j?.type==='broadcast'||j?.type==='sendOne'){const names=j.type==='broadcast'?[...this.targets]:[j.name];setTimeout(()=>names.forEach(name=>this.emit(JSON.stringify({type:'out',name,data:'\r\n[Preview only — no command executed]\r\ndemo@preview:~$ '}))),30);}
        else if(j?.type==='closeOne')this.targets=this.targets.filter(n=>n!==j.name);
      }else if(!j&&typeof data==='string'&&data.includes('\r'))this.emit('\r\n[Preview only]\r\ndemo@preview:~$ ');
    }
    close(){clearTimeout(this.openTimer);if(this.readyState===3)return;this.readyState=3;this.onclose?.(new Event('close'));this.dispatchEvent(new Event('close'));}
  }
  window.WebSocket=PreviewSocket;
  window.PA_PREVIEW={projects,machines,scenario,requests};
})();

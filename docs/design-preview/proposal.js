/* Design-only overlay. Production files and hardware scenes remain unchanged. */
(() => {
 'use strict';
 const H=document.documentElement;
 let mode='proposal',filter='attention',query='';
 H.dataset.design=mode;
 const icon=(name)=>'<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">'+({ok:'<path d="m5 12 4 4 10-10"/>',fail:'<path d="M12 7v6m0 3v1"/><path d="m12 3 10 18H2Z"/>',unknown:'<circle cx="12" cy="12" r="9"/><path d="M8 12h8"/>',arrow:'<path d="M4 12h15m-6-6 6 6-6 6"/>',sun:'<circle cx="12" cy="12" r="4"/><path d="M12 1v3m0 16v3M1 12h3m16 0h3M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>'}[name]||'')+'</svg>';
 const code=v=>v===true?'ok':v===false?'fail':'unknown';
 const badge=(v,label)=>'<span class="design-status '+code(v)+'">'+icon(code(v))+'<span>'+esc(label||(v===true?'Ping \u53ef\u9054':v===false?'Ping \u672a\u56de\u61c9':'\u5c1a\u672a\u89c0\u6e2c'))+'</span></span>';
 const legend=()=>'<div class="design-legend" aria-label="Ping \u72c0\u614b\u5716\u4f8b"><strong>Ping \u72c0\u614b</strong>'+badge(true)+badge(false)+badge(null)+'<small>\u53ea\u8868\u793a ICMP \u53ef\u9054\u6027\uff1b\u4e0d\u4ee3\u8868\u96fb\u6e90\u3001\u786c\u9ad4\u5065\u5eb7\u6216\u767b\u5165\u6210\u529f\u3002</small></div>';
 const attention=m=>(m.os_ip&&m.os_alive===false)||(m.bmc_ip&&m.bmc_alive===false);
 const unknown=m=>(m.os_ip&&m.os_alive==null)||(m.bmc_ip&&m.bmc_alive==null);
 const eligible=()=>machines.filter(m=>m.mgx_type!=='blanking'&&(m.os_ip||m.bmc_ip));
 const quote=v=>esc(JSON.stringify(v));
 function rows(){
   const list=eligible().filter(m=>filter==='all'||(filter==='attention'?attention(m):unknown(m))).filter(m=>(m.name+' '+m.project+' '+m.os_ip+' '+m.bmc_ip).toLowerCase().includes(query.toLowerCase()));
   return '<div class="design-table-scroll"><table class="design-table"><thead><tr><th>\u8a2d\u5099 / \u5c08\u6848</th><th>OS / \u7ba1\u7406 IP</th><th>OS Ping</th><th>BMC Ping</th><th><span class="design-sr">\u64cd\u4f5c</span></th></tr></thead><tbody>'+list.map(m=>'<tr><td><b>'+esc(m.name)+'</b><small>'+esc(m.project||'\u672a\u5206\u985e')+(m.level==='rack'?' \u00b7 L11 / '+(m.rack_u?'U'+m.rack_u:'\u6ac3\u5916'):' \u00b7 L10')+'</small></td><td class="design-ip">'+esc(m.os_ip||'\u2014')+'</td><td>'+(m.os_ip?badge(m.os_alive):'<span class="design-muted">\u672a\u8a2d\u5b9a</span>')+'</td><td>'+(m.bmc_ip?badge(m.bmc_alive):'<span class="design-muted">\u672a\u8a2d\u5b9a</span>')+'</td><td><button class="design-row-action" onclick="openMachine('+quote(m.name)+')">\u6aa2\u8996\u8a2d\u5099 '+icon('arrow')+'</button></td></tr>').join('')+'</tbody></table></div>'+(!list.length?'<div class="design-empty"><h3>'+(query?'\u6c92\u6709\u7b26\u5408\u7684\u8a2d\u5099':'\u76ee\u524d\u6c92\u6709'+(filter==='unknown'?'\u5c1a\u672a\u89c0\u6e2c':'Ping \u672a\u56de\u61c9')+'\u7684\u8a2d\u5099')+'</h3><p>'+(query?'\u8abf\u6574\u641c\u5c0b\u6587\u5b57\uff0c\u6216\u6e05\u9664\u641c\u5c0b\u5f8c\u518d\u67e5\u770b\u3002':'\u4f60\u53ef\u4ee5\u5207\u63db\u300c\u5168\u90e8\u8a2d\u5099\u300d\u7e7c\u7e8c\u6aa2\u8996\uff1b\u9019\u4e0d\u4ee3\u8868\u786c\u9ad4\u5065\u5eb7\u5df2\u7372\u78ba\u8a8d\u3002')+'</p><button class="btn" onclick="designReset()">\u67e5\u770b\u5168\u90e8\u8a2d\u5099</button></div>':'')+'<div class="design-table-foot" role="status">\u986f\u793a '+list.length+' \u53f0\u7b26\u5408\u689d\u4ef6\u7684\u8a2d\u5099<span>\u793a\u7bc4\u8cc7\u6599 \u00b7 \u672a\u57f7\u884c\u5373\u6642\u6aa2\u67e5</span></div>';
 }
 window.designFilter=value=>{filter=value;const root=document.querySelector('#design-queue');if(root)root.innerHTML=rows();document.querySelectorAll('[data-filter]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.filter===value)));};
 window.designSearch=value=>{query=value;const root=document.querySelector('#design-queue');if(root)root.innerHTML=rows();};
 window.designReset=()=>{query='';const input=document.querySelector('#design-search');if(input)input.value='';designFilter('all');};
 window.designTheme=()=>{applyTheme(H.dataset.theme==='light'?'dark':'light');refreshToolbar();};
 window.paDesignMode=value=>{mode=value;H.dataset.design=value;setView(state.view);refreshToolbar();};
 window.designHome=()=>setView('dashboard');
 window.designRack=()=>{const p=projects.find(p=>p.level==='rack');if(p)productRack(p.name);};
 function refreshToolbar(){
   document.querySelectorAll('[data-design-mode]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.designMode===mode)));
   const theme=document.getElementById('design-theme');if(theme)theme.innerHTML=icon('sun')+(H.dataset.theme==='light'?'\u6dfa\u8272\u4e3b\u984c':'\u6df1\u8272\u4e3b\u984c');
 }
 const dashboard=RENDERERS.dashboard;
 RENDERERS.dashboard=function(){
   const html=dashboard();if(mode==='original')return html;
   const root=document.createElement('div');root.innerHTML=html;
   const all=eligible(),fail=all.filter(attention).length,pending=all.filter(unknown).length;
   const summary='<section class="design-overview"><header class="design-page-head"><div><h1>\u7cfb\u7d71\u67b6\u69cb\u7e3d\u89bd</h1><p>\u5148\u78ba\u8a8d\u9023\u7dda\u7570\u5e38\uff0c\u518d\u9032\u5165\u8a2d\u5099\u8207\u6a5f\u6ac3\u3002</p></div><button class="btn primary" onclick="productLevel(\'system\')">\u7ba1\u7406\u8a2d\u5099 '+icon('arrow')+'</button></header>'+
   '<div class="design-statline"><div><span>\u5c08\u6848</span><b>'+projects.length+'</b></div><div><span>\u53d7\u7ba1\u8a2d\u5099 / \u5143\u4ef6</span><b>'+machines.length+'</b></div><button class="design-count-alert" onclick="designFilter(\'attention\')"><span>Ping \u672a\u56de\u61c9</span><b>'+fail+'</b><small>\u67e5\u770b\u5b8c\u6574\u6e05\u55ae '+icon('arrow')+'</small></button><button onclick="designFilter(\'unknown\')"><span>\u5c1a\u672a\u89c0\u6e2c</span><b>'+pending+'</b></button></div>'+
   '<section class="design-queue-panel"><header><div><h2>\u5f85\u78ba\u8a8d\u8a2d\u5099</h2><p>\u5148\u8fa8\u8b58\u5931\u6557\u7684\u4ecb\u9762\uff0c\u518d\u67e5\u770b\u8a2d\u5099\u8cc7\u8a0a\u3002</p></div><span class="design-demo-note">\u793a\u7bc4\u8cc7\u6599</span></header>'+
   '<div class="design-queue-tools"><div class="design-tabs" aria-label="\u8a2d\u5099\u72c0\u614b\u7be9\u9078">'+[['attention','\u672a\u56de\u61c9',fail],['unknown','\u5c1a\u672a\u89c0\u6e2c',pending],['all','\u5168\u90e8\u8a2d\u5099',all.length]].map(([value,title,n])=>'<button data-filter="'+value+'" aria-pressed="'+(filter===value)+'" onclick="designFilter(\''+value+'\')">'+title+' <span>'+n+'</span></button>').join('')+'</div><label class="design-search" for="design-search"><span class="design-sr">\u641c\u5c0b\u8a2d\u5099\u3001\u5c08\u6848\u6216 IP</span><input id="design-search" type="search" placeholder="\u641c\u5c0b\u8a2d\u5099\u3001\u5c08\u6848\u6216 IP" value="'+esc(query)+'" oninput="designSearch(this.value)"></label></div><div id="design-queue">'+rows()+'</div>'+legend()+'</section>'+
   '<div class="design-route-row"><div><h2>\u6a5f\u6ac3\u5de5\u4f5c\u5340</h2><p>\u6aa2\u8996\u539f\u6709 3D \u6a5f\u6ac3\u3001\u8a2d\u5099\u4f4d\u7f6e\u8207\u9023\u7dda\u914d\u7f6e\u3002</p></div><button class="btn" onclick="designRack()">\u958b\u555f Rack Manager '+icon('arrow')+'</button></div></section>';
   root.querySelector('.ux-overview')?.replaceWith(document.createRange().createContextualFragment(summary));
   return root.innerHTML;
 };
 const rack=RENDERERS.rack;
 RENDERERS.rack=function(){
   const html=rack();if(mode==='original')return html;
   const root=document.createElement('div');root.innerHTML=html;
   root.querySelector('.rack-hero')?.insertAdjacentHTML('afterend','<section class="design-rack-guide"><div><h2>\u6a5f\u6ac3\u6aa2\u8996\u8207\u64cd\u4f5c</h2><p>\u9078\u64c7\u8a2d\u5099 \u2192 \u6aa2\u8996\u4f4d\u7f6e\u8207\u9023\u7dda \u2192 \u57f7\u884c\u6240\u9700\u64cd\u4f5c</p></div><span>3D \u8a2d\u5099\u6750\u8cea\u6cbf\u7528\u539f\u7248</span></section>'+legend());
   root.querySelectorAll('.ux-action-group').forEach(group=>{const heading=group.querySelector('h3');if(heading&&heading.textContent.includes('\u9023\u7dda'))heading.textContent='\u9023\u7dda\u6aa2\u67e5';});
   return root.innerHTML;
 };

 /* Scope semantic styling to UI labels; no canvas, shaders or equipment materials. */
 for (const view of ['dashboard','projects','machine','rack']) {
   const render=RENDERERS[view];
   RENDERERS[view]=function(...args){
     const html=render(...args);if(mode==='original')return html;
     const root=document.createElement('div');root.innerHTML=html;
     root.querySelectorAll('.badge,.observation b,.p-status').forEach(el=>{
       const text=el.textContent;
       if(text.includes('Ping \u672a\u56de\u61c9'))el.classList.add('design-status','fail');
       else if(text.includes('Ping \u53ef\u9054'))el.classList.add('design-status','ok');
       else if(text.includes('\u5c1a\u672a\u89c0\u6e2c'))el.classList.add('design-status','unknown');
     });
     root.querySelectorAll('.eng-list-tools option').forEach(el=>{el.textContent=el.textContent.replace('OS \u96e2\u7dda','OS Ping \u672a\u56de\u61c9').replace('BMC \u96e2\u7dda','BMC Ping \u672a\u56de\u61c9').replace('\u672a\u77e5','\u5c1a\u672a\u89c0\u6e2c');});
     root.querySelectorAll('.p-status').forEach(el=>{
       if(el.textContent.includes('\u904b\u4f5c\u6b63\u5e38'))el.textContent='OS Ping \u53ef\u9054';
     });
     root.querySelectorAll('.cine-fleet,.eng-health').forEach(section=>{
       const walk=document.createTreeWalker(section,NodeFilter.SHOW_TEXT);let node;
       while((node=walk.nextNode()))node.textContent=node.textContent.replace(/\u5df2\u9023\u7dda/g,'Ping \u53ef\u9054').replace(/OS \u96e2\u7dda/g,'OS Ping \u672a\u56de\u61c9').replace(/ \u96e2\u7dda/g,' Ping \u672a\u56de\u61c9').replace(/\u672a\u77e5/g,'\u5c1a\u672a\u89c0\u6e2c');
     });
     root.querySelectorAll('.design-rack-guide').forEach(el=>{el.innerHTML='<p><strong>\u64cd\u4f5c\u9806\u5e8f</strong>\u3000\u9078\u64c7\u8a2d\u5099 \u2192 \u6aa2\u8996\u4f4d\u7f6e\u8207\u9023\u7dda \u2192 \u9078\u64c7\u64cd\u4f5c</p>';});
     root.querySelectorAll('.rack-hero button').forEach(el=>{el.classList.remove('primary');if(el.id==='rack-ping-btn')el.classList.add('primary');});
     return root.innerHTML;
   };
 }

 function toolbar(){
   const bar=document.createElement('div');bar.className='design-review-bar';bar.setAttribute('aria-label','\u8a2d\u8a08\u6bd4\u8f03\u5de5\u5177');
   bar.innerHTML='<div class="design-review-title"><b>Wistron \u00b7 UI \u8a2d\u8a08\u63d0\u6848</b><span>\u50c5\u9810\u89bd \u00b7 \u6a21\u64ec\u8cc7\u6599</span></div><div class="design-mode-group"><button data-design-mode="original" onclick="paDesignMode(\'original\')">\u539f\u7248</button><button data-design-mode="proposal" onclick="paDesignMode(\'proposal\')">\u8a2d\u8a08\u63d0\u6848</button></div><div class="design-review-nav"><button onclick="designHome()">\u9996\u9801</button><button onclick="designRack()">Rack</button><button id="design-theme" onclick="designTheme()"></button></div>';
   document.body.prepend(bar);refreshToolbar();
   document.getElementById('theme-toggle')?.addEventListener('click',()=>requestAnimationFrame(refreshToolbar));
 }
 if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',toolbar);else toolbar();
})();

/* Additive presentation only. Existing API handlers and multi-OS workflows remain owned by app.js. */
(() => {
  'use strict';
  const q = value => esc(JSON.stringify(String(value ?? '')));
  const baseMachine = RENDERERS.machine;
  RENDERERS.machine = function() {
    const root = document.createElement('div'); root.innerHTML = baseMachine();
    const machine = machines.find(m => m.name === _activeMachine);
    if (!machine || !root.querySelector('.pd-showcase')) return root.innerHTML;
    const type = PAHardwareVisuals.typeOf(machine);
    const stage = root.querySelector('.pd-hardware-stage');
    if (stage) {
      stage.dataset.componentType = type;
      stage.innerHTML = PAHardwareVisuals.render(machine) + `<span class="pd-stage-caption">${esc(PAHardwareVisuals.caption(type))}</span>`;
    }
    root.querySelector('.pd-workspace').dataset.componentType = type;
    const hw = machineDetailCache[_activeMachine]?.os_info?.hw || {};
    if (type !== 'server') {
      const heading = root.querySelector('.pd-identity-heading');
      if (heading && !hw.system?.model && !machine.model) heading.textContent = PAHardwareVisuals.label(type);
      root.querySelectorAll('.pd-summary-tile').forEach(tile => {
        const key = {memory:'dimm',storage:'ssd',network:'nic'}[tile.dataset.inventory] || tile.dataset.inventory;
        if (hw[key] == null) tile.remove();
      });
    }
    // Do not truncate the reported inventory to the legacy first twelve drives.
    const ssd = root.querySelector('.ssd-grid');
    if (ssd && Array.isArray(hw.ssd)) ssd.innerHTML = hw.ssd.map(d => `<div class="ssd-cell"><span class="ssd-name mono">${esc(d.name || '')}</span><span class="ssd-model">${esc(d.model || '')}</span><span class="ssd-size">${esc(d.size || '')}</span></div>`).join('');
    root.querySelectorAll('.hw-item').forEach((section, index) => {
      section.classList.add('ew-inventory-section');
      section.dataset.sectionIndex = String(index + 1).padStart(2,'0');
      const label = section.querySelector('.hw-label');
      if (label) label.setAttribute('role','heading');
      if (label) label.setAttribute('aria-level','3');
    });
    return root.innerHTML;
  };
  // Stable wrapper: asynchronous sensor refreshes use this same rendering function.
  const baseSensors = machineSensorsHtml;
  machineSensorsHtml = function(...args) {
    const root = document.createElement('div'); root.innerHTML = baseSensors(...args);
    const ai = root.querySelector('#sensor-ai');
    if (ai) {
      const panel = document.createElement('section'); panel.className = 'ew-analysis';
      panel.innerHTML = '<header><span>ASSISTED ANALYSIS</span><h3>Sensor AI</h3></header>';
      ai.before(panel); panel.append(ai);
    }
    const table = root.querySelector('.sdr-scroll');
    if (table) table.insertAdjacentHTML('beforebegin','<h3 class="ew-sdr-title">Sensor readings <small>SDR INVENTORY</small></h3>');
    return root.innerHTML;
  };

  let scene = null, canvas = null;
  let mode = '3d';
  const selectedByProject = new Map();
  const baseLayout = rackLayoutHtml;
  function rackMembers() { return projectMembers(rackView.project).filter(isRackItem); }
  window.equipmentRackMode = value => { mode = value === 'plane' ? 'plane' : '3d'; setView('rack'); };
  window.equipmentRackCamera = value => { if (value === 'reset') scene?.resetOrbit(); else scene?.setView(value); };
  window.equipmentRackZoom = factor => scene?.zoomBy(factor);
  function inspector(name) {
    const target = document.getElementById('ew-rack-inspector');
    if (!target) return;
    const m = rackMembers().find(item => item.name === name);
    if (!m) {target.innerHTML = '<div class="ew-inspector-empty">Select a component to inspect its placement and management interfaces.</div>';return;}
    const type = PAHardwareVisuals.typeOf(m);
    target.innerHTML = `<span class="pd-eyebrow">COMPONENT / ${esc(type.toUpperCase())}</span><h2>${esc(m.name)}</h2>${PAHardwareVisuals.render(m)}<p class="ew-illustration-note">${esc(PAHardwareVisuals.caption(type))}</p><dl><div><dt>PLACEMENT</dt><dd>${m.rack_u ? `U${Number(m.rack_u)} / ${Number(m.rack_size)||1}U` : 'Unplaced'}</dd></div><div><dt>OS / MANAGEMENT</dt><dd>${esc(m.os_ip || 'Not configured')}</dd></div><div><dt>BMC</dt><dd>${esc(m.bmc_ip || 'Not configured')}</dd></div></dl><div class="ew-inspector-actions"><button class="btn primary" onclick="openMachine(${q(m.name)})">Open component</button><button class="btn" onclick="rackMoveDialog(${q(m.name)})">Placement / type</button></div>`;
    const status=value=>value===true?'Online':value===false?'Offline':'Unknown';
    target.querySelector('dl').insertAdjacentHTML('beforeend',`<div><dt>CONNECTION / POWER</dt><dd>OS ${m.os_ip?status(m.os_alive):'Not configured'}<br>BMC ${m.bmc_ip?status(m.bmc_alive):'Not configured'}<br>Power ${esc(m.power_state ?? m.power ?? 'Unknown')}</dd></div>`);
  }
  window.equipmentRackSelect = name => {
    selectedByProject.set(rackView.project,name); scene?.select(name); inspector(name);
    const picker = document.getElementById('ew-rack-component'); if (picker) picker.value = name;
  };
  rackLayoutHtml = function(members,pinged) {
    members=rackMembers();
    const placement = PAWorkspaceReliability.validatePlacements(members);
    const old = baseLayout(devicesView === 'plane' ? placement.valid : members,pinged);
    if (devicesView !== 'plane') return old;
    const tabs=document.createElement('div');tabs.innerHTML=rackSubviewTabs();
    tabs.querySelectorAll('button').forEach(button=>{if((button.getAttribute('onclick')||'').includes("'plane'"))button.remove();});
    const controls = `<div class="ew-view-switch"><button aria-pressed="${mode==='3d'}" class="btn ${mode==='3d'?'primary':''}" onclick="equipmentRackMode('3d')">3D equipment</button><button aria-pressed="${mode==='plane'}" class="btn ${mode==='plane'?'primary':''}" onclick="equipmentRackMode('plane')">48U placement</button>${tabs.innerHTML}</div>`;
    if (mode === 'plane') return controls + old;
    const warnings = [...placement.issues.map(x=>`${x.name}: ${x.message}`),...placement.pending.map(x=>`${x.name}: unplaced`)];
    return `${controls}<section class="ew-rack-deck p-surface"><div class="ew-rack-stage"><header><div><span class="pd-eyebrow">L11 / EQUIPMENT VIEW</span><h2>${esc(rackView.project)}</h2></div><span>${placement.usedU} / 48U</span></header><canvas id="ew-rack-canvas" tabindex="0" aria-label="3D rack. Drag to orbit; arrow keys rotate; Home resets. Use component selector for keyboard selection."></canvas><div class="ew-rack-camera"><button class="btn small" onclick="equipmentRackCamera('perspective')">Perspective</button><button class="btn small" onclick="equipmentRackCamera('front')">Front</button><button class="btn small" onclick="equipmentRackCamera('rear')">Rear</button><button class="btn small" onclick="equipmentRackZoom(1.12)" aria-label="Zoom in">+</button><button class="btn small" onclick="equipmentRackZoom(0.893)" aria-label="Zoom out">−</button><button class="btn small" onclick="equipmentRackCamera('reset')">Reset</button></div><p class="ew-orbit-hint">Drag to orbit / click to select · Geometry follows saved U positions</p></div><aside class="ew-rack-aside"><label for="ew-rack-component">COMPONENT SELECTOR</label><select id="ew-rack-component" onchange="equipmentRackSelect(this.value)"><option value="">Select component</option>${members.map(m=>`<option value="${esc(m.name)}">${esc(m.name)} · ${esc(PAHardwareVisuals.label(PAHardwareVisuals.typeOf(m)))}</option>`).join('')}</select><div id="ew-rack-inspector"></div></aside></section>${warnings.length?`<div class="ew-placement-warning" role="status"><strong>Placement requires attention</strong><p>${warnings.map(esc).join('<br>')}</p><button class="btn" onclick="equipmentRackMode('plane')">Review placement</button></div>`:''}<div class="ew-rack-support">${rackTopoHtml(members)}${rackView.project?rackCopilotHtml():''}</div>`;
  };
  const baseRack = RENDERERS.rack;
  RENDERERS.rack = function() {
    const choices=PAWorkspaceReliability.rackProjects();
    const requested=choices.find(p=>p.name===rackView.project);
    if(requested && !projectMembers(requested.name).filter(isRackItem).some(m=>Number(m.rack_u)>0)) {
      racksProjectDesc=requested.desc||'';
      return `<header class="rack-hero"><div class="rack-hero-left"><div class="rack-hero-title">Rack Manager</div><div class="rack-hero-sub">${esc(requested.name)} / 48U</div></div><label class="rack-sel">Project<select class="input" onchange="rackSetProject(this.value)">${choices.map(p=>`<option value="${esc(p.name)}" ${p.name===requested.name?'selected':''}>${esc(p.name)}</option>`).join('')}</select></label><button class="btn primary" onclick="productLevel('rack');addRackComponentDialog()">Add component</button></header>${rackLayoutHtml([],[])}`;
    }
    const fragment=document.createElement('div');fragment.innerHTML=baseRack();
    const select=fragment.querySelector('.rack-sel select');
    const existing=new Set([...select?.options||[]].map(x=>x.value));
    choices.filter(p=>!existing.has(p.name)).forEach(p=>select?.insertAdjacentHTML('beforeend',`<option value="${esc(p.name)}">${esc(p.name)} (0)</option>`));
    return fragment.innerHTML;
  };
  function dispose() {scene?.destroy(); scene=null; canvas=null;}
  function mount() {
    const next = document.getElementById('ew-rack-canvas');
    if (next === canvas) return;
    dispose(); if (!next) return; canvas = next;
    const valid = PAWorkspaceReliability.validatePlacements(rackMembers()).valid;
    const fallback=()=>{if(!next.parentElement?.querySelector('.ew-gl-fallback'))next.insertAdjacentHTML('afterend','<div class="ew-gl-fallback" role="status">3D is unavailable. All management functions remain available in <button class="btn" onclick="equipmentRackMode(\'plane\')">48U placement</button>.</div>');};
    next.addEventListener('pa-rack-fallback',fallback);
    next.addEventListener('pa-rack-ready',()=>next.parentElement?.querySelector('.ew-gl-fallback')?.remove());
    scene = PARackScene.mount(canvas,{components:valid.map(m=>({...m,mgx_type:PAHardwareVisuals.typeOf(m)})),theme:document.documentElement.dataset.theme,onSelect:window.equipmentRackSelect});
    if (!scene.supported) fallback();
    equipmentRackSelect(selectedByProject.get(rackView.project)||valid[0]?.name||'');
  }
  const baseRender = _renderMachine;
  _renderMachine = function(...args) {dispose(); const result=baseRender(...args); mount(); return result;};
  window.addEventListener('pa-theme-change',e=>scene?.setTheme(e.detail.theme));
  window.addEventListener('pagehide',dispose);
  const baseDashboard=RENDERERS.dashboard;
  RENDERERS.dashboard=function(){
    const fragment=document.createElement('div');fragment.innerHTML=baseDashboard();
    if(!window.PA_PREVIEW){
      for(const selector of ['.p-page-foot span','.cine-footer>span:nth-child(2)','.cine-fleet-total small','.cine-insights-title>span']){
        const label=fragment.querySelector(selector);if(label)label.textContent='ENGINEERING WORKSPACE';
      }
    }
    return fragment.innerHTML;
  };
  document.addEventListener('DOMContentLoaded',()=>{
    mount();
    // The live application must not inherit the old fixture-preview badges.
    if (!window.PA_PREVIEW) {
      document.querySelector('.p-preview-label')?.remove();
      const badge=document.querySelector('.p-side-preview');
      if(badge)badge.innerHTML='<i class="p-live-dot"></i> ENGINEERING WORKSPACE<small>Live application</small><span id="mode-label" hidden></span>';
    }
  });
})();

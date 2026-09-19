/* Independent presentation layer. Data, endpoints and operations stay in app.js. */
(() => {
  'use strict';
  const originalMachine = RENDERERS.machine;
  const originalSensorAnalyze = sensorAnalyze;
  const selectedTabs = new Map();
  let taskMetaPromise;
  const quote = value => esc(JSON.stringify(String(value ?? '')));
  const title = (eyebrow, label, trailing = '') => `<div class="pd-section-heading"><div><span class="pd-eyebrow">${eyebrow}</span><h2>${label}</h2></div>${trailing}</div>`;
  const glyph = (name, fallback) => window.productIcon ? window.productIcon(name) : `<span aria-hidden="true">${fallback}</span>`;
  function chassis() {
    return `<div class="pd-chassis-stage" aria-label="立體伺服器示意圖"><div class="pd-stage-orbit"></div><div class="pd-chassis"><div class="pd-chassis-top"><span>WISTRON</span><i></i><i></i><i></i><i></i><b>SYSTEM ENGINEERING</b></div><div class="pd-chassis-face"><span class="pd-grip"></span><div class="pd-drive-bank">${Array.from({length: 12}, (_, i) => `<i><em></em><small>${String(i+1).padStart(2,'0')}</small></i>`).join('')}</div><div class="pd-front-io"><b></b><i></i><i></i><span>PA</span></div><span class="pd-grip"></span></div><div class="pd-chassis-side"></div></div><span class="pd-stage-caption">ENGINEERED FOR THE NEXT CHALLENGE</span><span class="pd-stage-index">SYSTEM / 01</span></div>`;
  }
  function cleanSection(node, heading, cls = '') {
    if (!node) return '';
    node.classList.remove('card');
    node.classList.add('pd-original-section');
    if (cls) node.classList.add(cls);
    node.removeAttribute('style');
    const headingNode = node.querySelector(':scope > .card-title');
    if (headingNode) {
      if (headingNode.classList.contains('tel-card-title')) {
        headingNode.querySelector('span').innerHTML = `Performance telemetry <span class="hint" id="tel-window"></span>`;
      } else headingNode.textContent = heading;
    }
    return node.outerHTML;
  }
  function operationButton(source, label, icon, primary = false) {
    if (!source) return '';
    const b = source.cloneNode(true);
    b.className = `pd-operation${primary ? ' pd-operation-primary' : ''}`;
    b.innerHTML = `${glyph(icon, '↗')}<span>${label}</span><b aria-hidden="true">↗</b>`;
    return b.outerHTML;
  }
  function kv(label, value, cls = '') { return `<div class="pd-key-value ${cls}"><span>${label}</span><strong>${esc(value || '—')}</strong></div>`; }
  function stateDot(online, label) { return `<span class="pd-state ${online ? 'pd-state-online' : 'pd-state-offline'}"><i></i>${label}</span>`; }
  const tabs = [['overview','Overview','系統概覽'],['hardware','Hardware','硬體配置'],['sensors','Sensors & firmware','感測與韌體'],['telemetry','Telemetry','效能遙測'],['tasks','Test tasks','測試任務']];
  // Keep the asynchronously produced report attached to its new workspace panel.
  sensorAnalyze = async function(name) {
    await originalSensorAnalyze(name);
    if (_activeMachine === name && sensorAiResult[name] != null) {
      const target = document.getElementById('sensor-ai');
      if (target) target.innerHTML = sensorAiResult[name];
    }
  };
  RENDERERS.machine = function productMachine() {
    const oldMarkup = originalMachine();
    const name = _activeMachine;
    const m = machines.find(x => x.name === name);
    const d = machineDetailCache[name];
    if (!m || !d || d.error) {
      const holder = document.createElement('div');
      holder.innerHTML = oldMarkup;
      return `<div class="pd-workspace"><button class="pd-back" onclick="machineBack()">← 返回專案</button><div class="pd-system-title"><span class="pd-eyebrow">SYSTEM WORKSPACE</span><h1>${esc(name || 'System details')}</h1></div><div class="pd-wait p-surface">${!d && m ? '<span class="pd-loader"></span>' : glyph('server', '◇')}<h2>${!m ? '找不到這台系統' : d?.error ? '暫時無法取得系統資料' : '正在準備系統工作區'}</h2><p>${esc(holder.querySelector('.empty')?.textContent || '')}</p>${d?.error ? '<button class="btn" onclick="machineRefresh()">重新載入</button>' : ''}</div></div>`;
    }
    const b = d.machine || m;
    const hw = d.os_info?.hw || {};
    const sensor = machineSensorsCache[name]?.sensors || {};
    const os = d.os_info?.os || {};
    const rack = b.level === 'rack';
    const level = rack ? 'L11' : 'L10';
    const selected = selectedTabs.get(name) || 'overview';
    const holder = document.createElement('div');
    holder.innerHTML = oldMarkup;
    const toolbar = holder.querySelector('.mach-toolbar');
    const buttons = [...(toolbar?.querySelectorAll('button') || [])];
    const findAction = fn => buttons.find(button => (button.getAttribute('onclick') || '').includes(fn));
    const cards = [...holder.querySelectorAll('.card')];
    const basic = cards.find(c => c.querySelector('.mach-info'));
    const hardware = cards.find(c => c.querySelector('.os-scroll'));
    const sensors = cards.find(c => c.querySelector('#sensor-body'));
    const firmware = cards.find(c => c.querySelector('.card-title')?.textContent.includes('BMC Firmware'));
    const diagnostic = cards.find(c => c.querySelector('#diag-body'));
    const telemetry = cards.find(c => c.querySelector('#tel-grid'));
    const powerActions = basic?.querySelector('.mach-power-actions');
    powerActions?.remove();
    if (diagnostic) {
      const body = diagnostic.querySelector('#diag-body');
      body.innerHTML = diagBodyFill(name);
      [...diagnostic.children].filter(c => c !== body && !c.classList.contains('card-title')).forEach(c => c.remove());
    }
    if (telemetry) {
      telemetry.querySelectorAll('.tel-block').forEach((block, index) => {
        block.dataset.key = ['cpu','mem','disk','net','gpu'][index];
        const head = block.querySelector('.tel-block-head');
        head.setAttribute('onclick', `toggleTel('${block.dataset.key}')`);
        head.setAttribute('role','button');
        head.setAttribute('tabindex','0');
        head.setAttribute('onkeydown',"if(event.key==='Enter'||event.key===' '){event.preventDefault();this.click();}");
        head.innerHTML += '<span class="tel-arrow" aria-hidden="true">−</span>';
      });
    }
    const hardwareSummary = [
      ['CPU', hw.cpu?.sockets ? `${hw.cpu.sockets} sockets` : '—', hw.cpu?.model || 'Processor inventory'],
      ['MEMORY', os.mem || (hw.dimm?.count ? `${hw.dimm.count} DIMMs` : '—'), (hw.dimm?.types || []).join(' / ') || 'Memory inventory'],
      ['ACCELERATORS', hw.gpu?.length ? `${hw.gpu.length} GPUs` : '—', hw.gpu?.[0]?.name || 'Accelerator inventory'],
      ['STORAGE', hw.ssd?.length ? `${hw.ssd.length} drives` : '—', hw.ssd?.[0]?.model || 'Storage inventory']
    ];
    const connection = `<div class="pd-connectivity"><div class="pd-connection"><div class="pd-connection-icon">OS</div><div><span>Operating system</span><strong>${esc(b.os_ip || '未設定 OS IP')}</strong><small>${esc(b.os_user || '—')} · SSH ${esc(String(b.os_port || 22))}</small></div>${stateDot(b.os_alive, b.os_alive ? 'Online' : 'Offline')}</div><div class="pd-connection"><div class="pd-connection-icon">BMC</div><div><span>Management controller</span><strong>${esc(b.bmc_ip || '未設定 BMC IP')}</strong><small>${esc(b.bmc_user || '—')} · IPMI</small></div>${stateDot(b.bmc_alive, !b.bmc_ip ? 'Not set' : b.bmc_alive ? 'Online' : 'Offline')}</div></div>`;
    const overview = `<div class="pd-overview-top"><section class="pd-showcase p-surface p-tilt"><div class="pd-showcase-copy"><span class="pd-eyebrow">${level} / ${rack ? 'RACK COMPONENT' : 'SYSTEM LEVEL'}</span><h2>Built to<br>perform<span>.</span></h2><p>${esc(os.distro || 'System platform')}</p></div>${chassis()}<div class="pd-showcase-foot"><span>${esc(b.project || '未分類專案')}</span><span>${esc(rack && b.rack_u ? `U${b.rack_u} · ${b.rack_size || 1}U` : 'SYSTEM VALIDATION')}</span></div></section><section class="pd-connect-panel p-surface">${title('CONNECTION HEALTH','連線狀態',stateDot(b.os_alive && (!b.bmc_ip || b.bmc_alive), b.os_alive && (!b.bmc_ip || b.bmc_alive) ? 'Connected' : 'Attention'))}${connection}<div class="pd-connection-foot"><span>Chassis power</span>${b.bmc_alive ? powerBadge(d.power) : '<span class="pd-dim">Unavailable</span>'}</div></section></div><div class="pd-inventory-summary">${hardwareSummary.map(([label,value,caption],i) => `<button class="pd-summary-tile p-surface p-tilt" onclick="productDetailTab('hardware')"><span class="pd-eyebrow">${label}</span><strong>${esc(value)}</strong><small title="${esc(caption)}">${esc(caption)}</small><span class="pd-tile-index">0${i+1} ↗</span></button>`).join('')}</div>${diagnostic ? `<section class="pd-diagnostic p-surface">${title('INTELLIGENT ASSISTANCE','系統診斷',`<button class="pd-text-action" onclick="runDiagnose(${quote(name)})">執行系統診斷 ${glyph('arrow-up-right','↗')}</button>`)}${cleanSection(diagnostic,'Diagnostic report','pd-diagnostic-content')}</section>` : ''}`;
    const hardwarePanel = `${title('COMPONENT INVENTORY','硬體配置',`<span class="pd-section-note">${esc(d.os_info?.fetched_at || 'Latest available inventory')}</span>`)}<div class="pd-hardware-layout"><div class="pd-hardware-body p-surface">${cleanSection(hardware,'Hardware inventory')}</div><div class="pd-identity-card p-surface">${cleanSection(basic,'System identity')}</div></div>`;
    const sensorsPanel = `${title('PLATFORM HEALTH','感測與韌體',`<span class="pd-section-note">BMC / BIOS / DEVICE FIRMWARE</span>`)}${b.bmc_alive ? `<div class="pd-sensors-layout"><div class="p-surface pd-sensor-card">${cleanSection(sensors,'Sensor readings')}</div><div class="p-surface pd-firmware-card">${cleanSection(firmware,'Firmware manifest')}</div></div>` : `<div class="pd-unavailable p-surface"><h3>BMC 目前無法連線</h3><p>${esc(b.bmc_ip || '未設定 BMC IP')} · 連線恢復後即可查看感測器與韌體資訊。</p><button class="btn" onclick="machineRefresh()">重新整理</button></div>`}`;
    const tasksPanel = `${title('VALIDATION WORKFLOW','測試任務',`<span class="pd-section-note">TEST LIBRARY → ASSIGN → EXECUTE</span>`)}<div class="pd-task-intro p-surface"><span class="pd-task-number">01 — 03</span><div><span class="pd-eyebrow">PRECISION STARTS WITH A PLAN</span><h3>讓每一次驗證，都有清楚的起點。</h3><p>從測試案例庫選取項目，為 ${esc(name)} 建立指派內容，產生可複製至 OpenHands 的執行指令。</p><button class="pd-primary-btn" onclick="openAssignTask(${quote(name)})">選擇測試與指派 ${glyph('arrow-up-right','↗')}</button></div><div class="pd-task-process"><span><b>01</b>選擇測試類別</span><span><b>02</b>挑選案例與範圍</span><span><b>03</b>產生執行指令</span></div></div><div class="pd-library-heading"><h3>Test library <span>測試案例庫</span></h3><span id="pd-library-total" class="pd-section-note">載入中</span></div><div id="pd-library" class="pd-library-grid"><div class="pd-library-loading">正在取得案例庫…</div></div>`;
    const panels = {overview,hardware:hardwarePanel,sensors:sensorsPanel,telemetry:`${title('SYSTEM PERFORMANCE','效能遙測','<span class="pd-section-note">CPU / DIMM / SSD / NIC / GPU</span>')}<div class="pd-telemetry-body p-surface">${cleanSection(telemetry,'Performance telemetry')}</div>`,tasks:tasksPanel};
    return `<div class="pd-workspace" data-system="${esc(name)}"><div class="pd-breadcrumb"><button onclick="machineBack()">System Manager</button><span>/</span><button onclick="machineBack()">${esc(b.project || '未分類')}</button><span>/</span><strong>${esc(name)}</strong></div><header class="pd-system-header"><div class="pd-system-title"><span class="pd-eyebrow">${level} ${rack ? 'RACK LEVEL' : 'SYSTEM LEVEL'} / SYSTEM WORKSPACE</span><h1>${esc(name)}<span class="pd-level-pill">${level}</span></h1><p>${esc(os.distro || 'System platform')} <span>·</span> ${esc(hw.cpu?.model || b.mgx_type || 'Managed system')}</p></div><div class="pd-header-status">${stateDot(b.os_alive,b.os_alive ? 'System online' : 'System offline')}<div><span>PROJECT</span><b>${esc(b.project || '未分類')}</b></div></div></header><div class="pd-workspace-grid"><div class="pd-main"><nav class="pd-tabs" role="tablist" aria-label="系統工作區">${tabs.map(([key,label,zh]) => `<button id="pd-tab-${key}" role="tab" aria-selected="${selected===key}" aria-controls="pd-panel-${key}" tabindex="${selected===key?'0':'-1'}" class="${selected===key?'is-active':''}" data-pd-tab="${key}" onclick="productDetailTab('${key}')"><span>${label}</span><small>${zh}</small></button>`).join('')}</nav>${tabs.map(([key]) => `<section id="pd-panel-${key}" role="tabpanel" aria-labelledby="pd-tab-${key}" class="pd-tab-panel${selected===key?' is-active':''}"${selected!==key?' hidden':''}>${panels[key]}</section>`).join('')}</div><aside class="pd-operations p-surface"><div class="pd-ops-heading"><span class="pd-eyebrow">COMMAND DECK</span><h2>系統操作</h2><span class="pd-command-line"></span></div><div class="pd-operation-group">${operationButton(findAction('openTermDialog'),'開啟 Terminal','terminal',true)}${b.bmc_ip ? `<button class="pd-operation" onclick="window.openKvmBroadcast && window.openKvmBroadcast(${quote(b.project || '')})">${glyph('monitor','▣')}<span>專案同步 KVM</span><b>↗</b></button>`:''}${operationButton(findAction('openAssignTask'),'指派測試任務','clipboard')}${!m.passive ? `<button class="pd-operation" onclick="productDetailTab('overview'); runDiagnose(${quote(name)})">${glyph('activity','⌁')}<span>系統診斷</span><b>↗</b></button>`:''}</div>${powerActions ? `<div class="pd-power-group"><span class="pd-eyebrow">POWER MANAGEMENT</span>${powerActions.outerHTML}</div>`:''}<div class="pd-ops-context">${kv('PROJECT LEVEL',rack?'L11 / Rack Level':'L10 / System Level')}${kv('COMPONENT',b.mgx_type || 'server')}${rack && b.rack_u ? kv('RACK POSITION',`U${b.rack_u} · ${b.rack_size || 1}U`) : kv('UPTIME',os.uptime)}</div><div class="pd-refresh-action">${operationButton(findAction('machineRefresh'),'重新整理資料','refresh')}</div><div class="pd-ops-foot"><i></i>ENGINEERING WORKSPACE</div></aside></div></div>`;
  };
  window.productDetailTab = function(key, focusTab = false) {
    if (!tabs.some(t => t[0] === key)) return;
    selectedTabs.set(_activeMachine,key);
    document.querySelectorAll('[data-pd-tab]').forEach(button => {
      const active = button.dataset.pdTab === key;
      button.classList.toggle('is-active',active);
      button.setAttribute('aria-selected',String(active));
      button.tabIndex = active ? 0 : -1;
      if (active && focusTab) button.focus();
    });
    document.querySelectorAll('.pd-tab-panel').forEach(panel => {
      const active = panel.id === `pd-panel-${key}`;
      panel.hidden = !active;
      panel.classList.toggle('is-active',active);
    });
    if (key === 'telemetry') requestAnimationFrame(() => {
      Object.values(telCharts).forEach(chart => { try { chart.resize(); chart.update('none'); } catch (_) {} });
    });
    if (key === 'tasks') loadTaskLibrary();
    window.productAfterRender?.();
  };
  async function loadTaskLibrary() {
    const target = document.getElementById('pd-library');
    if (!target || target.dataset.loaded) return;
    target.dataset.loaded = 'pending';
    try {
      taskMetaPromise ||= api('/api/testlibrary/meta');
      const meta = await taskMetaPromise;
      if (!target.isConnected) return;
      const sheets = meta.sheets || [];
      target.innerHTML = sheets.length ? sheets.map((sheet,index) => `<button class="pd-library-card p-surface p-tilt" onclick="productDetailAssignSheet(${quote(sheet.sheet)})"><div><span class="pd-library-icon">${String(index+1).padStart(2,'0')}</span><b>↗</b></div><h4>${esc(sheet.label || sheet.sheet)}</h4><p><strong>${Number(sheet.count)||0}</strong> test cases</p><small>${Number(sheet.auto)||0} 可自動執行 · ${Number(sheet.partial)||0} 部分自動</small></button>`).join('') : '<div class="pd-library-loading">目前沒有可用的測試案例。</div>';
      const total = document.getElementById('pd-library-total');
      if (total) total.textContent = `${sheets.length} CATEGORIES / ${meta.total || sheets.reduce((s,x)=>s+(Number(x.count)||0),0)} CASES`;
      target.dataset.loaded = 'true';
      bindDetailDepth(target);
      window.productAfterRender?.();
    } catch (error) {
      taskMetaPromise = null;
      target.innerHTML = `<div class="pd-library-loading">${esc(error.message)} <button class="btn" onclick="productDetailRetryLibrary()">重試</button></div>`;
      delete target.dataset.loaded;
    }
  }
  window.productDetailRetryLibrary = () => loadTaskLibrary();
  window.productDetailAssignSheet = async sheet => {
    await openAssignTask(_activeMachine);
    if (typeof assignTaskOpenSheet === 'function') assignTaskOpenSheet(sheet);
  };
  function bindDetailDepth(target) {
    target.querySelectorAll('.p-tilt').forEach(surface => {
      if (surface.dataset.pdDepth) return;
      surface.dataset.pdDepth = 'true';
      surface.addEventListener('pointermove', event => {
        if (event.pointerType === 'touch' || matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const box = surface.getBoundingClientRect();
        const x = (event.clientX-box.left)/box.width;
        const y = (event.clientY-box.top)/box.height;
        surface.style.setProperty('--pd-rx',`${((.5-y)*4).toFixed(2)}deg`);
        surface.style.setProperty('--pd-ry',`${((x-.5)*5).toFixed(2)}deg`);
        surface.style.setProperty('--pd-mx',`${(x*100).toFixed(1)}%`);
        surface.style.setProperty('--pd-my',`${(y*100).toFixed(1)}%`);
      });
      surface.addEventListener('pointerleave', () => {
        surface.style.setProperty('--pd-rx','0deg');
        surface.style.setProperty('--pd-ry','0deg');
      });
    });
  }
  window.productDetailAfterRender = function() {
    const workspace = document.querySelector('.pd-workspace');
    if (!workspace || workspace.dataset.bound) return;
    workspace.dataset.bound = 'true';
    bindDetailDepth(workspace);
    workspace.querySelector('.pd-tabs')?.addEventListener('keydown', event => {
      if (!['ArrowLeft','ArrowRight','Home','End'].includes(event.key)) return;
      const index = tabs.findIndex(t => t[0] === event.target.dataset.pdTab);
      if (index < 0) return;
      event.preventDefault();
      const next = event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length-1 : (index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;
      window.productDetailTab(tabs[next][0],true);
    });
    if ((selectedTabs.get(_activeMachine) || 'overview') === 'tasks') loadTaskLibrary();
    if (window.Chart) {
      Chart.defaults.color = '#a3b3c1';
      Chart.defaults.borderColor = 'rgba(154,183,203,.10)';
    }
  };
  document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    if (content) new MutationObserver(() => window.productDetailAfterRender()).observe(content,{childList:true});
    window.productDetailAfterRender();
  });
})();

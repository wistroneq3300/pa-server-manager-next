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
    // Generic closed chassis: an illustration must not imply a GPU or real SKU.
    return `<div class="pd-hardware-stage pd-neutral-chassis"><span class="pd-hardware-horizon"></span><svg viewBox="0 0 440 280" role="img" aria-label="通用機身示意，非本機實際外觀；配置以回報資料為準"><defs><linearGradient id="pd-metal-top" x2=".8" y2="1"><stop stop-color="#82939b"/><stop offset=".42" stop-color="#566974"/><stop offset="1" stop-color="#263e4d"/></linearGradient><linearGradient id="pd-metal-front" x2="0" y2="1"><stop stop-color="#9caeb4"/><stop offset=".1" stop-color="#5b727e"/><stop offset=".54" stop-color="#263e4c"/><stop offset="1" stop-color="#142b3a"/></linearGradient><linearGradient id="pd-metal-side" x2="1" y2="1"><stop stop-color="#49616e"/><stop offset="1" stop-color="#122732"/></linearGradient><pattern id="pd-vent" width="5" height="5" patternUnits="userSpaceOnUse"><circle cx="2" cy="2" r="1" fill="#071b27"/></pattern></defs><ellipse cx="239" cy="232" rx="149" ry="17" fill="#071b27" opacity=".19"/><path d="M49 92 256 54 390 158 170 205Z" fill="url(#pd-metal-top)" stroke="#a5b9c2" stroke-width=".7"/><path d="M49 92 170 205 170 235 49 119Z" fill="url(#pd-metal-side)" stroke="#627e8d" stroke-width=".6"/><path d="M170 205 390 158 390 188 170 235Z" fill="url(#pd-metal-front)" stroke="#8aa5b3" stroke-width=".8"/><path d="M70 96 255 62 374 155M173 195 363 155" fill="none" stroke="#bbccd1" stroke-width=".5" opacity=".5"/><path d="M88 119 271 83M94 125 277 89" stroke="#182f3c" stroke-width=".6" opacity=".5"/><g fill="#bdcbd0"><circle cx="66" cy="96" r="1.6"/><circle cx="255" cy="61" r="1.6"/><circle cx="177" cy="198" r="1.6"/><circle cx="377" cy="157" r="1.6"/><circle cx="130" cy="155" r="1.4"/><circle cx="319" cy="116" r="1.4"/></g><path d="M191 206 279 187 279 207 191 226Z" fill="url(#pd-vent)" stroke="#152b37"/><path d="M285 186 367 168 367 188 285 207Z" fill="url(#pd-vent)" stroke="#152b37"/><g fill="none" stroke="#8299a4" stroke-width="2"><path d="M193 211 269 195M193 218 269 202M287 191 361 175M287 198 361 182"/></g><path d="M172 206 182 204 182 231 172 233ZM375 161 389 158 389 187 375 190Z" fill="#8ca0a9" stroke="#cbdbdf" stroke-width=".6"/><path d="M178 211 178 226M382 165 382 183" stroke="#1b3442" stroke-width="3" stroke-linecap="round"/><circle cx="372" cy="182" r="1.4" fill="#A1CC56"/><path d="M53 113 163 217" stroke="#122633" stroke-width="2"/><path d="M176 237 391 190" stroke="#071b27" stroke-width="2"/></svg><span class="pd-stage-caption">機身示意 · 非本機實際外觀</span></div>`;
  }
  const reportedText = value => typeof value === 'string' ? value.trim() : '';
  const reportedCount = value => value !== '' && value != null && Number.isInteger(Number(value)) && Number(value) >= 0 ? Number(value) : null;
  const quantity = (count, unit) => `${count} ${count === 1 ? unit : unit === 'entry' ? 'entries' : unit + 's'}`;
  function inventorySummary(hw, os) {
    const cpuCount = reportedCount(hw.cpu?.sockets);
    const dimmCount = reportedCount(hw.dimm?.count);
    const list = (key, label, noun, caption) => {
      const items = hw[key];
      if (!Array.isArray(items)) return [label, '尚未取得', `來源未回報 ${label} 清單`];
      return [label, quantity(items.length, noun), items.length ? caption(items) : `本次回報未列出 ${label} 裝置`];
    };
    return [
      ['CPU', cpuCount != null ? quantity(cpuCount, 'socket') : '尚未取得', reportedText(hw.cpu?.model) || '來源未回報 CPU 型號'],
      ['MEMORY', reportedText(os.mem) || (dimmCount != null ? quantity(dimmCount, 'DIMM') : '尚未取得'), [dimmCount != null ? quantity(dimmCount, 'DIMM') : '', ...(Array.isArray(hw.dimm?.types) ? hw.dimm.types : [])].filter(Boolean).join(' · ') || '來源未回報 DIMM 配置'],
      list('ssd', 'STORAGE', 'drive', items => [...new Set(items.map(item => reportedText(item.model)).filter(Boolean))].join(' / ') || '已回報儲存裝置，型號未提供'),
      list('nic', 'NETWORK', 'entry', items => String(items[0] || '').replace(/^[\da-f:.]+\s+/i, '') || '已回報網路裝置'),
      list('gpu', 'GPU', 'GPU', items => [...new Set(items.map(item => reportedText(item.name)).filter(Boolean))].join(' / ') || '已回報 GPU，型號未提供')
    ];
  }
  function systemIdentity(machine, hw) {
    // Never use BMC firmware's Manufacturer as the chassis manufacturer.
    const system = hw.system && typeof hw.system === 'object' ? hw.system : {};
    const manufacturer = reportedText(system.manufacturer) || reportedText(machine.manufacturer);
    const model = reportedText(system.model) || reportedText(system.product_name) || reportedText(machine.model);
    return {model, label:[manufacturer, model].filter(Boolean).join(' · ')};
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
    const b = {...m, ...(d.machine || {})};
    const hw = d.os_info?.hw || {};
    const os = d.os_info?.os || {};
    const identity = systemIdentity(b, hw);
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
    const hardwareSummary = inventorySummary(hw, os);
    const connection = `<div class="pd-connectivity"><div class="pd-connection"><div class="pd-connection-icon">OS</div><div><span>Operating system</span><strong>${esc(b.os_ip || '未設定 OS IP')}</strong><small>${esc(b.os_user || '—')} · SSH ${esc(String(b.os_port || 22))}</small></div>${stateDot(b.os_alive, b.os_alive ? 'Online' : 'Offline')}</div><div class="pd-connection"><div class="pd-connection-icon">BMC</div><div><span>Management controller</span><strong>${esc(b.bmc_ip || '未設定 BMC IP')}</strong><small>${esc(b.bmc_user || '—')} · IPMI</small></div>${stateDot(b.bmc_alive, !b.bmc_ip ? 'Not set' : b.bmc_alive ? 'Online' : 'Offline')}</div></div>`;
    const overview = `<div class="pd-overview-top"><section class="pd-showcase p-surface"><div class="pd-showcase-copy"><span class="pd-eyebrow">${level} / ${rack ? 'RACK COMPONENT' : 'SYSTEM LEVEL'}</span><h2 class="pd-identity-heading" title="${esc(identity.label || '系統配置')}">${esc(identity.model || '系統配置')}</h2><p>${esc(identity.label || hw.cpu?.model || os.distro || '硬體、連線與測試作業')}</p><button class="pd-text-action" onclick="productDetailTab('hardware')">檢視硬體配置 ${glyph('arrow-up-right','↗')}</button></div>${chassis()}<div class="pd-showcase-foot"><span>${esc(b.project || '未分類專案')}</span><span>${esc(rack && b.rack_u ? `U${b.rack_u} · ${b.rack_size || 1}U` : os.distro || 'SYSTEM INVENTORY')}</span></div></section><section class="pd-connect-panel p-surface">${title('CONNECTION HEALTH','連線狀態',stateDot(b.os_alive && (!b.bmc_ip || b.bmc_alive), b.os_alive && (!b.bmc_ip || b.bmc_alive) ? 'Connected' : 'Attention'))}${connection}<div class="pd-connection-foot"><span>Chassis power</span>${b.bmc_alive ? powerBadge(d.power) : '<span class="pd-dim">Unavailable</span>'}</div></section></div><div class="pd-inventory-summary pd-inventory-reported">${hardwareSummary.map(([label,value,caption],i) => `<button class="pd-summary-tile p-surface p-tilt" data-inventory="${label.toLowerCase()}" onclick="productDetailTab('hardware')"><span class="pd-eyebrow">${label}</span><strong>${esc(value)}</strong><small title="${esc(caption)}">${esc(caption)}</small><span class="pd-tile-index">0${i+1} ↗</span></button>`).join('')}</div><p class="pd-inventory-note">${d.os_info?.fetched_at ? `資料時間：${esc(d.os_info.fetched_at)} · ` : ''}依目前回報資料顯示；未回報不代表未安裝。</p>${diagnostic ? `<section class="pd-diagnostic p-surface">${title('SYSTEM DIAGNOSTICS','系統診斷',`<button class="pd-text-action" onclick="runDiagnose(${quote(name)})">執行系統診斷 ${glyph('arrow-up-right','↗')}</button>`)}${cleanSection(diagnostic,'Diagnostic report','pd-diagnostic-content')}</section>` : ''}`;
    const firmwareSummary = `<section class="pd-firmware-summary"><span class="pd-eyebrow">FIRMWARE</span><h3>平台韌體</h3><p>BIOS · ${esc(hw.firmware?.bios?.vendor || '—')} ${esc(hw.firmware?.bios?.version || '')}</p><p>BMC · ${esc((d.fw || []).find(item => item.key === 'Firmware Revision')?.value || '—')}</p><button class="pd-text-action" onclick="productDetailTab('sensors',true)">開啟 Firmware manifest ↗</button></section>`;
    const hardwarePanel = `${title('COMPONENT INVENTORY','硬體配置',`<span class="pd-section-note">${esc(d.os_info?.fetched_at || 'Latest available inventory')}</span>`)}<div class="pd-hardware-layout"><div class="pd-hardware-body p-surface">${cleanSection(hardware,'Hardware inventory')}</div><div class="pd-identity-card p-surface">${cleanSection(basic,'System identity')}${firmwareSummary}</div></div>`;
    const sensorsPanel = `${title('PLATFORM HEALTH','感測與韌體',`<span class="pd-section-note">BMC / BIOS / DEVICE FIRMWARE</span>`)}${b.bmc_alive ? `<div class="pd-sensors-layout"><div class="p-surface pd-sensor-card">${cleanSection(sensors,'Sensor readings')}</div><div class="p-surface pd-firmware-card">${cleanSection(firmware,'Firmware manifest')}</div></div>` : `<div class="pd-unavailable p-surface"><h3>BMC 目前無法連線</h3><p>${esc(b.bmc_ip || '未設定 BMC IP')} · 連線恢復後即可查看感測器與韌體資訊。</p><button class="btn" onclick="machineRefresh()">重新整理</button></div>`}`;
    const tasksPanel = `${title('VALIDATION WORKFLOW','測試任務',`<span class="pd-section-note">TEST LIBRARY → ASSIGN → EXECUTE</span>`)}<div class="pd-task-intro p-surface"><span class="pd-task-number">01 — 03</span><div><span class="pd-eyebrow">TARGET / ${esc(name)}</span><h3>選擇案例，產生測試指令。</h3><p>為 ${esc(name)} 挑選測試項目，建立可複製至 OpenHands 的執行指令。</p><button class="pd-primary-btn" onclick="openAssignTask(${quote(name)})">選擇測試與指派 ${glyph('arrow-up-right','↗')}</button></div><div class="pd-task-process"><span><b>01</b>選擇測試類別</span><span><b>02</b>挑選案例與範圍</span><span><b>03</b>產生執行指令</span></div></div><div class="pd-library-heading"><h3>Test library <span>測試案例庫</span></h3><span id="pd-library-total" class="pd-section-note" aria-live="polite">載入中</span></div><div id="pd-library" class="pd-library-grid"><div class="pd-library-loading" role="status">正在取得案例庫…</div></div>`;
    const panels = {overview,hardware:hardwarePanel,sensors:sensorsPanel,telemetry:`${title('SYSTEM PERFORMANCE','效能遙測','<span class="pd-section-note">CPU / DIMM / SSD / NIC / GPU</span>')}<div class="pd-telemetry-body p-surface">${cleanSection(telemetry,'Performance telemetry')}</div>`,tasks:tasksPanel};
    return `<div class="pd-workspace" data-system="${esc(name)}"><div class="pd-breadcrumb"><button onclick="machineBack()">System Manager</button><span>/</span><button onclick="machineBack()">${esc(b.project || '未分類')}</button><span>/</span><strong>${esc(name)}</strong></div><header class="pd-system-header"><div class="pd-system-title"><span class="pd-eyebrow">${level} ${rack ? 'RACK LEVEL' : 'SYSTEM LEVEL'} / SYSTEM WORKSPACE</span><h1>${esc(name)}<span class="pd-level-pill">${level}</span></h1><p>${esc(identity.label || os.distro || 'System platform')} <span>·</span> ${esc(hw.cpu?.model || b.mgx_type || 'Managed system')}</p></div><div class="pd-header-status">${stateDot(b.os_alive,b.os_alive ? 'System online' : 'System offline')}<div><span>PROJECT</span><b>${esc(b.project || '未分類')}</b></div></div></header><div class="pd-workspace-grid"><div class="pd-main"><nav class="pd-tabs" role="tablist" aria-label="系統工作區">${tabs.map(([key,label,zh]) => `<button id="pd-tab-${key}" role="tab" aria-selected="${selected===key}" aria-controls="pd-panel-${key}" tabindex="${selected===key?'0':'-1'}" class="${selected===key?'is-active':''}" data-pd-tab="${key}" onclick="productDetailTab('${key}')"><span>${label}</span><small>${zh}</small></button>`).join('')}</nav>${tabs.map(([key]) => `<section id="pd-panel-${key}" role="tabpanel" aria-labelledby="pd-tab-${key}" class="pd-tab-panel${selected===key?' is-active':''}"${selected!==key?' hidden':''}>${panels[key]}</section>`).join('')}</div><aside class="pd-operations p-surface"><div class="pd-ops-heading"><span class="pd-eyebrow">COMMAND DECK</span><h2>系統操作</h2><span class="pd-command-line"></span></div><div class="pd-operation-group">${operationButton(findAction('openTermDialog'),'開啟 Terminal','terminal',true)}${b.bmc_ip ? `<button class="pd-operation" onclick="window.openKvmBroadcast && window.openKvmBroadcast(${quote(b.project || '')})">${glyph('monitor','▣')}<span>專案同步 KVM</span><b>↗</b></button>`:''}${operationButton(findAction('openAssignTask'),'指派測試任務','clipboard')}${!m.passive ? `<button class="pd-operation" onclick="productDetailTab('overview'); runDiagnose(${quote(name)})">${glyph('activity','⌁')}<span>系統診斷</span><b>↗</b></button>`:''}</div>${powerActions ? `<div class="pd-power-group"><span class="pd-eyebrow">POWER MANAGEMENT</span>${powerActions.outerHTML}</div>`:''}<div class="pd-ops-context">${kv('PROJECT LEVEL',rack?'L11 / Rack Level':'L10 / System Level')}${kv('COMPONENT',b.mgx_type || 'server')}${rack && b.rack_u ? kv('RACK POSITION',`U${b.rack_u} · ${b.rack_size || 1}U`) : kv('UPTIME',os.uptime)}</div><div class="pd-refresh-action">${operationButton(findAction('machineRefresh'),'重新整理資料','refresh')}</div><div class="pd-ops-foot"><i></i>ENGINEERING WORKSPACE</div></aside></div></div>`;
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
    window.cinematicWorkspaceAfterRender?.();
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
  };
  document.addEventListener('DOMContentLoaded', () => {
    const content = document.getElementById('content');
    if (content) new MutationObserver(() => window.productDetailAfterRender()).observe(content,{childList:true});
    window.productDetailAfterRender();
  });
})();

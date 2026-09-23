# Next UI / rack handoff - 2026-09-23

## Repository and integration

Work is on `pa-server-manager-next`, branch `astra-cinematic-ui` ONLY. Do not push to the original repository or overwrite main. The operator explicitly requested preservation of their new functionality.

The remote main history was replaced with an independent full-application history. Saved local pending work in `0712032`, then merged `origin/main` (through `93bcc09`) with both histories retained, resolving overlapping existing files in favor of upstream. Before UI additions, all upstream static files were byte-identical to origin/main. Backend, app.js, product-detail.js, kvm_broadcast.js, multi-OS handlers and terminal bridge remain unchanged from that upstream revision. No force-push.

## Implemented

- `rack-equipment-scene.js`: dependency-free, on-demand WebGL rack from actual name/type/top-U/height. Champagne compute/switch faces and front rails; graphite frame; distinct Server, Switch, CDU, PDU, Power Shelf, Storage, Network and blanking geometry. Drag/keyboard orbit, front/rear/perspective, zoom/reset, ray selection, selected-part offset, resize, resource cleanup and fallback.
- `equipment-workspace.js`: operational 3D / existing planar placement views, component selector and inspector, type-correct detail illustrations. Original list, topology, telemetry, placement dialogs and command handlers remain available. Empty explicitly typed L11 projects open an empty rack.
- `hardware-visuals.js`: original SVG component illustrations. No proprietary CAD or product photos copied. Model appearance is illustrative, not an installed-SKU or port-count assertion.
- `workspace-reliability.js`: data-backed collapsed search, visible empty typed projects, no automatic guessed U writes during load, invalid/overlapping placement exclusion, chart lifecycle and stale-response checks.
- Hardware presentation: grouped inventory, readable network badges, all reported SSD entries (not first 12 only). Sensor AI has its own labeled surface separate from SDR readings/counts.
- KVM: theme-aware shell, controls, cards and disconnected-state labels. Actual upstream module retained; framebuffer pixels remain unmodified.
- `serve.py` injects fixture script ONLY into its loopback preview response. `static/index.html` does not load fixtures in production. Production entry retains KVM ES module and backend connections. No backend service restarted.

## Run / verification

Local fixture preview: `python serve.py --port 8769`, then `http://127.0.0.1:8769/`.

- `node qa/acceptance.cjs`: 23/23 groups passed, including 13 Telemetry canvases, six categories/3112 cases, placement move/unmount/remount/create, list/telemetry/topology, terminal, KVM shell, empty/loading/error, reload/deep links, three widths and reduced motion. Zero page errors, console errors or external HTTP requests in that suite.
- `node qa/equipment-workspace.cjs`: passed actual WebGL geometry (13 components/44 occupied U), camera controls, type-correct switch/CDU/PDU details, three desktop widths x two themes, 50 L10 systems/three racks, collapsed search, empty L11, hardware/sensor sections.
- KVM validation uses actual module with isolated RFB stub/disconnected fixtures, NOT real equipment. No claim of live video or keyboard broadcast end-to-end acceptance.
- Screenshots/results: `qa/artifacts/acceptance.*`, `equipment-workspace.json`, `equipment-rack-*.png`, `equipment-hardware.png`, `equipment-sensors.png`, `kvm-*.png`.

## Honest limits / follow-up

- Engineering illustrations, not manufacturer CAD or a photorealistic exact NVL72 replica. Gold material direction follows operator request; saved equipment layout always takes priority over a reference rack's population.
- No physical 0U side-mount or external-CDU schema added. One L11 project still maps to one 48U view.
- Placement editing uses existing validated selection dialogs, not a new drag/drop ghost-placement feature. No fabricated network/cooling/power topology.
- No live FastAPI, BMC, SSH or multi-OS backend E2E was performed; upstream implementations retained. Long-duration slow-network telemetry soak and low-end GPU profiling are still required before production sign-off.
- Upstream unmount resets height to 1U; remount allows choosing height. Preserved, not silently changed. Consider retaining physical height in a separately approved workflow fix.
- Unknown/offline semantics and overall copy/icon consistency still need an application-wide pass; see `docs/UI-UX-REVIEW-20260923.md`.

## Visual references (reference only; no redistributed vendor assets)

- HPE GB300 NVL72 QuickSpecs: https://www.hpe.com/us/en/collaterals/collateral.a50009244enw.html
- NVIDIA SN2000 family: https://networking-docs.nvidia.com/sn2000hw/latest/introduction
- Vertiv rack CDU: https://go.vertiv.com/CoolChip-CDU-100
- Eaton horizontal rack PDU: https://www.eaton.com/us/en-us/skuPage.EHMAL620N.html

No runtime dependency was added. Existing Wistron logo colors remain brand anchors, not a full official CI claim.

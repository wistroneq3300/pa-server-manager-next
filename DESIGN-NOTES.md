# PA Server Manager Next — cinematic engineering workspace

## 2026-09-24 operational rack and equipment identity update

This section supersedes the historical fixture-only scope below. The branch includes
the user's current FastAPI application; only `serve.py` injects isolated sample data.
The production `static/index.html` does not load fixtures. The original repository
and Next `main` are not modified by this feature branch.

- Operational rack: original native-WebGL, data-driven enclosures using saved top-U
  and height. The model, plane editor and component list share the same records.
- Material rule (latest user revision): champagne compute and NVLink tray fronts;
  silver tray bodies/rears, graphite management switches and power modules,
  neutral silver CDU, dark blanking and PDU enclosures.
- Each device owns its fixed-pitch service details. Increasing height adds chassis
  panels/vent bands rather than stretching connectors or creating fake inventory.
- GB300-inspired compute faces, NVLink closed service panels, six-module power
  shelves, rails, fasteners, rear connectors and liquid fittings are authored geometry.
  This is not NVIDIA CAD, certified manufacturing geometry or a real-product SKU claim.
- The requested sample rack is custom: 4U + 3U + 2U compute examples above 9 NVLink
  trays and 9 one-U servers; top/bottom power sections, 5U blank and bottom 4U CDU.
  It has 35 components occupying 48U, not an assertion of an official NVL72 population.
- `NVLink Switch Tray` is a separate `nvlink` kind. Existing API fields are unchanged;
  backend allowlists/classification accept the additive type. No real NVLink metrics
  are invented: its collector/metric definitions remain explicitly unimplemented.
- Orbit, front/rear views, selected-component inspection, expanded viewport, keyboard
  control and the original 48U edit workflow coexist. There is no continuous idle
  render loop, and WebGL failure leaves the plane editor available.
- All nine static detail illustrations use the same device vocabulary and correct
  non-stretched U heights. Their connector arrangements remain reference-inspired
  illustrations; reported inventory remains the authority for installed hardware.

References consulted (reference images are not redistributed):

- [NVIDIA DGX GB rack hardware](https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html)
  including GB300 compute front, NVLink tray and power shelf figures.
- [NVIDIA SN2000 hardware](https://networking-docs.nvidia.com/sn2000hw/latest/introduction)
  for SN2700-style Ethernet connector organization.
- [Vertiv CoolChip CDU 100](https://go.vertiv.com/CoolChip-CDU-100) for a generic in-rack
  CDU silhouette; [Eaton horizontal rack PDU](https://www.eaton.com/us/en-us/skuPage.EHMAL620N.html)
  for the outlet form factor.

No new frontend/runtime dependencies, downloaded models or external texture services.
Desktop/fixture checks live in `qa/gb300-rack.cjs`, `qa/equipment-workspace.cjs` and
`qa/acceptance.cjs`. They do not validate real BMC/SSH connectivity.

## Scope and branch

- Repository: `wistroneq3300/pa-server-manager-next` only.
- Working branch: `astra-cinematic-ui`, based on preview baseline `ce3cb5480a4ac8fc3f58e156348baad0c9bc8d06`.
- Original frontend provenance: `pa-server-manager`, commit `499f561`.
- Independent, fixture-backed desktop UI preview; no production FastAPI service or live hardware is connected.
- The original repository and the new repository's `main` remain untouched. The user authorized publishing this redesign to its new branch.

## Design decisions

### One continuous engineering subject

Reference: [website demonstration around 5:31–8:10](https://www.youtube.com/watch?v=UWdn0w-fbzQ&t=331s). Actual frames at approximately 5:49, 6:26 and 7:13 show the main subject on the right, the same subject repositioned left, and a modal using the same material vocabulary. Only these design methods are borrowed; no video assets, source code or gold palette are copied.

The System Core is original procedural geometry informed by NVIDIA's public Vera Rubin Compute Tray and NVL72 rack references. L10 shows a slim closed silver chassis with a champagne-colored front, handles, modular bays, fasteners, side rails and rear connectors. It has modelled front/back/side/top/bottom surfaces, not a tilted photograph. The same primary tray moves into an authored rack containing 18 compute trays, 9 switch trays, illustrative power shelves, rails, rear spines and manifolds. One canvas changes position, scale, view angle and assembly state while text moves to the opposite side. Scrolling upward reverses the same progress value.

Dragging provides continuous horizontal rotation and vertical inspection; released angles remain still. Arrow keys also rotate, Home or the reset control restores the authored composition, and a rear-view control reveals the back. Resuming scroll blends the manual offset back over 460 ms instead of snapping. Tall-rack composition reserves a footer for the model identity and controls. The stage uses `overflow:clip` to prevent keyboard focus from internally scrolling its oversized canvas.

This is a conceptual hardware study, not official NVIDIA CAD, a dimensionally certified 1U design, a specific Wistron SKU, a live twin or the fixture rack's exact configuration. Hidden structure and fittings are illustrative. Precise 48U placement is displayed separately in the operational Rack workspace.

The narrative is optional for daily use: navigation, System/Rack entries and “跳到專案” are immediately available. There is no wheel interception, scroll hijacking, animation gate or splash screen.

### Product language

- Graphite black and navy structure, machined-metal edges and restrained highlights.
- Logo blue/green anchors; cool blue controls and limited lime emphasis.
- Larger type and a single hardware focus on the Dashboard; compact scanning and stable tables in workspaces.
- Consistent identity and Operations rail across all five system tabs.
- Metal rails, front-panel texture and soft hover focus in the rack, without transforming its selectable coordinate grid.
- Unified Dialog, Terminal, KVM, case-library, loading, error and empty surfaces.
- The original theme control now switches between genuine Pearl Light and Graphite Dark. Light uses pearl-white and silver-gray material layers, dark blue text and restrained Wistron blue/green; Dark retains graphite/navy. Terminal screens, KVM and the physical rack stay dark within the Light shell for material and task contrast. No full official Wistron CI specification is implied.
- Chart text, legends, axes and grids update immediately with the theme without replacing datasets, callbacks or chart instances. The existing `pa_theme` preference persists.
- System detail uses reported chassis manufacturer/model and inventory rather than a fixed “GPU 加速系統” identity. Missing GPU inventory means “尚未取得”; an explicit empty array means “本次回報未列出 GPU 裝置.” BMC/BIOS vendor names do not become chassis brands. The neutral chassis illustration is explicitly a schematic.

## Product coverage

| Area | Preserved workflows |
| --- | --- |
| Dashboard | L10/L11 project entries, counts, OS and project health, Copilot and project management |
| L10 workspace | Search, project management, add/scan/broadcast, collapse/expand, project/system ordering, OS/BMC IP and status, power, move, Terminal, KVM, settings and deletion |
| System detail | Overview, Hardware, Sensors & firmware, Telemetry and Test tasks; original inventory, diagnosis and operations |
| L11 workspace | 48U numbering, multi-U placement, component types, mount/unmount/move, list, topology, telemetry, Copilot and rack actions |
| Shared tools | Guide, theme, project KVM, Terminal/Broadcast, confirmations and test-library workflow |

L10 and L11 are management levels, not sites or floors. No project-progress, kanban or scheduling model is introduced. Inherited unfinished features stay explicitly unfinished.

## Implementation

No frontend framework change or new application dependency is introduced.

| File | Responsibility |
| --- | --- |
| `static/js/app.js` | Unchanged original routes, state, API contracts and operations |
| `product.js` / `product.css` | Existing preview adapters and project/rack composition |
| `product-detail.js` / `product-detail.css` | Five-tab detail workspace, identity and firmware navigation |
| `core-scene.js` | Native WebGL geometry, shaders and lifecycle |
| `cinematic.js` / `cinematic.css` | Dashboard narrative, shell, L10/Rack surfaces, search persistence and rack power-state refresh |
| `workspace-cinematic.js` / `.css` | Detail/Dialog consistency, keyboard/focus behavior and search caret preservation |
| `wistron-light.css` | Light-only material, text, table, modal and visualization overrides, loaded after legacy layers |
| `preview-fixtures.js` | In-memory endpoint-compatible simulations |
| `qa/acceptance.cjs` | Reproducible desktop acceptance, not a shipped runtime dependency |

Original `app.js` SHA256:

```text
05A5E7916C0C104CA536AF85FB324E58EF9288ABB1B81A72D93799798FFA9F3C
```

Adapters preserve endpoint paths and payloads. Targeted behavior fixes outside `app.js` preserve the caret when test search recreates its dialog, refresh displayed machine state after rack power operations, and prevent search from matching hidden move-project dropdown options.

### WebGL and motion

- Original shaders/meshes; no CDN, external textures, downloaded model or runtime network dependency.
- Seven geometry buffers uploaded once; matrices/opacity change per frame rather than rebuilding vertices. Analytic studio lighting supplies metal highlights without HDR/image downloads.
- Event-driven rendering with no perpetual idle animation loop.
- ResizeObserver, device pixel ratio capped at 1.7, maximum drawing-buffer side capped at 4096 or GPU limit.
- Route teardown releases buffers, shaders/program, RAF, observers and listeners.
- Context loss displays the concept-image fallback; restoration rebuilds resources.
- Unavailable WebGL or detected low-resource devices use the static image. Management remains available.
- Reduced motion disables automatic scroll choreography and settling animations, removes sticky narrative spacing and shows both level entry points. Explicit drag/keyboard rotation remains available.
- Telemetry tab selection resizes the original Chart.js instances.

### Fixtures

Fixture corrections cover add-system response shape, project counts/rename/order, machine order, passive rack components, occupied-U validation, diagnosis report and power-status fields. CPU/DIMM/GPU summary values match detailed and telemetry data. Broadcast emulates the ready/output protocol asynchronously.

Changes are in-memory and reset on refresh. IPs use documentation ranges; credentials are preview-only strings.

## Brand and assets

- [Wistron official website](https://www.wistron.com/en).
- [Official website SVG](https://www.wistron.com/_next/static/media/logo.8b542402.svg) already included as `static/img/wistron-official.svg`.
- Mark colors `#006C93` and `#A1CC56` are digital asset colors, not a complete official CI/Pantone specification.
- Trademark ownership remains with Wistron; inclusion supports this internal Wistron-oriented concept and does not imply endorsement or a general logo redistribution license.
- `server-hero.png` is existing AI-generated concept artwork, not a real product photo. See [prompt/provenance](static/img/server-hero-prompt.md).
- The new procedural scene was authored for this repository. No reference-video content is redistributed.
- Hardware research: [NVIDIA Vera Rubin technical overview](https://developer.nvidia.com/blog/?p=111036), its [Compute Tray reference, Figure 18](https://developer-blogs.nvidia.com/wp-content/uploads/2026/01/Figure-18.png), and the [Vera Rubin Pod architecture article](https://developer.nvidia.com/blog/nvidia-vera-rubin-pod-seven-chips-five-rack-scale-systems-one-ai-supercomputer/). Public illustrations informed geometry only; reference photos are not included as new application assets.
- NVIDIA does publish detailed [DSX SimReady assets](https://docs.omniverse.nvidia.com/dsx/latest/simready-assets.html), including the [GB300 DSX dataset](https://catalog.ngc.nvidia.com/orgs/nvidia/omniverse/resources/dsx_dataset/-). That evaluation dataset was not downloaded, embedded or redistributed. Availability is not treated as a general web redistribution license.

## Validation

With the preview server running, execute:

```powershell
node qa/acceptance.cjs
```

The runner uses Playwright and locally installed Chrome only for development testing. Set `PLAYWRIGHT_MODULE` and `CHROME_PATH` for another environment.

Exact results and screenshots are in [qa/artifacts/acceptance.md](qa/artifacts/acceptance.md) and [acceptance.json](qa/artifacts/acceptance.json). Checks cover desktop widths 1440/1600/1920, all views, CRUD and ordering, 13 telemetry canvases, 6 categories / 3,112 cases, 48U placement, Terminal/KVM/Broadcast, state recovery, deep links, motion, console and outbound requests.

The 2026-09-21 appearance update also adds portable checks:

- `qa/hardware-identity.cjs --unit`: populated/empty/missing/null/malformed inventory and chassis metadata fallbacks.
- `qa/theme-contract.cjs`: Light-only CSS scope/order, representative text contrast pairs and the actual theme adapter in a VM. This is not a full WCAG audit.
- `qa/theme-palette.cjs`: actual bundled Chart.js with a no-op canvas; immediate Light → Dark → Light resolved option changes, preserving datasets and callbacks.
- `qa/story-adapter.cjs`: reversible progress, reduced motion, fallback controls, repeated-mount idempotence and listener/RAF teardown in a VM.
- `qa/core-scene.cjs`: mocked WebGL lifecycle/geometry/orbit checks; not a substitute for GPU pixel verification.

`qa/appearance-interaction.cjs` provides additional browser/pixel regression cases. Its separate Chrome launch was blocked by the execution environment, as was the full browser mode of the hardware-identity test. These suites are supplied for future reruns, **not reported as passed**. The existing approved `qa/acceptance.cjs` browser run succeeded (23/23), supplemented by direct desktop-browser checks of Light/Dark, model drag/rear/reset, all five detail tabs, the 13 visible telemetry canvases, test library and rack views. See [the appearance verification record](qa/artifacts/appearance-manual.md) for the exact scope.

This is fixture UI acceptance, not production hardware validation.

## Known limitations

1. Terminal/SSH, KVM, power, scan and AI are simulations.
2. Topology creation remains pending; existing topology visualization works.
3. Original rack-wide Reboot/AUX select devices but report unfinished command wiring. They do not pretend to execute.
4. KVM sync controls demonstrate local state without sending input to a BMC.
5. The server is a loopback development preview, not production hosting.
6. Desktop is the target; smaller windows may need contained table scrolling.
7. Production integration still requires removing fixture interception, configuring the KVM broker, reconnecting existing FastAPI/WebSocket services and authorized live-backend regression tests.

## Run

```powershell
python serve.py --port 8769
```

Open `http://127.0.0.1:8769/`. Hash routes support direct entry and reload.

Optional scenarios: `?preview=empty`, `?preview=loading`, `?preview=error` (first detail request fails; retry succeeds).

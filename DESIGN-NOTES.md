# PA Server Manager Next — cinematic engineering workspace

## Scope and branch

- Repository: `wistroneq3300/pa-server-manager-next` only.
- Working branch: `astra-cinematic-ui`, based on preview baseline `ce3cb5480a4ac8fc3f58e156348baad0c9bc8d06`.
- Original frontend provenance: `pa-server-manager`, commit `499f561`.
- Independent, fixture-backed desktop UI preview; no production FastAPI service or live hardware is connected.
- The original repository and the new repository's `main` remain untouched. The user authorized publishing this redesign to its new branch.

## Design decisions

### One continuous engineering subject

Reference: [website demonstration around 5:31–8:10](https://www.youtube.com/watch?v=UWdn0w-fbzQ&t=331s). Actual frames at approximately 5:49, 6:26 and 7:13 show the main subject on the right, the same subject repositioned left, and a modal using the same material vocabulary. Only these design methods are borrowed; no video assets, source code or gold palette are copied.

The new System Core is original procedural geometry. A GPU server's lid, cooling banks, fans, drive caddies and chassis form the L10 composition. Scrolling closes the chassis and assembles related modules and rails into a rack. One canvas changes position, scale, view angle and assembly state while text moves to the opposite side. Scrolling upward reverses the same progress value.

This is a conceptual hardware study, not a specific Wistron SKU, a live twin or the fixture rack's exact configuration. Precise 48U placement is displayed in the operational Rack workspace.

The narrative is optional for daily use: navigation, System/Rack entries and “跳到專案” are immediately available. There is no wheel interception, scroll hijacking, animation gate or splash screen.

### Product language

- Graphite black and navy structure, machined-metal edges and restrained highlights.
- Logo blue/green anchors; cool blue controls and limited lime emphasis.
- Larger type and a single hardware focus on the Dashboard; compact scanning and stable tables in workspaces.
- Consistent identity and Operations rail across all five system tabs.
- Metal rails, front-panel texture and soft hover focus in the rack, without transforming its selectable coordinate grid.
- Unified Dialog, Terminal, KVM, case-library, loading, error and empty surfaces.
- Graphite / Steel modes retain the original theme control; Steel is a lighter dark scheme.

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
| `preview-fixtures.js` | In-memory endpoint-compatible simulations |
| `qa/acceptance.cjs` | Reproducible desktop acceptance, not a shipped runtime dependency |

Original `app.js` SHA256:

```text
05A5E7916C0C104CA536AF85FB324E58EF9288ABB1B81A72D93799798FFA9F3C
```

Adapters preserve endpoint paths and payloads. Targeted behavior fixes outside `app.js` preserve the caret when test search recreates its dialog, refresh displayed machine state after rack power operations, and prevent search from matching hidden move-project dropdown options.

### WebGL and motion

- Original shaders/meshes; no CDN, external textures, downloaded model or runtime network dependency.
- Six geometry buffers uploaded once; matrices/opacity change per frame rather than rebuilding vertices.
- Event-driven rendering with no perpetual idle animation loop.
- ResizeObserver, device pixel ratio capped at 1.7, maximum drawing-buffer side capped at 4096 or GPU limit.
- Route teardown releases buffers, shaders/program, RAF, observers and listeners.
- Context loss displays the concept-image fallback; restoration rebuilds resources.
- Unavailable WebGL or detected low-resource devices use the static image. Management remains available.
- Reduced motion disables scroll/pointer movement, removes sticky narrative spacing and shows both level entry points.
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

## Validation

With the preview server running, execute:

```powershell
node qa/acceptance.cjs
```

The runner uses Playwright and locally installed Chrome only for development testing. Set `PLAYWRIGHT_MODULE` and `CHROME_PATH` for another environment.

Exact results and screenshots are in [qa/artifacts/acceptance.md](qa/artifacts/acceptance.md) and [acceptance.json](qa/artifacts/acceptance.json). Checks cover desktop widths 1440/1600/1920, all views, CRUD and ordering, 13 telemetry canvases, 6 categories / 3,112 cases, 48U placement, Terminal/KVM/Broadcast, state recovery, deep links, motion, console and outbound requests.

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

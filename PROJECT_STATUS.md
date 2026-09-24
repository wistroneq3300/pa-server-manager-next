# PA Server Manager Next - Current Status

Updated: 2026-09-24. PROJECT_STATUS.md is the single maintained continuation record.

## Repository and delivery

- Current authorized work: Rack topology IP policy, Power Shelf/CDU cabling and
  device-mounted Ping LED refinements (latest section below).
- Starting main for this work was `a62889ceeddfa9bed189069c209e54116b6897c6`.
- Functional commit `d40dea953e30507cd03d701330b9a82c17aacf30` was pushed to
  `main` and verified against `git ls-remote` on 2026-09-24. Follow-up LED geometry
  fix `ca559d27923e752947ac06786f1c0ca95241da04` is also published and remotely
  verified; this documentation follow-up records the completed delivery.
- No deployment or live hardware test was performed. The tracked Naboo production-data
  topology changed from 65 to 69 confirmed links; inventory and credentials are unchanged.
- Repository: https://github.com/wistroneq3300/pa-server-manager-next
- Known checkout: C:/Users/kobei/Documents/Codex/2026-09-24/pa-server-manager-next-https-github
  Prefer the current verified checkout if this project moves or runs on another host.
- Prior verified functional commit: `132a8965a42d60a989918d2c46962171d8a184f1` on main.
- Current workspace UX / rack-height functional commit: `30508c7fb01fb7c341817c1d3f5c74f3324257e7`.
- Pushed to main and verified against git ls-remote on 2026-09-24.
- Prior changes were pushed and verified on 2026-09-24.
- User authorized the current workspace UX / rack-height implementation and push.
- No deployment or production service restart was performed. Pushed does not mean live.
- Instruction/skill consolidation was published as `4e29682`.

## Rack topology/IP/LED refinement (2026-09-24; current)

- The user authorized implementation and publication. Functional commits
  `d40dea953e30507cd03d701330b9a82c17aacf30` and
  `ca559d27923e752947ac06786f1c0ca95241da04` are published and remotely verified.
  No deployment or live hardware Ping was performed.
- `網路拓樸` is now the single Rack wiring workspace. The old separate empty `機櫃拓樸`
  Rack UI was removed so saved wiring and IP checks no longer appear split between two views.
- Inventory import defaults to per-server OS Slot inference from the machine `os` array.
  Each valid slot creates one editable node and copies its `ip` / `bmc_ip` into Host OS /
  Host BMC annotations. Mixed selections can produce different node counts. Machines without
  valid OS Slots use the editable manual 1-64 node fallback; non-servers are never inferred.
- Both `網路拓樸 → 檢查 IP` and Rack Ping check Server Host OS only, in this order:
  saved topology Host OS nodes, inventory OS Slots for any missing nodes, legacy primary
  OS IP. Other devices check one primary management IP. BMC/DPU annotations do not create
  hidden Server probes.
- The topology check has truthful unchecked/no-IP/all-success states and a compact failure
  list containing device, server node when applicable, and failed IP. Rack Ping adds the
  same useful failure detail in a panel above the Rack content without covering the 3D view.
- Naboo now has 69 confirmed physical links: 32 Host cables to Switch-2201-1 ports 1-32,
  32 DPU cables to Switch-2201-2 ports 1-32, three Power Shelf cables to Switch-2201-1
  ports 33-35, the CDU cable to port 36, and the switch interconnect on both port 48s.
  New validated `power` and `cooling` topology roles preserve those distinct cable purposes.
- Rack 3D uses cyan Host/left, purple DPU/right, orange Power/left, teal Cooling/left and
  gold uplink/right routing. It renders cable ducts only when at least one saved connection
  is drawable. Switch endpoints remain grouped at the sides; exact physical socket CAD is
  intentionally deferred.
- Ping LEDs are attached to the right side of each applicable equipment face rather than
  the Rack rail, including internal/external CDU. Green blinks when all checked targets are
  reachable, red blinks on any failed target, gray means unchecked/no target, and passive
  blanking panels have no LED. Reduced-motion keeps the color steady.
- Follow-up geometry puts both Switch Ping LEDs on raised upper-right service pods, clear
  of the QSFP matrices and cable endpoints. All three installed Power Shelves use larger
  raised right-side pods between the last fan cartridge and chassis edge, so red, green and
  low-brightness gray states remain visible. Blank Panel rendering and data are unchanged.
- Validation passed: 81 isolated Python regressions; topology browser and targeted IP
  summary QA; rack-network browser QA with 69 routes, geometric overlap guards and 1,310
  visibly changing LED pixels; operations/equipment/core-scene checks; JavaScript/Python
  syntax and whitespace validation. Success, partial-failure and Rack-layout screenshots
  were visually reviewed. No external browser requests or live hardware probes occurred.

## Saved network cables and Rack Ping LEDs (2026-09-24; prior baseline, superseded above)

- User authorized the previously deferred 3D cable routing and Ping LEDs, then push to main.
- Rack 3D reads the current project's saved topology and matches inventory-backed devices
  to installed equipment. Host management uses the left cable duct; DPU management and
  switch interconnect use the right. Short branches meet equipment/switch side groups;
  precise physical port sockets are intentionally deferred. Show/hide wiring is available.
- Naboo's 32 servers retain four logical Host/BF4 nodes per tray and two shared RJ45 cables:
  32 Host + 32 DPU + one switch interconnect = 65 physical cables. No CDU/power-shelf cables
  are invented; those appear when the user configures and saves their actual connections.
- Every powered equipment type has one status LED on the front right, including the
  external CDU. Blanking panels have no LED. Reachable is blinking green; any failed
  configured target, including partial node failure, is blinking red; unchecked/no IP is gray.
- Rack Ping uses all configured topology Host OS node IPs for servers, falling back to the
  inventory OS IP only when no topology Host OS IP is configured. Other equipment uses
  its management OS IP, or BMC IP when OS IP is absent. A responsive server BMC cannot
  mask a failed OS. These indicators show ICMP reachability, not measured power state.
- Probes de-duplicate IPs, retry failures once, and use at most 64 workers, 2048 unique IPs
  and 4096 mapped node fields. Blank panels, L10 and unplaced devices are not probed.
  Results include source, timestamp and per-node counts without changing saved inventory.
- Saving topology immediately refreshes 3D routing and clears old Ping results. Project
  changes and newer saves invalidate delayed topology/Ping responses. Reduced-motion,
  offscreen/rear view, disposal and WebGL recovery preserve animation lifecycle behavior.
- Validation: 75 isolated Python regressions passed, including 515 unique IPs and null
  legacy topology. Operations/equipment regressions, topology-browser, core-scene 11/11,
  and CDU visuals passed. New rack-network-led browser QA passed nine groups, including
  real pixel blinking, active-Ping/save races, light/dark, desktop/390/320px and context loss.
  No browser errors or external network calls. Screenshots were visually reviewed.
- Evidence: `qa/artifacts/rack-network-led/`; guide: `docs/NETWORK_TOPOLOGY.md`.
- Still deferred: exact switch port socket geometry, user-defined CDU/power-shelf cabling,
  live hardware verification and deployment. No production data changed in this work.

## Earlier KVM solo presentation (2026-09-24; superseded by lifecycle work below)

- Applied to the original Next checkout; user authorized commit/push for this work.
- Single-device KVM popup now shares equipment workspace surfaces, colors, connection
  badge and responsive layout. It inherits and synchronizes the opener's light/dark theme.
- Existing noVNC transport, reconnect and input behavior are unchanged; title shows hostname.
- Browser fixture passed: actual detail popup, dark/light synchronization, connect/disconnect
  UI, dark framebuffer, and 320px long-hostname layout. Zero browser errors or WebSockets.
- Desktop and mobile screenshots visually reviewed; evidence: qa/artifacts/kvm-solo-*.png.
- Inline JavaScript syntax and git diff whitespace checks passed.
- Earlier theme-contract check has an existing CSS-order failure at line 178, reproduced
  against the unchanged baseline; unrelated to this KVM presentation change.
- Publication: included in this user-authorized commit/push; verify HEAD against origin/main.
  No deployment, live backend or hardware connection was performed.

## Workspace UX and rack height (2026-09-24)

- User authorized all UI/UX review improvements, explicit L10 -> L11 height selection,
  existing L11 height correction, a before/after comparison and commit/push.
- Implementation and detailed comparison: docs/UI_UX_COMPARISON.md.
  Baseline findings remain docs/UI_UX_REVIEW.md (historical, before changes).
- New rack-specification endpoint validates expected level/project/height/position, 1-48U,
  target project, overlap and bounds; failed persistence rolls back. Ordinary placement
  still cannot change type/height. Internal CDU stays on U1; external CDU stays 0U.
- Unified mobile shell, useful dashboard first screen, retained collapsible 3D, consistent
  type/buttons/icons, grouped Rack actions, compact detail summary, list persistence and
  browser history, typed telemetry units/timestamps, task target/selection review.
- Solo KVM uses fresh instances with bounded backoff, timeout, manual retry/stop,
  immediate scaleViewport setter, authentication failure handling and lifecycle cleanup.
- Unified confirmation/feedback and explicit command-accepted language; duplicate power
  submissions blocked; expected_target preserved. Failed DELETE no longer hides the item.
- Python: 56 isolated regression tests passed. Desktop acceptance: 23/23 groups passed.
- New workspace browser: height promotion/correction/conflict/stale state, history/search,
  Escape, selection review, telemetry and 5 routes x 4 widths x 2 themes passed.
- KVM unit/browser and workspace-operation tests passed. Existing operations/equipment/
  engineering/theme/equipment-browser/CDU-visual checks passed. Source syntax and diff
  checks passed; representative desktop/light/mobile screenshots visually reviewed.
- Current evidence: qa/artifacts/workspace-ux/; selected baseline: qa/artifacts/ui-ux-review/.
- Delivery: functional commit 30508c7 pushed to main; remote hash verified.
  This status entry is a documentation follow-up. No deployment or live device operation.

## Rack view navigation follow-up (2026-09-24)

- List and Telemetry now sit directly beside 48U configuration; removed auto left margin.
- Added Networking Topology entry to shared Rack view controls with a planning dialog.
- Initial planning placeholder is superseded by the self-service topology editor below.
- L10 and L11 server details now share the same right-side system-operation deck. L10 shows
  an in-place L11 promotion/height action; L11 shows height correction in the same group.
- Detail rendering takes current level/project/rack fields from the live inventory list, so a
  completed promotion cannot remain visually mixed with a stale L10 detail snapshot.
- Verified fixture layout at 1440/390/320px without page overflow, adjacent desktop buttons,
  planning dialog and Escape. L10/L11 operation-deck browser checks, workspace UX matrix,
  equipment browser, operations/equipment regressions and clean desktop acceptance 23/23 passed.
- Functional commit `71117eca4bc8ebcd45dd21be15e887de3d79ac47` was pushed to main and
  verified against `git ls-remote`. No backend, live device action or deployment.

## L10 promotion visibility follow-up (2026-09-24)

- The product list presentation had moved every non-Terminal row action into the overflow
  menu, which made the existing L10 promotion control appear to be missing.
- L10 `升 L11` is visible again beside Terminal while secondary actions remain in the menu.
- The same promotion flow still selects the L11 project and explicit 1-48U height.
- Targeted fixture browser check passed: visible row action outside the overflow menu opens
  the L11 specification dialog. Full workspace UX matrix also passed at 1440/768/390/320px.
- Functional commit `c5bfd09cf8ac0eeefeb5837cf6781e666712b105` was pushed to main and
  verified against `git ls-remote`. Not deployed.

## Naboo inventory and OpenHands merge (2026-09-24)

- Fast-forwarded `origin/fix/ssh-probe-and-user-name` into main through commit
  `54ffe9144d660d61cfe5fae53ba106b8d5616a69`, pushed main and verified the remote hash.
- Naboo production inventory contains 32 L11 servers, 2 switches, 3 power shelves,
  7 blanking panels and 1 external CDU, plus 1 L10 server in the same project.
- All placed Naboo components are within 48U with no overlaps. One blanking panel is
  intentionally/unresolved as unplaced; the external CDU does not consume rack U space.
- The committed production inventory contains no OS or BMC password values.
- Python regression 56/56, operations/equipment regressions, equipment browser and desktop
  acceptance 23/23 passed after the merge. No deployment or live equipment action occurred.

## Self-service network topology (2026-09-24)

- User authorized reusable project/Rack wiring configuration and push to main.
- Networking Topology now opens a persistent project-scoped editor with multiple named
  topology racks, inventory snapshots/custom devices, editable nodes/DPU pairs, physical
  ports and many-node management mappings. Existing inventory/placement is unchanged.
- Optional 4 Node + 4 BF4 / 2 RJ45 template; Host and DPU batch wiring to selected switches,
  manual port pairing/interconnects, connection editing/deletion and network filters.
- Diagram/card selection highlights paths; connection list identifies both physical ports.
  Planned/confirmed lines are manual cabling records; live carrier status remains unknown.
- Atomic validated storage, revision-conflict protection, failed-save draft retention, export,
  discard confirmations, physical port exclusivity and dependent-link cleanup. Project rename
  preserves topology and all existing project metadata. On-demand fixed-IP Ping was added in
  the later validation section; it remains separate from single-device operations.
- Legacy /api/links remains separate. Imported equipment is a topology snapshot; inventory
  rename/deletion does not silently alter saved wiring. Node IPs are annotations only.
- Guide: docs/NETWORK_TOPOLOGY.md. Limits, snapshot behavior and storage contract documented.
- Validation: 63 isolated Python regressions; new topology browser test covers 32 trays /
  128 Node-DPU pairs / 64 management cables, editing, manual/batch connections, failed/stale
  saves, reload, project/Rack isolation, XSS escaping and responsive light/dark layouts.
  Existing operations/equipment regression, equipment browser and acceptance 23/23 passed.
  Source syntax and diff whitespace checks passed. Screenshots: qa/artifacts/topology/.
- Delivery: functional commit `cf2bc50f77dabe234d7efa34df774bbd35a80bc0` pushed to main
  and verified against git ls-remote. This status update records that delivery. No deployment,
  production inventory mutation or live device action performed.

## Topology variable-node follow-up (2026-09-24)

- User clarified that node count varies by project/server. New-device and inventory-import
  forms now default to custom 1-node configuration and accept 1-64 nodes per server.
- Optional per-node DPU creation with a custom model label. No DPU is the custom default;
  only a Host management port is generated. Vera is an editable preset (4 nodes / BF4),
  never a project-wide requirement. Existing devices retain their saved configuration.
- The same Rack can mix configurations; import heterogeneous groups separately, then use
  each device's Add/Edit/Delete Node and Port controls for independent changes.
- Topology browser regression passed with mixed 1/2/8-node devices, optional/custom DPUs,
  a Vera preset changed to 6 nodes, and the original 32-tray / 128-node wiring scenario.
  Existing persistence, conflict, failure, project isolation and responsive checks passed.
- Delivery: follow-up included in the user-authorized main publication; no deployment.

## Topology browser compatibility follow-up (2026-09-24)

- A deployed browser reported `crypto.randomUUID is not a function` while applying the
  first Rack draft. Topology IDs now use native randomUUID when available and fall back to
  Web Crypto random bytes (with a final legacy local fallback) on older/non-secure contexts.
- The topology browser regression now explicitly disables randomUUID before loading and the
  complete Rack/template/wiring/save workflow passes with zero page errors.
- Cache version updated. Functional commit `c6e6782516e6e8da202fe52d97602f3304c161c7`
  was pushed to main and verified against git ls-remote. No deployment, inventory change or
  device operation occurred.

## Network topology Traditional Chinese UI (2026-09-24)

- User requested removal of the remaining English-heavy topology UI. Both Rack entries now
  use the same `網路拓樸` label, making their shared destination clear.
- Topology title, workspace, Rack/device/node/port forms, templates, network roles, counters,
  connection state, confirmation prompts and validation/save errors are Traditional Chinese.
  OS, BMC, DPU, VLAN and JSON remain as standard technical abbreviations.
- Backend topology validation/conflict/save errors and preview fixture responses are also
  localized, so failures do not fall back to English after a Chinese form submission.
- Topology browser regression includes a localization assertion and passed the complete
  old-browser, template, wiring, save/conflict and responsive workflow with zero page errors.
  Python regressions passed 63/63; operations and equipment regressions passed. Updated
  light/dark desktop/mobile screenshots are in qa/artifacts/topology/.
- Changes are included in the current user-authorized main publication. No deployment,
  production inventory mutation or device operation occurred.

## Topology fixed-IP Ping validation (2026-09-24; prior policy, superseded above)

- A saved Rack can now check all configured Host OS/BMC and DPU OS/BMC fixed IPs on demand.
  The backend de-duplicates addresses, uses bounded 64-worker concurrency, retries failures
  once and supports at least 512 targets without storing results or credentials.
- Results roll up from each node field to its mapped RJ45 port, device and documented cable.
  The UI shows reachable/partial/no-response/unconfigured states and filters failed,
  partially reachable or unconfigured wiring. Ping confirms IP reachability only; physical
  switch-port identity, carrier state and LLDP discovery remain outside this check.
- Limits are 4096 mapped fields and 2048 unique IPs per Rack sweep. A topology must be saved
  before checking, so displayed results always correspond to the server-side saved document.
- Validation: 65 isolated Python regressions, including 512 targets, address de-duplication,
  retry behavior and no persistence; full topology browser workflow with Ping status/filter,
  responsive screenshots and zero page errors; changed JavaScript syntax passed.
- User authorized commit/push to main. No deployment or real network probe was performed.

## Naboo confirmed topology configuration (2026-09-24; 65-cable baseline, superseded above)

- The tracked Naboo production-data snapshot now contains 32 rack servers and two switches
  as topology devices. Every server has four editable nodes, one BF4 label per node and two
  shared management RJ45 ports mapped across all four nodes.
- Switch-2201-1 ports 1-32 connect to each server Host-management RJ45; Switch-2201-2 ports
  1-32 connect to each DPU-management RJ45. Switch port 48 connects the two switches.
  All 65 cables are recorded as confirmed: 32 Host, 32 DPU and one switch interconnect.
- `scripts/configure_naboo_topology.py` safely regenerates the same topology from inventory,
  validates the result, increments its revision, preserves node IP fields by inventory name
  and node position, writes atomically and creates a timestamped backup by default.
- Validation: production snapshot reports 34 devices, 128 nodes and 65/65 confirmed links;
  67 isolated Python regressions passed, including exact counts, mappings, IP preservation
  and refusal when the inventory is not exactly 32 rack servers and two rack switches.
- The local production-data snapshot is configured. Applying it to `/srv/pa-manager-prod/data`
  still requires running the configuration tool on the deployed host; no service restart,
  live API mutation or device command was performed from this workstation.

## Power Shelf appearance alignment (2026-09-24)

- User requested the single-device Power Shelf drawing match the Rack 3D design.
- Shared SVG front/perspective drawings now repeat six fan modules for every saved U,
  replacing the former single center row plus filler grilles. Shared left controller,
  module handles and fan mesh follow the Rack face. Inspector uses the same illustration.
- Rack 3D no longer caps fan rows at 8 for taller Power Shelves. Inventory/height values
  and management behavior are unchanged; visual assets have updated cache versions.
- Fixture browser verified 1/2/3/4/8/16/48U row counts, actual 3U detail rendering,
  desktop/mobile layouts and zero page errors. Desktop screenshot visually reviewed.
  Evidence: qa/artifacts/powershelf/. JS syntax, diff checks and core-scene 11/11 passed.
- Existing hardware-identity unit check fails on memory summary (expected 256 GB,
  actual duplicated 8 DIMMs). Its source and product-detail.js are identical to HEAD;
  this unrelated pre-existing failure was not changed in this presentation patch.
- Delivery: included in the current user-authorized main commit/push; not deployed.

## Completed

- TC1288-inspired CDU presentation (`b4cedcb`, refined by `ab6fc8f`):
  - External Rack 3D CDU now has charcoal front/side panels, recessed seams, Cooling
    lettering (MGC branding removed), touchscreen/bezel, red/yellow emergency stop, latch and low intake grille.
    Reference proportions remain H2160 / W900 / D1350 mm; placement and rear ports are intact.
  - Continuous blue outer rails and staggered inner rails have moving tapered highlights,
    pale cores and soft glow. Decorative lighting is independent of the water-flow toggle.
    Reduced motion, hidden/offscreen canvas, rear-facing rails, context loss and disposal
    stop its animation. Rotating back toward the front resumes it.
  - CDU single-device detail follows its saved installation: external uses the upright
    cabinet illustration; internal uses the horizontal rack-bottom CDU illustration.
    Caption and installation information follow the same current inventory record.
    Viewing either illustration does not change installation or consume U slots.
    The external Rack inspector and device detail both display Cooling only.
  - CDU detail now shares the compact Rack navigation on mobile, avoiding sidebar/header
    overflow. Changed script/CSS URLs have new cache versions.
  - No backend, inventory, live telemetry or device-operation behavior changed.
- `7a23ae6`: L11 immutable specifications and placement endpoint, explicit external/internal
  CDU conversion, first review B1-B14 and U1-U6/U8.
- `9fc67df`: non-server management IP changes and SSH Terminal, plus R1-R4:
  - R1: generic BMC PATCH synchronizes the selected OS pairing and invalidates caches.
  - R2: non-server/passive equipment cannot demote to L10; server roundtrip remains supported.
  - R3: list/detail/on-off batch capability checks agree; preserve explicit custom on/off
    commands while preventing generic server power fallback on non-server equipment.
  - R4: frontend/backend share classification rules. Explicit type wins; uncertain legacy
    records are flagged for confirmation without rewriting inventory. Internal unknown-kind
    fallback remains server-compatible, but the UI flags uncertainty and restricts power.
- Non-server management IP accepts IPv4/IPv6 syntax without Ping/hostname/BMC probing.
  It changes only the chosen legacy os/bmc connection, preserves credentials and the other
  address, checks expected_ip, rolls back failed saves and clears caches.
- SSH selects that connection's own address/credentials; missing credentials can be entered.
  Blanking panels expose neither IP settings nor Terminal. Current recorded OS and OS-slot
  SSH ports are 22; BMC web Terminal maps IPMI 623 to 22 and retains custom SSH support.

## Pending and deliberately deferred

- No remaining implementation from the current workspace UX / rack-height request.
  Real device validation and deployment are separate from the completed fixture checks.
- U7: Rack Reboot and AUX remain deferred.
- User clarified 32 trays x 4 Host nodes with one BF4 per node and two shared management
  RJ45 ports per tray. This is now an optional editable topology template; operational
  inventory/OS target behavior remains unchanged. Exact switch interconnect is unverified.
- Do not add DPU OS/BMC Ping to single-machine detail.
- Non-server real telemetry collectors still need device-specific integration; do not claim
  CDU water flow/temperature/pressure visuals are live measurements.
- Deployment/live device validation has not been requested. Do not execute historical Linux
  service commands or hardware actions from old notes.

## Validation for Cooling label and installation-aware detail (`ab6fc8f`)

- `node qa/cdu-visuals.cjs` passed with synthetic fixtures: Cooling only in the external
  inspector/detail; external upright/front/0U and internal horizontal/perspective/4U.
- External -> internal -> external changes through the fixture installation endpoint,
  inventory refresh and normal rendering update the drawing, caption and installation
  information on the same detail page without reopening or reloading it.
- Existing blue-flow, reduced-motion, offscreen/context-loss/restoration/disposal and
  390/320px Rack/detail checks passed; zero browser errors or external requests.
- `node qa/operations_regression.cjs` and `node qa/equipment_regression.cjs` passed.
- Changed JS syntax and `git diff --check` passed. Updated desktop/mobile screenshots
  were visually reviewed. Evidence remains `qa/artifacts/cdu-tc1288-*`.
- No backend/device/deployment changes. This refines the same user-authorized CDU work
  and push; the functional commit above was pushed and verified with `git ls-remote`.

## Prior validation for CDU visuals (`b4cedcb`, 2026-09-24)

- `node qa/cdu-visuals.cjs` passed against the final code with a temporary loopback fixture
  server and Chrome. Actual front/focused blue pixels move with water paused; reduced
  motion is stable; offscreen/context-loss/restoration/disposal behavior passed.
- Dark/light Rack views and internal/external CDU detail fit 390/320px screens. External
  installation stays 0U after detail viewing; internal installation stays U1-U4.
- `node qa/cdu-layout.cjs` passed all 7 groups against the final code, including installation
  conversion/conflicts, paused rear-water pixels, 1600/1024/390/320px bounds, no-CDU state
  and finite geometry for 1/4/8/16/24/48U devices. Its original assertions were unchanged.
- `node qa/operations_regression.cjs`, `node qa/equipment_regression.cjs` and
  `node qa/equipment-browser.cjs` passed; IP/SSH/capability workflows remain intact.
- `node qa/core-scene.cjs` passed 11 checks; `node qa/hardware-identity.cjs --unit` passed.
- Changed JS syntax and `git diff --check` passed. New browser QA had zero script/console
  errors and zero external requests. Screenshots were visually reviewed.
- Evidence: `qa/artifacts/cdu-tc1288-visuals.json` and `qa/artifacts/cdu-tc1288-*.png`.
  Representative images: `cdu-tc1288-perspective.png`, `cdu-tc1288-front.png`,
  `cdu-tc1288-detail-external-1600.png`, `cdu-tc1288-detail-external-390.png`.
- All UI checks used synthetic fixtures. No live backend, hardware command or deployment
  was used. Backend tests were not rerun for this presentation-only update.

## Prior backend validation

- At `9fc67df`, 49 isolated Python regression tests passed:
  `python -m unittest discover -s qa -p '*regression.py'`.
- That revision also passed changed Python AST, JS syntax, frontend equipment/operation
  regressions and fixture-browser IP save/reload, SSH target and CDU capability checks.
- No real SSH/BMC/power command tests or deployed-service verification were performed.

## References on demand

- TC1288 visual reference: https://mg-cooling.com/en/portfolio-item/in-row-cdu_tc1288/
- Equipment implementation evidence: `SESSION_HANDOFF_EQUIPMENT_IP_R1_R4_20260924.md`.
- L11/CDU and first review evidence: `SESSION_HANDOFF_NEXT_ACTIONS_20260924.md` and
  `SESSION_HANDOFF_PROJECT_REVIEW_20260924.md`. Their pending/unpushed notes are historical.
- Original project context: `docs/history/AGENTS_PRE_NEXT_20260924.md`; read only for a
  relevant historical question, not as a startup checklist.

## Continuation convention

When asked to continue PA Manager Next, read AGENTS.md and this file, verify Git, then work
on the new request. Update this file at the end of meaningful work; do not require a pasted
handoff. A project skill can be invoked explicitly as `$pa-manager` when it is available.

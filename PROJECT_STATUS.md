# PA Server Manager Next - Current Status

Updated: 2026-09-24. PROJECT_STATUS.md is the single maintained continuation record.

## Repository and delivery

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
  preserves topology and all existing project metadata. No new device operations or DPU Ping.
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

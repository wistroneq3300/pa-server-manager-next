# PA Server Manager Next - Current Status

Updated: 2026-09-24. PROJECT_STATUS.md is the single maintained continuation record.

## Repository and delivery

- Repository: https://github.com/wistroneq3300/pa-server-manager-next
- Known checkout: C:/Users/kobei/Documents/Codex/2026-09-24/pa-server-manager-next-https-github
  Prefer the current verified checkout if this project moves or runs on another host.
- Latest verified functional commit: `b4cedcb8a12dfe1fe08d8260990d4039003b5399` on `main`.
- That functional commit was pushed and verified using `git ls-remote` on 2026-09-24.
- No deployment or production service restart was performed. Pushed does not mean live.
- User authorized the CDU visual changes and push on 2026-09-24. The functional commit
  above is committed and pushed; `git ls-remote` matched it after publication.
- This status update is a documentation follow-up to that verified functional commit.
  Check HEAD and origin/main for the current documentation revision.
- Instruction/skill consolidation was published as `4e29682`.

## Completed

- `b4cedcb`: TC1288-inspired CDU presentation:
  - External Rack 3D CDU now has charcoal front/side panels, recessed seams, MGCooling
    lettering, touchscreen/bezel, red/yellow emergency stop, latch and low intake grille.
    Reference proportions remain H2160 / W900 / D1350 mm; placement and rear ports are intact.
  - Continuous blue outer rails and staggered inner rails have moving tapered highlights,
    pale cores and soft glow. Decorative lighting is independent of the water-flow toggle.
    Reduced motion, hidden/offscreen canvas, rear-facing rails, context loss and disposal
    stop its animation. Rotating back toward the front resumes it.
  - CDU single-device detail uses the existing horizontal rack-bottom CDU illustration.
    Viewing this illustration does not convert an external device or consume U slots.
    The external Rack inspector uses a matching TC1288 front elevation.
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

- No remaining implementation task from the CDU visual request; take the user's next request.
- U7: Rack Reboot, AUX and some topology entry workflows remain deferred.
- 32 machines x 4 nodes architecture remains undecided; do not implement it yet.
- Do not add DPU OS/BMC Ping to single-machine detail.
- Non-server real telemetry collectors still need device-specific integration; do not claim
  CDU water flow/temperature/pressure visuals are live measurements.
- Deployment/live device validation has not been requested. Do not execute historical Linux
  service commands or hardware actions from old notes.

## Validation for CDU visuals (2026-09-24)

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

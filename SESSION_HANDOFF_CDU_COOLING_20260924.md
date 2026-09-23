# CDU installation and rear cooling illustration - 2026-09-24

## Latest approved scope
- Next repository only. Baseline d5e4a45. User authorized implementation, commit and push; no deployment.
- Rack plus supports one CDU per project: internal bottom-mounted or external, never both.
- External CDU asks for no U count. Generic model, TC1288 only an exterior visual reference.
- External cabinet is on the rack front-view right, shares orbit/zoom with the rack.
- Operational fixture: CDU-01 external; former U1-U4 filled by BLANK-BOTTOM-04U.
- Homepage KEEP original 4U internal CDU and connect rear hoses to it. No external homepage cabinet, no hoses to floor.
- Without an installed CDU, operational rack retains busbar/manifolds/capped fittings but no connection hoses or moving flow.
- Vera 32 trays x 4 nodes remains ON HOLD. No DPU Ping, Terminal changes, deployment or production-data writes.

## Data and conflict handling
- `rack_mount`: `internal` (default for existing records) or `external`.
- Only rack-level CDU may be external; canonical external `rack_u=0`, `rack_size=0` and valid project required.
- Internal placed CDU occupies U1..N: top U equals its height. Pending internal CDU at U0 remains supported.
- All CDU records in a project, including pending ones, count toward the one-CDU rule.
- Backend validates create, patch, type changes and project transfers, retaining existing transaction lock/rollback.
- Duplicate CDU / overlapping bottom placement: HTTP409. Invalid type/placement/mount: HTTP400.
- No automatic moving/removal of user equipment or automatic blank insertion on real inventory conversion.
  The bottom 4U blanking change is fixture-only. User clears occupied bottom before converting to internal.
- External CDU appears in 3D/selector/list/telemetry without U occupancy or pending-placement warnings.
- Existing stored legacy data is not migrated. Conflicting legacy placements require user correction.

## Visual implementation
- `rack-equipment-scene.js`: procedural exterior CDU, center busbar, separate cable cartridges,
  coolant manifolds, colored couplings, smooth paired hoses, expanded scene framing/picking.
- Semi-transparent hose shell and colored fluid core use separate draw passes. Blue CDU->Rack,
  red Rack->CDU. Illustration only; not real pump state or measured flow.
- Flow toggle, reduced-motion, hidden-document/offscreen pause and disposal are handled.
- Homepage shares static rear geometry, including transparent colored hoses to its original internal CDU;
  homepage keeps demand-driven rendering, without a new idle animation loop.
- `core-scene.js` extends rear framing and imports transparent shell material.
- Rack-only mobile layout fixes sidebar/content constraints at 320/390px, including expanded view.
- Assets versioned in static/index.html. No external runtime dependency or downloaded image in app.

## Verified references (original procedural model, not vendor CAD)
- TC1288 exterior/proportions: https://mg-cooling.com/en/portfolio-item/in-row-cdu_tc1288/
- Official exterior reference: https://mg-cooling.com/wp-content/uploads/2026/04/No.2-TC1288-1.png
- NVIDIA rear layout: https://docs.nvidia.com/dgx/dgxgb200-user-guide/hardware.html
- Labeled rear components: https://pubs.lenovo.com/gb300-nvl72/rack_rear_view
- User-provided photo governs requested left-red/right-blue layout when viewed from rear.
- TC1288 rear-port engineering dimensions are NOT verified. Cabinet plumbing is an illustration of
  the user's requested secondary supply/return arrangement, not an installation drawing.

## Verification
- `qa/cdu_placement_regression.py`: 10/10 actual backend function tests via AST, temporary files.
  Includes simultaneous CDU creation, duplicate/pending checks, mode switching, rollback and telemetry membership.
- `qa/reliability_regression.py`: 13/13 passed, existing storage/MAC/telemetry behavior retained.
- `qa/cdu-layout.cjs`: 7 scenario groups passed. Real UI creation/edit, bottom conflict, no-U exterior,
  flow pixel changes/pause, reduced-motion, no-CDU, 320/390/1024/1600px, finite 1/4/8/16/24/48U geometry.
- `qa/cdu-edge-review.cjs`: no-project chooser, exterior-only project, project move/rename, pending CDU passed.
- `qa/acceptance.cjs`: 23/23 passed; fixture expectations and plus chooser updated.
- `qa/core-scene.cjs`: 11/11 passed; `qa/hero-assembly.cjs`, `qa/gb300-rack.cjs`,
  `qa/equipment-workspace.cjs`, `qa/engineering-ux.cjs` passed.
- Dedicated loopback fixture is 127.0.0.1:8887. Port8879 served an older checkout; early runs on8879
  were discarded, and passing browser runs above use8887 with response source verified.
- No production FastAPI HTTP integration or physical CDU/SSH/IPMI validation was performed.
- Python/JS syntax and git diff checks performed. Flow is illustrative, not telemetry evidence.

## Next backend upload
Preserve user's forthcoming FastAPI modifications using a three-way comparison against their baseline.
This increment adds small CDU validation/schema/telemetry membership changes to main.py; do not replace
an uploaded backend wholesale. Terminal integration remains deferred. Production PA_DATA_DIR stays untouched.

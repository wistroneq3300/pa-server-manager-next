# GB300-inspired operational rack / device illustrations

## Scope and publication

- Repository: `wistroneq3300/pa-server-manager-next` only.
- Branch: `astra-cinematic-ui`; user authorized commit and push.
- User's remote functionality was fetched before this work and preserved.
- No force push, original-repository change, main merge or production-device action.
- Previous feature commit: `3512cbe`; main at start: `93bcc09`.

## Delivered design

- Rebuilt native-WebGL equipment with GB300-reference service faces, machined edges,
  perforations, caddies, ports, screws, rails, power-supply fans and rear fittings.
- Final user color revision: **Server and NVLink Switch Tray fronts are champagne
  gold**. Their chassis and rear stay silver/gray. Switch/Power Shelf/PDU are dark;
  CDU and Storage use neutral metal. Do not revert NVLink to silver-front.
- Latest user-supplied rack-front crop is the NVLink face authority: closed flat
  champagne fascia, left compact I/O, pressed horizontal lip and small fixings.
  Do not put the open-tray top view's two large oblong handles on this front face.
- Server NIC plates and connector surrounds on both sides also use champagne metal;
  only perforations and socket interiors stay dark. Do not reuse the neutral-gray
  switch mesh material for these server front-panel regions.
- Model placement uses each record's `rack_u` (top slot) and `rack_size` (height).
  Future equipment is not forced into the example's sizes. Editors allow 1..48U.
- Front/rear views, drag/keyboard orbit, zoom, selected-equipment focus, expanded
  view and Escape/reset controls; original editable 48U plane remains available.
- Every static System Detail equipment illustration was redrawn. It stays static,
  uses the actual U height, and has a complete uncropped presentation in the card.
- Device pictures are authored reference-inspired illustrations, not NVIDIA CAD,
  exact SKU photographs, actual port inventories or live telemetry. No vendor images
  or downloaded models were added to the repository.

## Approved custom demo (top down)

| U positions | Components |
| --- | --- |
| 48, 47 | Two 1U blanking panels |
| 46, 45 | Two 1U management switches |
| 44..41 | Four 1U power shelves |
| 40..37 | 4U server |
| 36..34 | 3U server |
| 33..32 | 2U server |
| 31..23 | Nine 1U NVLink Switch Trays |
| 22..14 | Nine 1U servers |
| 13..10 | Four 1U power shelves |
| 9..5 | One 5U blanking panel |
| 4..1 | One 4U CDU |

35 components, 48 occupied U positions. This is a user-requested custom layout,
not a factory GB300/NVL72 configuration claim. Only isolated preview fixtures change;
real production records are untouched. The default preview still has 12 L10 systems.
`?preview=scale` still supplies 50 L10 systems across 10 projects plus 3 rack projects.

## Code boundaries and behavior

- `rack-equipment-scene.js`: original procedural WebGL. Existing `PARackScene.mount`
  API retained; added `focusSelection()` and diagnostic focus/geometry state. On-demand
  drawing, no idle loop, context-loss recovery, resize, picking and disposal retained.
- `hardware-visuals.js`: shared nine-type original SVG illustrations and type identity.
- `equipment-workspace.js/.css`: stage, inspector, controls, uncropped detail images.
- `app.js`: narrowly adds `nvlink`, 1..48 sizes and fixes two verified placement bugs:
  unplaced components no longer claim U48; unmount keeps the original component size.
- `main.py` / `telemetry_core.py`: additive `nvlink` allowlist/classification only.
  No changed endpoints, payload fields, hardware operations or collectors. NVLink
  telemetry is intentionally empty until a real collector is implemented.
- Existing KVM, OS slots, Terminal, test library and backend workflows are preserved.
- No frontend framework or runtime dependency added. Local asset query versions bumped.

## Verification and preview

Run `python serve.py --port 8769` and open
`http://127.0.0.1:8769/#/rack/proj_k`. `serve.py` alone injects the preview service;
FastAPI's `static/index.html` does not load fixtures. Preview mutations reset on reload.

Reproducible checks:

Final functional result: 23/23 acceptance groups, equipment-workspace suite and
GB300-specific suite passed, with no page/console errors or external data requests.

- `node qa/acceptance.cjs`: 23 desktop/workflow groups including 13 telemetry canvases,
  6-category/3,112-case library, Terminal/KVM preview, deep links and reduced motion.
- `node qa/equipment-workspace.cjs`: all nine device identities, 35/48U, 1440/1600/1920,
  dark/light, 50-system scale, empty/unplaced rack, hardware and sensors.
- `node qa/gb300-rack.cjs`: exact U arrangement; focus/orbit/front/rear; arbitrary6/7U;
  geometry cleanup; WebGL loss/restore/fallback; all nine SVG types and uncropped
  System Detail illustrations. Screenshots/reports are under `qa/artifacts`.
- Syntax checks for changed JS/Python and `git diff --check`.

These are local fixture/UI checks, not real-hardware, long-duration or production-load
certification. Frontend placement is exact in U units; internal fittings and unreported
device details are illustrative. Nothing claims an implemented NVLink collector.

## Continuing safely

Read this handoff before older preview-only notes. Preserve current upstream features
and user-added data. Do not edit test-library source or contact company equipment for
UI verification. See DESIGN-NOTES.md for public reference links and attribution.

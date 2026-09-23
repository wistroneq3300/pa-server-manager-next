# GB300 homepage insertion, rack localization and material refinement

## Scope

`pa-server-manager-next`, branch `astra-cinematic-ui`, following `ee43e67`.
Preserve the user's upstream functionality. No original-repository changes, main
merge, production actions, API changes or fixture-data changes in this round.

## Rack refinements

- Newly introduced rack controls, labels, connection/power status, empty and WebGL
  fallback messages now use Traditional Chinese. Preserve device/project names and
  technical terms such as OS, BMC and NVLink. Sensor-analysis headings also localized.
- Multi-U Server: first/top 1U service panel stays champagne gold; the added vent
  panels below use neutral gray. Gold outer frame retained. SVG and WebGL agree.
- Remove all left-side U digits and their backing strip from the 3D frame only.
  The functional plane editor still has U48 through U1 for precise placement.
- Light-theme NVLink plane rows use muted champagne with dark, shadow-free text.
  Hover/focus remain legible; dark-theme colors are unchanged. The measured minimum
  name contrast across default/hover/focus gradient endpoints is 6.96:1 in light
  mode and 8.18:1 in dark mode. Actual browser computed styles are tested.

## Homepage demonstration (independent of live rack records)

| Top-down positions | Illustration |
| --- | --- |
| U48..47 | Two 1U blanking panels |
| U46..45 | Two 1U management switches |
| U44..41 | Four 1U power shelves |
| U40..32 | Nine 1U compute nodes |
| U31..23 | Nine 1U NVLink Switch Trays |
| U22..14 | Nine 1U compute nodes |
| U13..10 | Four 1U power shelves |
| U9..5 | One 5U blanking panel covering the reserved space |
| U4..1 | One 4U charcoal CDU |

41 components / 48 occupied U, including the reserved 5U blanking panel. The user's
latest clarification explicitly requires this cover between power and CDU, not an
open gap. This is a user-directed illustrative
GB300-inspired arrangement, not a claim of an exact factory SKU or official CAD.
Do not replace the operational demo's mixed 4U/3U/2U configuration with this plan.

The same 1U compute node remains visible through the reversible scroll story:
align in front of the open U40 slot, insert on the rack depth axis, then pull the
camera back to the full rack. No duplicate node occupies its target slot.

`PARackScene.buildEditorialParts()` exposes a CPU-only geometry factory, with no
live-data access. The homepage reuses the exact equipment/frame geometry, uploading
eleven buffers once (seven device/size meshes, frame, floor and two rail meshes). Scroll
changes transforms, not meshes; no continuous idle render loop. The lid latch is
kept inside the actual U envelope. Intermediate close-ups have a subtle 64px bottom
feather; the standalone and full-rack endpoints remain opaque. No new dependency.

## Verification

- `qa/equipment-workspace.cjs`: Traditional Chinese states, 48U editing, NVLink
  light/dark computed contrast, 50-system / 3-rack fixture coverage.
- `qa/gb300-rack.cjs`: original rack functionality, mixed-U material separation,
  SVG geometry, WebGL recovery and desktop captures.
- `qa/core-scene.cjs`: shared geometry and deterministic insertion/lifecycle checks.
- `qa/hero-assembly.cjs`: real browser forward/reverse scroll, desktop themes,
  insertion-stage captures, WebGL recovery, reduced motion and route cleanup.
- `qa/acceptance.cjs`: full 23-group fixture/workflow acceptance.

Status: all five suites above passed. Full acceptance: 23/23; core geometry and
lifecycle: 11/11. The real browser run covers 1440/1600/1920 widths, both themes,
forward/reverse insertion, keyboard orbit/reset, successful WebGL restoration,
reduced motion and disposal. Browser errors and external requests: zero. Root
visually inspected standalone/insertion/seated/full-rack screenshots. These are
fixture/local-preview results, not production device verification.

Evidence: `qa/artifacts/hero-assembly.json`, `hero-gb300-*.png`,
`equipment-workspace.json`, `equipment-nvlink-plane-*.png`, `gb300-rack.json` and
`acceptance.json`. Existing operational fixture remains 35 components / 48U;
homepage illustration remains independent at 41 components / 48U.

Local fixture preview: `http://127.0.0.1:8769/#/dashboard`.
No new dependencies or vendor raster assets. Reference-inspired geometry is original.

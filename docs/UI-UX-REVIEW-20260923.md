# UI / UX review after the equipment-workspace push

Reviewed 2026-09-23 after `be89e8a` was pushed to `astra-cinematic-ui`.
Scope: Next only. Local fixture-driven desktop UI; no production device control.

## Delivered in this iteration

Data-driven champagne-metal 48U 3D rack; distinct equipment classes; orbit/front/rear/zoom/selection; accessible component selector; retained planar placement/list/telemetry/topology. Hardware inventory grouped and no longer limited to twelve SSDs; network badge contrast; separated Sensor AI and SDR sections; live KVM module's theme-aware shell. Empty typed projects, collapsed search and safer loading/placement handling were added.

The implementation references GB300 NVL72 engineering vocabulary, not an exact HPE or NVIDIA CAD assembly. Rack population follows saved project data. No new runtime dependencies or external asset/CDN requests.

## Post-push observations and corrections

- A switch with no BMC address was shown as BMC Offline in the new inspector. Corrected to Not configured; Unknown is separate when an address exists but no boolean result was reported.
- The upstream rack page hands the layout only mounted components. Updated the new layout adapter to include all project components in selection/warnings, including unplaced items, and permit a 3D workspace when all components are unplaced.
- No change to upstream multi-OS, BMC IP discovery, terminal bridge, real KVM connection code or FastAPI endpoints.

## Recommended next refinements (not implemented promises)

### P1 - Daily operation and trust

1. **Global status vocabulary.** Standardize Online / Offline / Unknown / Not configured / Stale across Dashboard, lists and details. Some inherited detail indicators still collapse unknown into offline. Show last observation time and source; never use a green decoration as evidence of a successful probe.
2. **50-system reading density.** Add comfortable/compact table density, sticky column headers and persistent search/project focus. Keep entire data tables flat, not pointer-tilted. Validate long names, many OS nodes and 100+ inventory entries.
3. **Placement safety UX.** Preserve physical device height when unmounting (upstream currently resets it to 1U). Show target U span and conflict reason before saving, add keyboard-accessible valid-slot preview, and only then consider drag/drop ghost placement. Do not silently change the backend schema.
4. **Command scope clarity.** Rack power and multi-node commands should clearly state selected project, exact target count, excluded/offline nodes and last result. Preserve existing confirmation/handlers. No fake progress animation or optimistic success.
5. **KVM status truth.** Separate connection availability, framebuffer state and input-broadcast readiness. The inherited banner can report matching disk information even when no RFB target is available; do not treat this as readiness. Test real connected, disconnected, SP-X popup and mixed-vendor modes on the department network.

### P2 - Premium visual consistency

6. **Curated equipment presets.** Add opt-in GB200/GB300 compute-tray front/rear variants only with explicit device-model metadata. Improve chamfers, fasteners, fine grille geometry, brushed reflections and contact shadows under a measured GPU budget. Do not make every server a GPU system or populate empty U space to make the rack look full.
7. **One icon and language system.** Replace remaining toolbar emoji with consistent SVG symbols; unify spacing, tooltip style and Chinese/English labels. Current new rack controls use concise English; a cohesive Traditional Chinese operator vocabulary would improve completion quality.
8. **Sensor reading structure.** Convert raw SDR lines into aligned Name / Reading / Unit / Status columns only when reliable parsed data exists. Keep the exact raw source accessible. AI output needs an explicit analysis timestamp, evidence and separation from measured sensor counts.
9. **Telemetry investigation.** Consistent units, per-series visibility, synchronized hover, stale-data labels and empty-history explanations. Validate chart destruction, rapid project switching and multi-hour refresh under slow networks. This iteration's small-scale QA is not a soak test.
10. **OS-slot information density.** The new upstream multi-OS page needs dedicated column prioritization and narrower-screen verification. Keep active OS and paired BMC unmistakable, preserve node-specific actions and avoid using the same visual emphasis for every credential field.

## Validation evidence and limits

- `qa/artifacts/acceptance.json`: 23/23 groups; no page or console errors or external HTTP requests in the fixture suite.
- `qa/artifacts/equipment-workspace.json`: 13 components/44U, camera/selection/type identity, three widths x two themes, 50 L10 systems/three L11 projects, collapsed search, empty rack, inventory and sensor sections.
- KVM UI uses a disconnected fixture / isolated RFB stub. No successful real-video, input synchronization, multi-OS backend transaction or production capacity claim is made.
- No 0U side-mounted PDU, external CDU placement, multi-rack-per-project schema, animated connectivity without real links, or manufacturer CAD accuracy is implied.

## Reference

HPE GB300 NVL72 QuickSpecs: https://www.hpe.com/us/en/collaterals/collateral.a50009244enw.html
The reference informs rack-scale material and assembly language. All procedural meshes and SVGs are authored locally; no vendor asset is redistributed.

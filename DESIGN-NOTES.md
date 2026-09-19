# Wistron PA Server Manager — desktop product concept 04

## Source and scope

Based on the local GitHub checkout at `E:/CodexProjects/pa-server-manager`, commit `499f561`.
Reviewed README sections 1.1–1.10, the actual `static/index.html`, `static/js/app.js`, the user guide, and existing branding assets.

This directory is independent of the repository. The source checkout, FastAPI backend and GitHub branches were not modified.

## Product structure retained

| Area | Original behavior retained in the preview frontend |
| --- | --- |
| Dashboard | Managed counts, availability, power states, project status, SUT health, AI Copilot |
| L10 System Level | Separate project groups, project ordering, system ordering, project management, OS/BMC states, move between compatible projects, system broadcast |
| L11 Rack Level | Separate project groups, add system/component, mount existing L11 systems into their own project |
| Rack Manager | Project selection, 48U placement with descending display and bottom-up numbering, component list, topology, telemetry by component kind, rack actions and broadcast |
| System detail | Basic information, hardware inventory, firmware, sensors, diagnosis, power controls, terminal, telemetry, assign-task/test-library entry |
| Common tools | User guide, original theme control, project KVM entry |

L10 and L11 are management levels, not physical sites. The navigation remains Dashboard, System Manager and Rack Manager. No task-board, scheduling, or project-progress model was invented.

## Visual changes

- A new dark graphite product shell, sculpted metal panels, beveled controls and layered shadows. The dark direction is intentional; the old theme control does not yet provide a fully designed light-mode alternative.
- Official transparent Wistron logo replaces the repository's white-background raster image.
- New server concept artwork, CSS rack models, pointer-driven perspective and light reflections. Reduced-motion preference disables movement; data tables remain stable.
- Dashboard explicitly separates L10 system projects from L11 rack projects.
- Project workspace uses large level selectors, project shortcuts, search and regrouped table columns. All OS/BMC addresses, statuses and original row operations remain accessible.
- Single-system pages are fully recomposed into Overview, Hardware, Sensors & firmware, Telemetry and Test tasks, with a persistent operations rail. Original hardware, sensors, firmware and chart content is relocated, not replaced with decorative placeholders.
- Rack workspace combines dimensional rack configuration with composition, topology and Copilot; list and telemetry views remain available.
- Low-frequency per-system actions move into a menu; original handlers are retained.

## Brand sources and image

- Official website: https://www.wistron.com/en
- Transparent logo discovered in that page's rendered DOM: https://www.wistron.com/_next/static/media/logo.8b542402.svg
- Saved byte-for-byte as `static/img/wistron-official.svg` using the browser's loaded asset export. The downloaded file uses `#006C93` and `#A1CC56` for the mark. These are verified digital asset colors, not an assertion about a published CI/Pantone standard.
- Dark graphite surfaces and lighter blue/green interface variations are this concept's design extensions, not official brand specifications. Logo colors are unchanged.
- Product context: https://www.wistron.com/en/Product%26Services/Enterprise%26Networking
- `static/img/server-hero.png` is an AI-generated 1536×1024 conceptual GPU-server illustration, not a photograph or an exact Wistron model. Generated with the built-in image-generation tool and visually inspected. Full prompt and provenance: [server-hero-prompt.md](static/img/server-hero-prompt.md).

## Implementation and limitations

- `static/js/app.js` is byte-identical to the source checkout (SHA256 verified).
- Active new presentation layer: `static/css/product.css`, `static/js/product.js`, `static/css/product-detail.css`, `static/js/product-detail.js`. Legacy atelier/pro/polish/premium enhancements are not loaded.
- `static/js/preview-fixtures.js` intercepts API requests and provides in-memory sample data. No real API calls are forwarded.
- The preview replaces WebSocket connections with a local demonstration. SSH, KVM, power, AI and scans do not execute on real equipment.
- The KVM dialog is a design simulation, not the actual noVNC session.
- The original test-library JSON is copied into fixtures for the existing assign-task browsing UI.
- Sample project names are based on repository documentation; counts, devices, hardware readings and addresses are demonstration data, not a production snapshot.
- Changes to sample projects/devices disappear after reload.
- Topology creation remains marked as pending, matching the existing application.

## Validation performed

- JavaScript syntax checks for product and detail presentation scripts.
- Desktop browser inspection of dashboard, regrouped project table, new system Overview and L11 rack plane/telemetry.
- Independent desktop check at 1728×1117: no document horizontal overflow, no JavaScript page errors; all five system tabs switch; all 13 original telemetry canvases have nonzero displayed dimensions in the active tab.
- Sensors analysis completes in the new panel. A small presentation-level adapter fixes the original selector lookup without changing its request or API.
- Test library loads 6 categories / 3,112 entries; first category opens the original assign-task sheet with 2,291 entries.
- Rack plane displays 48U with 44U occupied and 4U free; rack telemetry displays server, switch, power shelf, PDU and CDU data.
- Browser logs inspected without reported JavaScript errors at checked points.
- `app.js` SHA256 equals original: `05A5E7916C0C104CA536AF85FB324E58EF9288ABB1B81A72D93799798FFA9F3C`.
- Original E-drive repository remains clean; no commit, branch mutation or GitHub push performed.

This is a design review preview. Production API integration, all action branches and live hardware behavior still require regression testing after design approval.

## Run

From the parent workspace:

```powershell
.venv/Scripts/python.exe preview-v4/serve.py
```

Open `http://127.0.0.1:8768/` in a desktop browser. The static server listens only on loopback.

After design approval, transfer the presentation work into a new Git branch. Do not merge or push over the existing branch as part of this preview.

# PA Server Manager Next

High-end desktop UI concept for Wistron PA Server Manager, designed around two distinct engineering levels:

- **L10 — System Level:** system projects, OS/BMC health, terminals, hardware inventory, sensors, firmware, telemetry and test tasks.
- **L11 — Rack Level:** 48U placement, rack components, topology, rack-wide operations and component telemetry.

## Current status

This repository is an **independent interactive design preview**. It preserves the existing frontend workflows with local fixture data, but it is not connected to production equipment or the original FastAPI service yet. Terminal, KVM, power, scan and AI actions are safe simulations.

The original `pa-server-manager` repository is not modified by this project.

## Run locally

Python 3 is sufficient; no package installation is required.

```powershell
python serve.py
```

Open <http://127.0.0.1:8768/> in a desktop browser.

## Design

- Official transparent Wistron website logo asset
- Graphite datacenter product shell with dimensional surfaces
- Pointer-driven depth, light reflection and reduced-motion support
- Dedicated L10 and L11 project workspaces
- Rebuilt five-tab system detail workspace
- 48U rack, topology, component composition and telemetry views

See [DESIGN-NOTES.md](DESIGN-NOTES.md) for scope, source attribution, validation and known limitations.

## Safety

All included addresses use documentation IP ranges. Fixture credentials are preview-only strings. The local preview server binds to loopback and blocks `/api/` and `/ws/` network routes.

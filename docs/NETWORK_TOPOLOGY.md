# Self-service network topology

Open Rack Manager, choose a project, and select **Networking Topology** beside
the existing Rack views. Each project owns an independent saved document and can
contain multiple named topology racks. These are wiring workspaces, not changes
to physical U placement or inventory membership.

## Build a rack

1. Add and name a Rack.
2. Choose **Add inventory** (從專案加入設備), select the existing equipment, and
   choose the server template. Alternatively add a custom device.
3. The **4 Node + 4 BF4 / 2 RJ45** template gives each server four editable
   Node/DPU pairs. RJ45 #1 maps to all four Host nodes; RJ45 #2 maps to all four
   DPU nodes. Other hardware can start empty and use any number of custom nodes
   and ports within the documented limits.
4. Expand a device to add, edit or delete nodes and ports. Node entries contain
   a paired DPU label plus Host OS/BMC and DPU OS/BMC IP annotations. Shared BMC
   addresses may be repeated; separate BMCs are not assumed. Port mappings can
   reference multiple nodes.
5. Choose **Connect ports** (配對連線), select both devices and both physical
   ports, a network role, confirmation state and an optional cable/VLAN note.
6. Use **Save topology** (儲存拓樸) to persist the entire project document.
   Applying an editor form changes the draft; it does not save to the server.

## Naboo-style batch wiring

Import the 32 servers with the four-node template and the two switches. Specify
the actual switch port count; names initially run from 1 to that count and can
be edited individually. At least one additional physical port is needed for a
switch interconnect beyond the 32 server-facing ports.

- Batch wire the selected servers' Host management ports to Switch A, starting
  at the desired switch port list position.
- Repeat with DPU management and Switch B.
- Add Switch A to Switch B manually using their actual free ports. Leave it
  **planned / unverified** until the cabling is confirmed.

Batch order matches the server checkbox list. No existing cable is overwritten:
the whole batch is rejected if a selected server has zero/multiple ports for
that role, a port is occupied, or the switch has insufficient ports. Review the
resulting connection list before saving. The default batch state is planned.

## Reading and maintaining the diagram

Use the network filter to isolate Host, DPU, data or inter-switch wiring.
Click a device in the diagram or expand its card to highlight its paths and
inspect logical node mappings. The connection list identifies exact ports.
Solid lines mean manually confirmed cabling; dashed lines mean planned cabling.
Neither reports carrier status, Ping, LLDP discovery, VLAN reachability or redundancy.

Devices imported from inventory are explicitly snapshots for topology planning.
Renaming/moving/deleting inventory does not silently rewrite these diagrams;
edit the topology device label or remove it as needed. Existing legacy `/api/links`
diagrams remain separate and are not automatically converted. There is no new
device action, credential storage, DPU Ping collector or OS/BMC operational target.

Deleting a topology device/port removes its dependent cables after confirmation.
Deleting a node removes its port mappings. Deleting a Rack affects that topology
Rack only. Unapplied forms and unsaved drafts prompt before discard/close.

Each save uses a revision check. On a conflicting save, the draft stays visible;
export it as JSON before reloading the newest saved document. Export is a draft
backup for reference; this version does not import arbitrary JSON files. Save
failure leaves the draft intact, while the backend rolls back memory and disk.
Project rename preserves the topology document and project metadata.

## Storage and validation

`GET/PUT /api/projects/{name}/topology` stores the validated document in that
project's `topology` field using the existing atomic inventory persistence.
PUT requires the current integer `revision`. Limits per project: 32 topology
racks; per rack: 256 devices and 2048 cables; per device: 64 nodes and 256 ports.
Names/labels are limited to 160 characters. Node addresses must be IPv4/IPv6.
IDs are unique within their owning list. Physical ports allow one cable only;
multiple logical nodes can share a management port. Unknown fields, including
credentials, are not stored. Transactions assume the existing single-process
JSON backend; multi-worker deployment still requires shared transactional storage.

## Verification

- `python -m unittest discover -s qa -p '*regression.py'`
- `node qa/topology-browser.cjs`
- Existing operations/equipment regression and fixture-browser checks.

All tests use temporary storage or synthetic browser fixtures. The preview
fixture resets on page reload; production persistence is tested independently
through the real extracted storage handlers without launching device workers.

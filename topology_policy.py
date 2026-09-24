"""Validated, project-local topology documents. No device operations or credentials."""
import copy
import ipaddress


def validate(document):
    def require(ok, message):
        if not ok:
            raise ValueError(message)

    def text(value, label, required=True):
        require(isinstance(value, str) and len(value) <= 160, label + ': invalid text')
        require(not required or bool(value.strip()), label + ': required')
        return value

    def items(obj, key, limit):
        value = obj.get(key)
        require(isinstance(value, list) and len(value) <= limit, key + ': invalid list or limit exceeded')
        require(all(isinstance(v, dict) for v in value), key + ': invalid entry')
        return value

    def unique(entries, label):
        ids = [text(e.get('id'), label + ' ID') for e in entries]
        require(len(ids) == len(set(ids)), label + ': duplicate ID')

    require(isinstance(document, dict), 'Invalid topology')
    result = {'racks': []}
    racks = items(document, 'racks', 32)
    unique(racks, 'Rack')
    for rack in racks:
        out = {'id': rack['id'], 'name': text(rack.get('name'), 'Rack name'), 'devices': [], 'links': []}
        devices = items(rack, 'devices', 256)
        unique(devices, 'Device')
        endpoints = set()
        for device in devices:
            d = {k: text(device.get(k, ''), k, k in ('id', 'name', 'kind'))
                 for k in ('id', 'name', 'kind', 'inventory')}
            require(d['kind'] in ('server', 'switch', 'other'), 'Invalid device kind')
            nodes = items(device, 'nodes', 64)
            ports = items(device, 'ports', 256)
            unique(nodes, 'Node')
            unique(ports, 'Port')
            d.update(nodes=[], ports=[])
            node_ids = {n['id'] for n in nodes}
            for node in nodes:
                n = {'id': node['id'], 'name': text(node.get('name'), 'Node name'),
                     'bf4': text(node.get('bf4', ''), 'DPU label', False)}
                for key in ('host_os', 'host_bmc', 'dpu_os', 'dpu_bmc'):
                    value = text(node.get(key, ''), key, False)
                    if value:
                        try:
                            ipaddress.ip_address(value)
                        except ValueError:
                            raise ValueError(key + ': invalid IP address') from None
                    n[key] = value
                d['nodes'].append(n)
            for port in ports:
                p = {'id': port['id'], 'name': text(port.get('name'), 'Port name'),
                     'role': text(port.get('role'), 'Port role')}
                require(p['role'] in ('host', 'dpu', 'data', 'uplink', 'other'), 'Invalid port role')
                refs = port.get('nodes', [])
                require(isinstance(refs, list) and all(isinstance(x, str) and x in node_ids for x in refs), 'Port refers to missing node')
                require(len(refs) == len(set(refs)), 'Duplicate node mapping')
                p['nodes'] = refs[:]
                d['ports'].append(p)
                endpoints.add((d['id'], p['id']))
            require(len({p['name'] for p in ports}) == len(ports), 'Duplicate port name on device')
            out['devices'].append(d)
        connections = items(rack, 'links', 2048)
        unique(connections, 'Link')
        used = set()
        for link in connections:
            line = {'id': link['id'], 'note': text(link.get('note', ''), 'Note', False),
                    'state': text(link.get('state'), 'Connection state'),
                    'network': text(link.get('network'), 'Network')}
            require(line['state'] in ('planned', 'confirmed'), 'Invalid connection state')
            require(line['network'] in ('host', 'dpu', 'data', 'uplink', 'other'), 'Invalid network')
            for side in ('a', 'b'):
                endpoint = link.get(side)
                require(isinstance(endpoint, dict), 'Missing endpoint')
                pair = (text(endpoint.get('device'), 'Device ID'), text(endpoint.get('port'), 'Port ID'))
                require(pair in endpoints, 'Connection refers to missing device/port')
                require(pair not in used, 'Physical port already connected')
                used.add(pair)
                line[side] = dict(device=pair[0], port=pair[1])
            require(line['a']['device'] != line['b']['device'], 'Cannot connect device to itself')
            out['links'].append(line)
        result['racks'].append(out)
    return copy.deepcopy(result)

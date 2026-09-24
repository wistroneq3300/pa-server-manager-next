"""Topology isolation, persistence, validation and concurrent edit regressions."""
import copy
import json
from pathlib import Path
from types import SimpleNamespace
from unittest.mock import patch
import reliability_regression as base
import topology_policy


class TopologyRegression(base.unittest.TestCase):
    setUp = base.Reliability.setUp

    def handlers(self):
        self.s['topology_policy'] = topology_policy
        base.extract('main.py', ['get_project_topology', 'put_project_topology', 'edit_project', '_load_data'], self.s)

    def doc(self):
        node = dict(id='n1', name='Node 1', bf4='BF4 #1', host_os='192.0.2.1',
                    host_bmc='', dpu_os='2001:db8::1', dpu_bmc='')
        a = dict(id='server', name='Server', kind='server', inventory='node', nodes=[node],
                 ports=[dict(id='host', name='RJ45 #1', role='host', nodes=['n1'])])
        b = dict(id='switch', name='Switch', kind='switch', inventory='', nodes=[],
                 ports=[dict(id='p1', name='1', role='other', nodes=[])])
        link = dict(id='l1', a=dict(device='server', port='host'), b=dict(device='switch', port='p1'),
                    network='host', state='planned', note='VLAN 10')
        return dict(revision=0, racks=[dict(id='rack1', name='Rack 1', devices=[a, b], links=[link])])

    def test_persist_reload_and_project_isolation(self):
        self.handlers()
        self.s['projects']['other'] = {'name': 'other'}
        before = copy.deepcopy(self.s['machines'])
        result = self.s['put_project_topology']('rack', self.doc())
        self.assertEqual(result['revision'], 1)
        self.assertEqual(self.s['machines'], before)
        self.assertEqual(self.s['get_project_topology']('other'), dict(revision=0, racks=[]))
        self.s['_load_data']()
        self.assertEqual(self.s['get_project_topology']('rack'), result)
        result['racks'].clear()
        self.assertEqual(len(self.s['get_project_topology']('rack')['racks']), 1)

    def test_stale_revision_and_missing_project(self):
        self.handlers()
        self.s['put_project_topology']('rack', self.doc())
        for name, doc, status in [('rack', self.doc(), 409), ('missing', self.doc(), 404)]:
            with self.assertRaises(base.ApiError) as err:
                self.s['put_project_topology'](name, doc)
            self.assertEqual(err.exception.status_code, status)

    def test_malformed_documents_and_port_reuse_are_atomic(self):
        self.handlers()
        variants = []
        for mutate in [
            lambda r: r['links'][0]['b'].update(port='missing'),
            lambda r: r['devices'][0]['ports'][0].update(nodes=['missing']),
            lambda r: r['devices'][0]['nodes'][0].update(host_os='bad IP'),
            lambda r: r['links'].append({**r['links'][0], 'id': 'l2'}),
            lambda r: r['links'][0].update(state='online'),
            lambda r: r['devices'].append(copy.deepcopy(r['devices'][0])),
            lambda r: r['devices'][0].update(ports=None),
            lambda r: r['devices'][0]['ports'][0].update(nodes=[{}]),
        ]:
            doc = self.doc(); mutate(doc['racks'][0]); variants.append(doc)
        before = Path(self.s['DATA_FILE']).read_bytes()
        for doc in variants:
            with self.assertRaises(base.ApiError) as err:
                self.s['put_project_topology']('rack', doc)
            self.assertEqual(err.exception.status_code, 422)
            self.assertNotIn('topology', self.s['projects']['rack'])
            self.assertEqual(Path(self.s['DATA_FILE']).read_bytes(), before)

    def test_disk_failure_rolls_back(self):
        self.handlers()
        before = Path(self.s['DATA_FILE']).read_bytes()
        with patch.object(base.os, 'replace', side_effect=OSError('disk full')):
            with self.assertRaises(base.ApiError):
                self.s['put_project_topology']('rack', self.doc())
        self.assertNotIn('topology', self.s['projects']['rack'])
        self.assertEqual(Path(self.s['DATA_FILE']).read_bytes(), before)

    def test_concurrent_writers_only_one_commits(self):
        self.handlers()
        def write(_):
            try:
                return self.s['put_project_topology']('rack', self.doc())['revision']
            except base.ApiError as exc:
                return exc.status_code
        with base.ThreadPoolExecutor(max_workers=2) as pool:
            self.assertEqual(sorted(pool.map(write, range(2))), [1, 409])

    def test_project_rename_preserves_topology_and_unknown_fields(self):
        self.handlers()
        saved = self.s['put_project_topology']('rack', self.doc())
        self.s['projects']['rack']['level'] = 'rack'
        self.s['edit_project']('rack', SimpleNamespace(name='renamed', desc='new'))
        self.assertEqual(self.s['get_project_topology']('renamed'), saved)
        self.assertEqual(self.s['projects']['renamed']['level'], 'rack')

    def test_multiple_racks_and_credentials_are_not_stored(self):
        self.handlers()
        doc = self.doc()
        second = copy.deepcopy(doc['racks'][0]); second['id'] = 'rack2'; doc['racks'].append(second)
        doc['racks'][0]['devices'][0]['password'] = 'secret'
        result = self.s['put_project_topology']('rack', doc)
        self.assertNotIn('secret', json.dumps(result))
        self.assertEqual(len(result['racks']), 2)

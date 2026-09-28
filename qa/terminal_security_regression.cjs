// Execute the actual bridge with synthetic inventory and no sockets or SSH.
const fs = require('node:fs');
const vm = require('node:vm');
const assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
const source = fs.readFileSync('terminal_bridge/server.js', 'utf8');
const inventory = {machines: [{name: 'node', os_ip: '192.0.2.1', os_user: 'saved', os_pass: 'fixture-secret', os_port: 2222,
  bmc_ip: '192.0.2.2', bmc_user: 'bmc', bmc_pass: 'fixture-bmc', bmc_port: 623,
  os: [{ip: '192.0.2.3', user: 'slot', pass: 'fixture-slot', port: 2200}]}]};
const connects = [];
let connection;
class Client extends EventEmitter { connect(options) { connects.push(options); return this; } }
class WebSocketServer extends EventEmitter { on(event, handler) { if (event === 'connection') connection = handler; return super.on(event, handler); } }
const scope = {URL, console: {log(){}, error(){}}, process: {env: {}}, require(name) {
  if (name === 'http') return {createServer: () => ({listen(){}})};
  if (name === 'fs') return {readFileSync: () => JSON.stringify(inventory)};
  if (name === 'ws') return {WebSocketServer};
  if (name === 'ssh2') return {Client};
  if (name === 'path') return require('node:path');
  throw Error('Unexpected dependency');
}};
vm.runInNewContext(source, scope);
function request(kind = 'os', query = '', name = 'node') {
  connects.length = 0;
  const ws = new EventEmitter(); ws.OPEN = ws.readyState = 1; ws.messages = [];
  ws.send = text => ws.messages.push(JSON.parse(text)); ws.close = () => {};
  connection(ws, {url: `/ws/terminal/${name}/${kind}?${query}`});
  return {options: connects[0], ws};
}
function denied(query, kind = 'os', name = 'node') {
  const result = request(kind, query, name);
  assert.equal(result.options, undefined);
  assert.ok(result.ws.messages.some(m => m.type === 'error'));
  assert.ok(!JSON.stringify(result.ws.messages).includes('fixture-'));
}
for (const query of ['host=192.0.2.99', 'user=other', 'port=22', 'host=192.0.2.99&pass=****',
  'slot=2', 'slot=-1', 'slot=1.5', 'slot=abc', 'slot=', 'port=abc', 'port=0', 'port=65536']) denied(query);
denied('slot=1', 'bmc');
denied('host=192.0.2.99&user=manual&pass=****', 'os', 'missing');
denied('host=192.0.2.99&pass=explicit');
denied('user=manual&pass=explicit');
let result = request('os', 'host=192.0.2.1&user=saved&port=2222&pass=****');
assert.equal(result.options.password, 'fixture-secret');
assert.equal(result.options.host, '192.0.2.1');
assert.equal(result.options.port, 2222);
result = request('os', 'slot=1&host=192.0.2.3&user=slot&port=2200&pass=****');
assert.equal(result.options.password, 'fixture-slot');
denied('slot=1&host=192.0.2.1');
result = request('bmc', 'host=192.0.2.2&port=22&pass=****');
assert.equal(result.options.password, 'fixture-bmc'); assert.equal(result.options.port, 22);
inventory.machines[0].bmc_port = 2223;
assert.equal(request('bmc').options.port, 2223);
denied('port=22', 'bmc');
for (const name of ['node', 'missing']) {
  result = request('os', 'host=192.0.2.99&user=manual&pass=explicit&port=2224', name);
  assert.equal(result.options.host, '192.0.2.99');
  assert.equal(result.options.password, 'explicit');
  assert.equal(result.options.username, 'manual');
  assert.equal(result.options.port, 2224);
}
inventory.machines[0].os_ip = '192.0.2.10';
denied('host=192.0.2.1&pass=****');
assert.equal(request().options.host, '192.0.2.10');
console.log('PASS: actual Terminal handler target/user/port binding, OS slots, BMC ports, manual credentials and stale targets; no network');

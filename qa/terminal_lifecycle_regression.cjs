const fs = require('node:fs'), vm = require('node:vm'), assert = require('node:assert/strict');
const {EventEmitter} = require('node:events');
let connection;
const clients = [];
class Client extends EventEmitter {
  constructor() {super(); this.ended = false; this.shellCalls = 0; clients.push(this);}
  connect() {return this;}
  end() {this.ended = true;}
  shell(options, callback) {this.shellCalls++; this.callback = callback;}
}
class WebSocketServer {on(event, callback) {connection = callback;}}
const source = fs.readFileSync('terminal_bridge/server.js','utf8');
vm.runInNewContext(source, {URL, process:{env:{}}, console:{log(){},error(){}}, require(name) {
  if(name==='http') return {createServer:()=>({listen(){}})};
  if(name==='fs') return {readFileSync:()=>JSON.stringify({machines:{node:{os_ip:'192.0.2.1',os_user:'fixture',os_pass:'fixture'}}})};
  if(name==='path') return require('node:path');
  if(name==='ssh2') return {Client};
  if(name==='ws') return {WebSocketServer};
  throw Error(name);
}});
function socket(url) {
  clients.length=0;
  const ws=new EventEmitter(); ws.readyState=ws.OPEN=1; ws.messages=[];
  ws.send=msg=>ws.messages.push(JSON.parse(msg));
  ws.close=()=>{ws.readyState=3;ws.emit('close');};
  connection(ws,{url}); return ws;
}
function stream() {
  const s=new EventEmitter(); s.stderr=new EventEmitter(); s.ended=false;
  s.end=s.destroy=()=>{s.ended=true;}; return s;
}
assert.doesNotThrow(()=>socket('/ws/terminal/%ZZ/os'));
assert.equal(clients.length,0);
for (const broadcast of [false,true]) {
  for (const afterReady of [false,true]) {
    const ws=socket(broadcast?'/ws/broadcast':'/ws/terminal/node/os');
    if(broadcast) ws.emit('message',Buffer.from(JSON.stringify({targets:['node'],kind:'os'})));
    const c=clients[0]; assert.ok(c);
    if(afterReady) c.emit('ready');
    ws.close(); assert.ok(c.ended);
    if(afterReady) {const s=stream();c.callback(null,s);assert.ok(s.ended);}
    else {c.emit('ready');assert.equal(c.shellCalls,0);}
  }
  const ws=socket(broadcast?'/ws/broadcast':'/ws/terminal/node/os');
  if(broadcast) ws.emit('message',Buffer.from(JSON.stringify({targets:['node'],kind:'os'})));
  const c=clients[0]; c.emit('ready'); const s=stream(); c.callback(null,s);
  ws.close(); assert.ok(c.ended); assert.ok(s.ended);
}
const ws=socket('/ws/broadcast');
ws.emit('message',Buffer.from(JSON.stringify({targets:['node','node'],kind:'os'})));
assert.equal(clients.length,1);
clients[0].emit('error',Error('synthetic failure'));
clients[0].emit('error',Error('repeated failure'));
assert.ok(clients[0].ended);
console.log('PASS: malformed URL, single/broadcast close before ready/during shell/after connect, duplicate targets and repeated errors; no sockets');

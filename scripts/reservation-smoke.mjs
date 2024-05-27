// Real Spring Boot + Express flow, using an isolated temporary database.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {fileURLToPath} from 'node:url';
import {once} from 'node:events';
import {createApp} from '../gateway/app.js';
const scratch=await mkdtemp(join(tmpdir(),'retail-smoke-'));
const allocator=createServer();
await new Promise(r=>allocator.listen(0,'127.0.0.1',r));
const port=allocator.address().port;
await new Promise(r=>allocator.close(r));
const jar=fileURLToPath(new URL('../backend/target/inventory-1.0.0.jar',import.meta.url));
const java=process.env.JAVA_HOME?join(process.env.JAVA_HOME,'bin','java'):'java';
const child=spawn(java,['-jar',jar,`--server.port=${port}`,`--spring.datasource.url=jdbc:h2:file:${join(scratch,'inventory')}`],{stdio:['ignore','pipe','pipe']});
let logs='';child.stdout.on('data',chunk=>logs+=chunk);child.stderr.on('data',chunk=>logs+=chunk);
let startupError;child.on('error',error=>startupError=error);
let gateway;
try {
 const inventoryUrl=`http://127.0.0.1:${port}`;
 let ready=false;
 for(let i=0;i<100;i++) {
  if(startupError)throw startupError;
  if(child.exitCode!==null)throw new Error(`Java exited during startup: ${logs}`);
  try{const response=await fetch(inventoryUrl+'/api/products',{signal:AbortSignal.timeout(300)});if(response.ok){ready=true;break;}}catch{}
  await new Promise(r=>setTimeout(r,200));
 }
 assert.equal(ready,true,`Inventory startup timed out: ${logs}`);
 gateway=createServer(createApp({inventoryUrl}));await new Promise(r=>gateway.listen(0,'127.0.0.1',r));
 const url=`http://127.0.0.1:${gateway.address().port}`;
 const before=await (await fetch(url+'/api/catalog')).json();
 assert.equal(before[0].available,12);assert.equal(before[0].priceCents,1800);
 const reservation=await fetch(url+'/api/reservations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sku:'MUG',quantity:2})});
 assert.equal(reservation.status,201);assert.equal((await reservation.json()).quantity,2);
 const after=await (await fetch(url+'/api/catalog')).json();assert.equal(after[0].available,10);
 const rejected=await fetch(url+'/api/reservations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sku:'MUG',quantity:99})});assert.equal(rejected.status,409);
 assert.equal((await (await fetch(url+'/api/catalog')).json())[0].available,10);
 console.log('Real Java → Express catalog/reservation/conflict flow passed (7 assertions).');
} finally {
 if(gateway){gateway.closeAllConnections();await new Promise(r=>gateway.close(r));}
 if(child.exitCode===null&&!startupError){const exited=once(child,'exit');child.kill('SIGTERM');await exited;}
 await rm(scratch,{recursive:true,force:true});
}

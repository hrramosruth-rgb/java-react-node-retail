import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createApp} from './app.js';
import {createServer} from 'node:http';
async function listen(app) { const server=createServer(app); await new Promise(r=>server.listen(0,'127.0.0.1',r)); return {server,url:`http://127.0.0.1:${server.address().port}`}; }
async function fixture(t) {
 const upstream=await listen(async (req,res)=>{
  res.setHeader('content-type','application/json');
  if(req.url==='/api/products') return res.end(JSON.stringify([{sku:'MUG',name:'Ceramic mug',available:12}]));
  let body=''; for await (const c of req) body+=c;
  const input=JSON.parse(body);
  res.statusCode=input.sku==='UNKNOWN'?404:input.quantity>12?409:201;
  res.end(JSON.stringify(res.statusCode===201?{id:'reservation-1',...input}:{error:'Reservation rejected'}));
 });
 const gateway=await listen(createApp({inventoryUrl:upstream.url}));
 t.after(()=>{upstream.server.closeAllConnections();upstream.server.close();gateway.server.closeAllConnections();gateway.server.close();});
 return gateway.url;
}
const post=(url,body)=>fetch(url+'/api/reservations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(body)});
test('catalog aggregates stock with integer-cent pricing',async t=>{const url=await fixture(t);const res=await fetch(url+'/api/catalog');assert.equal(res.status,200);assert.deepEqual(await res.json(),[{sku:'MUG',name:'Ceramic mug',available:12,priceCents:1800,currency:'USD'}]);});
test('reservation forwards body and success status',async t=>{const url=await fixture(t);const res=await post(url,{sku:'MUG',quantity:2});assert.equal(res.status,201);assert.deepEqual(await res.json(),{id:'reservation-1',sku:'MUG',quantity:2});});
test('reservation preserves upstream stock conflict and missing product',async t=>{const url=await fixture(t);assert.equal((await post(url,{sku:'MUG',quantity:13})).status,409);assert.equal((await post(url,{sku:'UNKNOWN',quantity:1})).status,404);});
test('invalid quantities rejected at gateway',async t=>{const url=await fixture(t);for(const quantity of [0,-1,1.5,'2',101])assert.equal((await post(url,{sku:'MUG',quantity})).status,400);});
test('unavailable inventory returns actionable 502',async t=>{const g=await listen(createApp({inventoryUrl:'http://127.0.0.1:1'}));t.after(()=>{g.server.closeAllConnections();g.server.close();});const res=await fetch(g.url+'/api/catalog');assert.equal(res.status,502);assert.match((await res.json()).error,/inventory/i);});

import express from 'express';
const prices = {MUG: 1800, TOTE: 2400};
export function createApp({inventoryUrl='http://127.0.0.1:8080', timeoutMs=3000}={}) {
 const app=express();
 app.use(express.json({limit:'8kb'}));
 async function upstream(path,options={}) {
  const response=await fetch(new URL(path,inventoryUrl),{...options,signal:AbortSignal.timeout(timeoutMs)});
  return {status:response.status,body:await response.json()};
 }
 app.get('/api/catalog',async(req,res)=>{
  try {
   const result=await upstream('/api/products');
   if(result.status!==200 || !Array.isArray(result.body)) throw new Error('Invalid inventory response');
   res.json(result.body.map(p=>({...p,priceCents:prices[p.sku]??null,currency:'USD'})));
  } catch { res.status(502).json({error:'Inventory service unavailable. Please retry.'}); }
 });
 app.post('/api/reservations',async(req,res)=>{
  const {sku,quantity}=req.body??{};
  if(typeof sku!=='string'|| !/^[A-Z0-9-]{1,32}$/.test(sku)||!Number.isInteger(quantity)||quantity<1||quantity>100)
   return res.status(400).json({error:'Provide a valid SKU and an integer quantity from 1 to 100.'});
  try {
   const result=await upstream('/api/reservations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sku,quantity})});
   res.status(result.status).json(result.body);
  } catch { res.status(502).json({error:'Inventory service unavailable. Reservation outcome is unknown; refresh stock before retrying.'}); }
 });
 app.use((err,req,res,next)=>res.status(err.status===413?413:400).json({error:'Invalid JSON request or payload too large.'}));
 return app;
}

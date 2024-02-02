import React,{useState,useEffect,useRef} from 'react';
import './style.css';
async function request(path, options) {
 const response=await fetch(path,options);
 const body=await response.json();
 if(!response.ok) throw new Error(body.error??'Request failed. Please retry.');
 return body;
}
export default function App() {
 const [products,setProducts]=useState([]),[loading,setLoading]=useState(true),[error,setError]=useState(''),[message,setMessage]=useState(''),[busy,setBusy]=useState(false);
 const pending=useRef(false);
 async function load() {
  setLoading(true);setError('');
  try {setProducts(await request('/api/catalog'));}
  catch(e){setError(e.message||'Catalog unavailable.');}
  finally{setLoading(false);}
 }
 useEffect(()=>{load();},[]);
 async function reserve(event, product) {
  event.preventDefault();if(pending.current)return;
  const quantity=Number(new FormData(event.currentTarget).get('quantity'));
  if(!Number.isInteger(quantity)||quantity<1||quantity>100){setError('Choose a whole quantity from 1 to 100.');return;}
  pending.current=true;setBusy(true);setError('');setMessage('');
  try {
   const result=await request('/api/reservations',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({sku:product.sku,quantity})});
   setMessage(`Reservation ${result.id} confirmed for ${result.quantity} item(s).`);
   await load();
  } catch(e){setError(e.message||'Reservation failed. Refresh stock before retrying.');}
  finally{pending.current=false;setBusy(false);}
 }
 return <main>
  <header><p className="eyebrow">Independent retail demonstration</p><h1>Small Goods</h1><p>Thoughtful everyday essentials. Reserve inventory without payment.</p></header>
  {loading&&<p role="status">Loading inventory…</p>}
  {error&&<div role="alert"><p>{error}</p><button onClick={load} disabled={busy}>Retry catalog</button></div>}
  {message&&<p role="status" className="confirmation">{message}</p>}
  {!loading&&!error&&products.length===0&&<p>No products available.</p>}
  <section aria-label="Product catalog" className="catalog">
   {products.map(product=><article key={product.sku}>
    <div aria-hidden="true" className="illustration">{product.sku==='MUG'?'☕':'▱'}</div>
    <h2>{product.name}</h2><p>{product.priceCents===null?'Price unavailable':new Intl.NumberFormat('en-US',{style:'currency',currency:product.currency}).format(product.priceCents/100)}</p><p>{product.available} available</p>
    <form onSubmit={event=>reserve(event,product)}>
     <label htmlFor={`qty-${product.sku}`}>Quantity for {product.name}</label>
     <input id={`qty-${product.sku}`} name="quantity" type="number" min="1" max={Math.min(100,product.available)} step="1" defaultValue="1" required disabled={busy||loading||product.available===0}/>
     <button aria-label={`Reserve ${product.name}`} disabled={busy||loading||!!error||product.available===0}>{busy?'Reserving…':product.available===0?'Out of stock':'Reserve'}</button>
    </form>
   </article>)}
  </section><footer>Demo inventory persists locally. Reservations are final in this demo; no checkout, expiry, or customer account.</footer>
 </main>;
}

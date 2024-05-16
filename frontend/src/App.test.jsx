import React from 'react';
import {test,expect,afterEach,vi} from 'vitest';
import {render,screen,fireEvent,cleanup} from '@testing-library/react';
import App from './App.jsx';
afterEach(()=>{cleanup();vi.unstubAllGlobals();});
const product={sku:'MUG',name:'Ceramic mug',available:12,priceCents:1800,currency:'USD'};
test('catalog displays stock and purchase controls',async()=>{vi.stubGlobal('fetch',vi.fn().mockResolvedValue({ok:true,json:async()=>[product]}));render(<App/>);expect(await screen.findByText('Ceramic mug')).toBeTruthy();expect(screen.getByRole('button',{name:'Reserve Ceramic mug'}).disabled).toBe(false);});
test('successful reservation refreshes stock and announces confirmation',async()=>{const fetcher=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>[product]}).mockResolvedValueOnce({ok:true,json:async()=>({id:'abc',sku:'MUG',quantity:1})}).mockResolvedValueOnce({ok:true,json:async()=>[{...product,available:11}]});vi.stubGlobal('fetch',fetcher);render(<App/>);fireEvent.click(await screen.findByRole('button',{name:'Reserve Ceramic mug'}));expect(await screen.findByText(/Reservation abc confirmed/)).toBeTruthy();expect(await screen.findByText('11 available')).toBeTruthy();});
test('network failure shows error with retry action',async()=>{vi.stubGlobal('fetch',vi.fn().mockRejectedValue(new Error('offline')));render(<App/>);expect(await screen.findByRole('alert')).toBeTruthy();expect(screen.getByRole('button',{name:'Retry catalog'})).toBeTruthy();});

test('repeated clicks during an in-flight reservation create one request',async()=>{
 let resolve;const reservation=new Promise(r=>resolve=r);
 const fetcher=vi.fn().mockResolvedValueOnce({ok:true,json:async()=>[product]}).mockImplementationOnce(()=>reservation).mockResolvedValueOnce({ok:true,json:async()=>[{...product,available:11}]});
 vi.stubGlobal('fetch',fetcher);render(<App/>);const button=await screen.findByRole('button',{name:'Reserve Ceramic mug'});fireEvent.click(button);fireEvent.click(button);expect(button.disabled).toBe(true);
 resolve({ok:true,json:async()=>({id:'one',sku:'MUG',quantity:1})});expect(await screen.findByText(/Reservation one confirmed/)).toBeTruthy();expect(fetcher.mock.calls.filter(([url])=>url==='/api/reservations')).toHaveLength(1);
});
test('stock conflict is announced without a stale success confirmation',async()=>{
 vi.stubGlobal('fetch',vi.fn().mockResolvedValueOnce({ok:true,json:async()=>[product]}).mockResolvedValueOnce({ok:false,json:async()=>({error:'Insufficient stock.'})}));
 render(<App/>);fireEvent.click(await screen.findByRole('button',{name:'Reserve Ceramic mug'}));expect((await screen.findByRole('alert')).textContent).toContain('Insufficient stock');expect(screen.queryByText(/confirmed/)).toBeNull();
});

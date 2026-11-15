'use client';
import { useState } from 'react';
import { useParams } from 'next/navigation';
import { api,bdt,useApi } from '@/lib/api';
import { imgUrl } from '@/lib/img';
type Store={name:string;description?:string;phone?:string};
type P={productId:string;name:string;price:number;inStock:boolean;images?:string[]};
export default function Storefront(){
 const {slug}=useParams<{slug:string}>();const store=useApi<Store>(`/stores/${slug}`),prods=useApi<P[]>(`/stores/${slug}/products`);
 const [cart,setCart]=useState<Record<string,number>>({}),[done,setDone]=useState<{orderNo:string}|null>(null),[err,setErr]=useState(''),[busy,setBusy]=useState(false);
 const [idem]=useState(()=>crypto.randomUUID());
 const lines=Object.entries(cart).filter(([,q])=>q>0).map(([id,q])=>({p:prods.data!.find(x=>x.productId===id)!,q})),total=lines.reduce((a,l)=>a+l.p.price*l.q,0);
 async function order(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setErr('');setBusy(true);const f=new FormData(e.currentTarget);
  try{setDone(await api(`/stores/${slug}/orders`,{body:{items:lines.map(l=>({productId:l.p.productId,qty:l.q})),paymentMethod:'cod',idemKey:idem,
   customer:{name:f.get('name'),phone:f.get('phone'),address:f.get('address'),district:f.get('district')}}}));setCart({});}catch(x:any){setErr(x.message);}setBusy(false);}
 if(store.error)return <p className="p-10 text-center">Store not found.</p>;
 if(done)return <div className="card mx-auto mt-16 max-w-md text-center"><h1 className="text-xl font-semibold">Order placed ✓</h1><p className="mt-2">Order number: <b>{done.orderNo}</b></p><p className="text-sm text-slate-600">Pay cash on delivery. Track it at /track with your phone number.</p></div>;
 return <div className="mx-auto max-w-6xl p-5"><h1 className="text-2xl font-bold">{store.data?.name}</h1><p className="text-slate-600">{store.data?.description}</p>
  <div className="mt-6 grid gap-6 lg:grid-cols-3"><div className="grid gap-4 sm:grid-cols-2 lg:col-span-2">{prods.loading&&<p>Loading…</p>}{prods.data?.length===0&&<p className="text-slate-500">No products yet.</p>}
   {prods.data?.map(p=><div key={p.productId} className="card group overflow-hidden !p-0">
    <div className="relative aspect-square overflow-hidden bg-slate-100">{p.images?.[0]?<img src={imgUrl(p.images[0],600)} alt={p.name} loading="lazy" className="h-full w-full object-cover transition duration-300 group-hover:scale-105"/>:<div className="flex h-full items-center justify-center text-sm text-slate-400">No photo</div>}
     {!p.inStock&&<span className="absolute left-2 top-2 rounded bg-slate-800 px-2 py-0.5 text-xs text-white">Sold out</span>}</div>
    <div className="p-3"><h3 className="truncate font-medium">{p.name}</h3><p className="text-lg font-bold text-brand">{bdt(p.price)}</p><button className="btn mt-2 w-full" disabled={!p.inStock} onClick={()=>setCart(c=>({...c,[p.productId]:(c[p.productId]||0)+1}))}>{p.inStock?'Add to cart':'Out of stock'}</button></div></div>)}</div>
   <form onSubmit={order} className="card h-fit space-y-3"><h2 className="font-semibold">Your cart</h2>{lines.length===0&&<p className="text-sm text-slate-500">Cart is empty.</p>}
    {lines.map(l=><div key={l.p.productId} className="flex items-center justify-between text-sm"><span>{l.p.name}</span><span className="flex items-center gap-1">
     <button type="button" className="btn-ghost !px-2 !py-0" onClick={()=>setCart(c=>({...c,[l.p.productId]:l.q-1}))}>−</button>{l.q}
     <button type="button" className="btn-ghost !px-2 !py-0" onClick={()=>setCart(c=>({...c,[l.p.productId]:l.q+1}))}>+</button></span></div>)}
    <p className="font-semibold">Total: {bdt(total)}</p>
    <input name="name" required placeholder="Full name" className="input"/><input name="phone" required pattern="01[3-9]\d{8}" title="e.g. 01712345678" placeholder="Phone (01XXXXXXXXX)" className="input"/>
    <input name="district" required placeholder="District" className="input"/><textarea name="address" required minLength={5} placeholder="Delivery address" className="input"/>
    <p className="text-xs text-slate-500">Payment: Cash on delivery</p>{err&&<p role="alert" className="text-sm text-red-600">{err}</p>}
    <button className="btn w-full" disabled={busy||lines.length===0}>{busy?'Placing…':'Place order'}</button></form></div></div>;}

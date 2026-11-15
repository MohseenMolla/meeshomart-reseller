'use client';
import { useState } from 'react';
import { api,bdt,useApi } from '@/lib/api';
import { imgUrl } from '@/lib/img';
type Store={slug:string;name:string;description?:string}|null;
type Cat={images?:string[];_id:string;name:string;sku:string;retailPrice:number;wholesalePrice:number;stock:number};
type Mine={productId:{_id:string;name:string};price:number;expectedProfit:number};
export default function StorePage(){
 const store=useApi<Store>('/stores/me'),cat=useApi<Cat[]>('/products/wholesale'),mine=useApi<Mine[]>('/stores/me/products');const [msg,setMsg]=useState('');
 async function save(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);
  try{await api('/stores/me',{method:'PUT',body:{slug:String(f.get('slug')).toLowerCase(),name:f.get('name'),description:f.get('description')||undefined}});setMsg('Store saved.');store.reload();}catch(x:any){setMsg(x.message);}}
 async function add(p:Cat,price:number){try{await api(`/stores/me/products/${p._id}`,{method:'PUT',body:{price}});setMsg(`Added ${p.name}`);mine.reload();}catch(x:any){setMsg(x.message);}}
 async function remove(id:string){await api(`/stores/me/products/${id}`,{method:'DELETE'});mine.reload();}
 return <div className="space-y-6"><h1 className="text-xl font-semibold">Store & products</h1>{msg&&<p role="status" className="text-sm text-brand">{msg}</p>}
  <form onSubmit={save} key={store.data?.slug||'new'} className="card grid gap-3 sm:grid-cols-2"><input name="name" required defaultValue={store.data?.name} placeholder="Store name" className="input"/>
   <input name="slug" required defaultValue={store.data?.slug} placeholder="store-link (e.g. my-shop)" className="input"/>
   <textarea name="description" defaultValue={store.data?.description} placeholder="Description" className="input sm:col-span-2"/><button className="btn sm:w-40">Save store</button>
   {store.data?.slug&&<a className="text-sm text-brand underline" href={`/store/${store.data.slug}`} target="_blank">Open store ↗</a>}</form>
  <div className="card"><h2 className="mb-2 font-medium">In your store</h2>{mine.data?.length===0&&<p className="text-sm text-slate-500">No products yet. Add some below.</p>}
   {mine.data?.map(m=><div key={m.productId._id} className="flex items-center justify-between border-t py-2 text-sm"><span>{m.productId.name} · {bdt(m.price)} (profit {bdt(m.expectedProfit)})</span>
    <button className="btn-ghost" onClick={()=>remove(m.productId._id)}>Remove</button></div>)}</div>
  <div className="card"><h2 className="mb-2 font-medium">Catalog</h2>{cat.data?.length===0&&<p className="text-sm text-slate-500">No catalog products.</p>}
   {cat.data?.map(p=><form key={p._id} className="grid items-center gap-2 border-t py-2 text-sm sm:grid-cols-5" onSubmit={e=>{e.preventDefault();add(p,Number(new FormData(e.currentTarget).get('price')));}}>
    <span className="flex items-center gap-3 sm:col-span-2">{p.images?.[0]?<img src={imgUrl(p.images[0],120)} alt="" loading="lazy" className="h-14 w-14 rounded-lg object-cover"/>:<span className="h-14 w-14 rounded-lg bg-slate-100"/>}<span>{p.name}<br/><span className="text-slate-500">{p.sku} · stock {p.stock}</span></span></span><span>Wholesale {bdt(p.wholesalePrice)}<br/>Retail {bdt(p.retailPrice)}</span>
    <input name="price" type="number" required defaultValue={p.retailPrice} className="input"/><button className="btn">Add</button></form>)}</div></div>;}

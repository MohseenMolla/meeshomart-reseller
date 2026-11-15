'use client';
import { useState } from 'react';
import { api,bdt,useApi } from '@/lib/api';
type P={_id:string;name:string;priceBDT:number;durationDays:number;lifetime:boolean;active:boolean};
export default function Plans(){
 const {data,reload}=useApi<P[]>('/subscriptions/plans');const [msg,setMsg]=useState('');
 async function create(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);const form=e.currentTarget;
  try{await api('/subscriptions/plans',{body:{name:f.get('name'),priceBDT:Number(f.get('price')),durationDays:Number(f.get('days')),lifetime:f.get('lifetime')==='on',active:true}});form.reset();setMsg('Plan created');reload();}catch(x:any){setMsg(x.message);}}
 async function archive(id:string){if(!confirm('Archive this plan? Existing subscribers keep their access.'))return;try{await api(`/admin/plans/${id}`,{method:'PUT',body:{active:false}});reload();}catch(x:any){setMsg(x.message);}}
 return <div className="space-y-6"><h1 className="text-xl font-semibold">Subscription plans</h1>{msg&&<p role="status" className="text-sm text-brand">{msg}</p>}
  <form onSubmit={create} className="card grid gap-3 sm:grid-cols-5"><input name="name" required placeholder="Name" className="input"/><input name="price" type="number" min={0} required placeholder="Price (BDT)" className="input"/>
   <input name="days" type="number" min={1} required placeholder="Duration (days)" className="input"/><label className="flex items-center gap-2 text-sm"><input name="lifetime" type="checkbox"/> Lifetime</label><button className="btn">Create</button></form>
  <div className="card">{data?.length===0&&<p className="text-sm text-slate-500">No active plans. Create one so sellers can activate.</p>}
   {data?.map(p=><div key={p._id} className="flex items-center justify-between border-t py-2 text-sm first:border-0"><span>{p.name} · {bdt(p.priceBDT)} · {p.lifetime?'lifetime':`${p.durationDays} days`}</span><button className="btn-ghost" onClick={()=>archive(p._id)}>Archive</button></div>)}</div></div>;}

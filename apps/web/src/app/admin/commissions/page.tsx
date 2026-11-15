'use client';
import { useState } from 'react';
import { api,bdt,useApi } from '@/lib/api';
type C={_id:string;sellerId:string;amount:number;createdAt:string};
export default function Commissions(){
 const {data,loading,reload}=useApi<C[]>('/admin/commissions');const [msg,setMsg]=useState('');
 async function approve(id:string){try{await api(`/admin/commissions/${id}/approve`,{body:{}});setMsg('Approved');reload();}catch(e:any){setMsg(e.message);}}
 return <div><h1 className="mb-4 text-xl font-semibold">Referral commissions awaiting approval</h1>{msg&&<p role="status" className="mb-2 text-sm text-brand">{msg}</p>}
  {loading&&<p>Loading…</p>}{data?.length===0&&<p className="text-slate-500">Nothing pending.</p>}
  <div className="space-y-3">{data?.map(c=><div key={c._id} className="card flex items-center justify-between"><span>{bdt(c.amount)} <span className="text-xs text-slate-400">· seller {c.sellerId.slice(-6)} · {new Date(c.createdAt).toLocaleDateString()}</span></span>
   <button className="btn" onClick={()=>approve(c._id)}>Approve</button></div>)}</div></div>;}

'use client';
import { api,bdt,useApi } from '@/lib/api';
type Plan={_id:string;name:string;priceBDT:number;durationDays:number;lifetime:boolean};
export default function Renew(){
 const {data}=useApi<Plan[]>('/subscriptions/plans');
 async function pay(id:string){try{const d=await api<{gatewayUrl:string}>('/payments/checkout',{body:{planId:id}});window.location.href=d.gatewayUrl;}catch(e:any){alert(e.message);}}
 return <div><h1 className="mb-1 text-xl font-semibold">Renew or change plan</h1><p className="mb-4 text-sm text-slate-600">Renewing early adds time to your current end date.</p>
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">{data?.map(p=><div key={p._id} className="card"><h3 className="font-semibold">{p.name}</h3><p className="my-2 text-2xl font-bold">{bdt(p.priceBDT)}</p>
   <p className="mb-3 text-sm text-slate-500">{p.lifetime?'Lifetime':`${p.durationDays} days`}</p><button className="btn w-full" onClick={()=>pay(p._id)}>Pay securely</button></div>)}</div></div>;}

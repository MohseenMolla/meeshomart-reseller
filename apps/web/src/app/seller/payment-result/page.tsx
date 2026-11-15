'use client';
import { Suspense,useEffect,useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
function Inner(){
 const tran=useSearchParams().get('tran');const [st,setSt]=useState('checking');
 useEffect(()=>{let n=0;const t=setInterval(async()=>{try{const d=await api<{status:string}>(`/payments/status/${tran}`);setSt(d.status);if(d.status!=='pending'||++n>10)clearInterval(t);}catch{setSt('error');clearInterval(t);}},2000);return()=>clearInterval(t);},[tran]);
 return <div className="card mx-auto mt-20 max-w-md text-center"><h1 className="text-xl font-semibold">{st==='paid'?'Payment verified ✓':st==='failed'||st==='cancelled'?'Payment not completed':'Verifying payment…'}</h1>
  <p className="mt-2 text-sm text-slate-600">{st==='paid'?'Your account is active.':st==='needs_reconcile'?'Payment received; activation is being finalised. Contact support if this persists.':'This is confirmed with the payment gateway, not your browser.'}</p>
  <Link className="btn mt-4" href="/seller">Go to dashboard</Link></div>;}
export default function Page(){return <Suspense><Inner/></Suspense>;}

'use client';
import { useState } from 'react';
import { api } from '@/lib/api';
export default function VerifyEmail({email,onDone}:{email:string;onDone:()=>void}){
 const [msg,setMsg]=useState<{ok:boolean;t:string}|null>(null),[busy,setBusy]=useState(false);
 async function submit(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setBusy(true);setMsg(null);
  try{await api('/auth/verify-email',{body:{email,code:String(new FormData(e.currentTarget).get('code')).trim()}});onDone();}catch(x:any){setMsg({ok:false,t:x.message});}setBusy(false);}
 async function resend(){setMsg(null);try{await api('/auth/resend-otp',{body:{email}});setMsg({ok:true,t:'A new code has been sent.'});}catch(x:any){setMsg({ok:false,t:x.message});}}
 return <form onSubmit={submit} className="card mx-auto max-w-sm space-y-3"><h2 className="text-lg font-semibold">Verify your email</h2>
  <p className="text-sm text-slate-600">We sent a 6-digit code to <b>{email}</b>. It expires in 10 minutes.</p>
  <input name="code" inputMode="numeric" pattern="\d{6}" maxLength={6} required autoComplete="one-time-code" placeholder="123456" className="input text-center text-xl tracking-[0.5em]"/>
  {msg&&<p role="alert" className={`text-sm ${msg.ok?'text-teal-700':'text-red-600'}`}>{msg.t}</p>}
  <button className="btn w-full" disabled={busy}>{busy?'Checking…':'Verify'}</button><button type="button" onClick={resend} className="w-full text-sm text-brand underline">Send a new code</button></form>;}

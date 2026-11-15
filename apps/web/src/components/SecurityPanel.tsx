'use client';
import { useState } from 'react';
import { api,useApi } from '@/lib/api';
type Me={email:string;twoFactor:boolean};type Sess={id:string;current:boolean;userAgent?:string;ip?:string;createdAt:string;lastSeenAt?:string};
const Note=({m}:{m:{ok:boolean;t:string}|null})=>m?<p role="status" className={`text-sm ${m.ok?'text-teal-700':'text-red-600'}`}>{m.t}</p>:null;
export default function SecurityPanel(){
 const me=useApi<Me>('/auth/me'),ses=useApi<Sess[]>('/auth/sessions');
 const [pw,setPw]=useState<{ok:boolean;t:string}|null>(null),[tf,setTf]=useState<{ok:boolean;t:string}|null>(null),[setup,setSetup]=useState<{qr:string;secret:string}|null>(null),[codes,setCodes]=useState<string[]|null>(null);
 async function change(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget),form=e.currentTarget;setPw(null);
  if(f.get('password')!==f.get('confirm'))return setPw({ok:false,t:'Passwords do not match'});
  try{await api('/auth/change-password',{body:{current:f.get('current'),password:f.get('password')}});form.reset();setPw({ok:true,t:'Password changed. Other devices were signed out.'});ses.reload();}catch(x:any){setPw({ok:false,t:x.message});}}
 async function start(){setTf(null);try{setSetup(await api('/auth/2fa/setup',{method:'POST',body:{}}));}catch(x:any){setTf({ok:false,t:x.message});}}
 async function enable(e:React.FormEvent<HTMLFormElement>){e.preventDefault();setTf(null);
  try{const d=await api<{recoveryCodes:string[]}>('/auth/2fa/enable',{body:{code:String(new FormData(e.currentTarget).get('code'))}});setCodes(d.recoveryCodes);setSetup(null);me.reload();}catch(x:any){setTf({ok:false,t:x.message});}}
 async function disable(e:React.FormEvent<HTMLFormElement>){e.preventDefault();const f=new FormData(e.currentTarget);setTf(null);
  try{await api('/auth/2fa/disable',{body:{password:f.get('password'),code:f.get('code')}});setTf({ok:true,t:'Two-factor authentication turned off.'});me.reload();}catch(x:any){setTf({ok:false,t:x.message});}}
 async function revoke(id:string){await api(`/auth/sessions/${id}`,{method:'DELETE'});ses.reload();}
 async function revokeOthers(){await api('/auth/sessions/revoke-others',{method:'POST',body:{}});ses.reload();}
 return <div className="mx-auto max-w-2xl space-y-6"><h1 className="text-xl font-semibold">Security</h1>
  <form onSubmit={change} className="card space-y-3"><h2 className="font-medium">Change password</h2><input name="current" type="password" required placeholder="Current password" className="input"/>
   <div className="grid gap-3 sm:grid-cols-2"><input name="password" type="password" minLength={8} required placeholder="New password" className="input"/><input name="confirm" type="password" required placeholder="Confirm new password" className="input"/></div>
   <Note m={pw}/><button className="btn">Update password</button></form>
  <div className="card space-y-3"><div className="flex items-center justify-between"><h2 className="font-medium">Two-factor authentication</h2>
   <span className={`rounded-full px-2 py-0.5 text-xs ${me.data?.twoFactor?'bg-teal-100 text-teal-800':'bg-slate-100 text-slate-600'}`}>{me.data?.twoFactor?'On':'Off'}</span></div>
   {codes&&<div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"><p className="font-medium">Save these recovery codes now. They are shown only once.</p>
    <p className="mt-1 text-slate-600">Each works one time if you lose your phone.</p><ul className="mt-2 grid grid-cols-2 gap-1 font-mono">{codes.map(c=><li key={c}>{c}</li>)}</ul>
    <button className="btn-ghost mt-3" onClick={()=>setCodes(null)}>I have saved them</button></div>}
   {!me.data?.twoFactor&&!setup&&!codes&&<><p className="text-sm text-slate-600">Protect your account with a code from an authenticator app (Google Authenticator, Authy, etc.).</p><button className="btn" onClick={start}>Set up</button></>}
   {setup&&<form onSubmit={enable} className="space-y-3"><p className="text-sm text-slate-600">Scan with your authenticator app, then enter the 6-digit code.</p>
    <img src={setup.qr} alt="Two-factor QR code" className="h-44 w-44 rounded-lg border"/><p className="break-all text-xs text-slate-500">Manual key: <code>{setup.secret}</code></p>
    <input name="code" required inputMode="numeric" maxLength={6} placeholder="123456" className="input max-w-40"/><button className="btn ml-2">Turn on</button></form>}
   {me.data?.twoFactor&&!codes&&<form onSubmit={disable} className="grid gap-3 sm:grid-cols-3"><input name="password" type="password" required placeholder="Password" className="input"/>
    <input name="code" required placeholder="Code or recovery code" className="input"/><button className="btn-ghost">Turn off</button></form>}<Note m={tf}/></div>
  <div className="card"><div className="mb-2 flex items-center justify-between"><h2 className="font-medium">Active sessions</h2><button className="btn-ghost" onClick={revokeOthers}>Sign out other devices</button></div>
   {ses.data?.map(s=><div key={s.id} className="flex items-center justify-between gap-3 border-t py-2 text-sm"><div className="min-w-0"><p className="truncate">{s.userAgent||'Unknown device'}{s.current&&<span className="ml-2 rounded bg-teal-100 px-1.5 text-xs text-teal-800">This device</span>}</p>
    <p className="text-xs text-slate-500">{s.ip} · signed in {new Date(s.createdAt).toLocaleString()}</p></div>{!s.current&&<button className="btn-ghost shrink-0" onClick={()=>revoke(s.id)}>Sign out</button>}</div>)}</div></div>;}

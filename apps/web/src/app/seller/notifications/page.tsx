'use client';
import { api,useApi } from '@/lib/api';
type N={_id:string;title:string;body:string;createdAt:string;readAt?:string};
export default function Notifications(){
 const {data,loading,reload}=useApi<{items:N[];unread:number}>('/notifications');
 return <div><div className="mb-4 flex items-center justify-between"><h1 className="text-xl font-semibold">Notifications{data?.unread?` (${data.unread})`:''}</h1>
  <button className="btn-ghost" onClick={async()=>{await api('/notifications/read-all',{method:'POST',body:{}});reload();}}>Mark all read</button></div>
  {loading&&<p>Loading…</p>}{data?.items.length===0&&<p className="text-slate-500">Nothing yet.</p>}
  <div className="space-y-2">{data?.items.map(n=><div key={n._id} className={`card ${n.readAt?'opacity-70':'border-brand'}`}><p className="font-medium">{n.title}</p>
   <p className="text-sm text-slate-600">{n.body}</p><p className="mt-1 text-xs text-slate-400">{new Date(n.createdAt).toLocaleString()}</p></div>)}</div></div>;}

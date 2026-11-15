import IORedis from 'ioredis';
import { Queue,Worker } from 'bullmq';
import { runSubscriptionSweep,runReconciliation } from './services/jobs';
const handlers:Record<string,()=>Promise<unknown>>={'subscription-sweep':()=>runSubscriptionSweep(),'reconcile-payments':()=>runReconciliation()};
const schedule:[string,string,number][]=[['subscription-sweep','0 * * * *',3600e3],['reconcile-payments','*/10 * * * *',600e3]];
/** BullMQ when REDIS_URL is set (multi-instance safe, retries). Otherwise single-process timers, fine for one small server. */
export async function startScheduler(){
 const url=process.env.REDIS_URL;
 if(!url){console.warn('REDIS_URL not set: using in-process timers');
  for(const [n,,ms] of schedule)setInterval(()=>handlers[n]().catch(e=>console.error(n,e)),ms).unref();return;}
 const connection=new IORedis(url,{maxRetriesPerRequest:null});const queue=new Queue('maintenance',{connection});
 for(const [n,pattern] of schedule)await queue.upsertJobScheduler(n,{pattern},{name:n});
 new Worker('maintenance',async job=>handlers[job.name]?.(),{connection,concurrency:1}).on('failed',(j,e)=>console.error('job failed',j?.name,e));}

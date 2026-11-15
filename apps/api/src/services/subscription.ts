import { addDays } from '../utils';
export const GRACE_DAYS=+(process.env.GRACE_DAYS||3);
export const REMIND_DAYS=3;
/** Renewal extends from the current end date if still running, so early renewals lose no paid time. */
export function computeNewExpiry(currentEnd:Date|undefined|null,now:Date,plan:{lifetime?:boolean|null;durationDays?:number|null}):Date|undefined{
 if(plan.lifetime)return undefined;
 const base=currentEnd&&currentEnd>now?currentEnd:now;return addDays(base,plan.durationDays!);}
export type SubState='lifetime'|'ok'|'remind'|'grace'|'expired';
export function classify(endsAt:Date|undefined|null,now:Date,grace=GRACE_DAYS):SubState{
 if(!endsAt)return 'lifetime';
 if(endsAt>now)return endsAt<=addDays(now,REMIND_DAYS)?'remind':'ok';
 return now<=addDays(endsAt,grace)?'grace':'expired';}

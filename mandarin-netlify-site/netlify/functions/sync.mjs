import {getStore} from "@netlify/blobs";
import {verify} from "./_auth.mjs";
const isObj=v=>v&&typeof v==="object"&&!Array.isArray(v);
const idOf=x=>isObj(x)&&x.id!=null?"i"+x.id:JSON.stringify(x);
function merge(a,b,ta,tb){            // a = stored, b = incoming; ta/tb = last-changed times of this key
  if(a===undefined) return b; if(b===undefined) return a;
  if(Array.isArray(a)&&Array.isArray(b)){ const m=new Map(); [...a,...b].forEach(x=>m.set(idOf(x),x)); const out=[...m.values()]; if(out.every(x=>isObj(x)&&x.ts)) out.sort((p,q)=>p.ts-q.ts); return out; }
  if(typeof a==="number"&&typeof b==="number") return Math.max(a,b);
  if(isObj(a)&&isObj(b)){ const o={}; for(const k of new Set([...Object.keys(a),...Object.keys(b)])) o[k]=merge(a[k],b[k],ta,tb); return o; }
  return (tb||0)>=(ta||0)?b:a;
}
export default async(req)=>{
  if(req.method!=="POST") return new Response("POST only",{status:405});
  let u; try{ u=await verify(req); }catch(r){ return r; }
  const txt=await req.text(); if(txt.length>1_500_000) return new Response("too large",{status:413});
  let body; try{ body=JSON.parse(txt); }catch{ return new Response("bad json",{status:400}); }
  const store=getStore("students"); const cur=(await store.get(u.sub,{type:"json"}))||{keys:{},t:{}};
  const keys={...cur.keys}, t={...cur.t};
  for(const k of Object.keys(body.keys||{})){
    if(!k.startsWith("m8.")||k.startsWith("m8.__")) continue;
    keys[k]=merge(cur.keys[k],body.keys[k],cur.t[k],(body.t||{})[k]);
    t[k]=Math.max(cur.t[k]||0,(body.t||{})[k]||0)||Date.now();
  }
  const saved={sub:u.sub,email:u.email,name:(keys["m8.profile"]&&keys["m8.profile"].name)||body.name||u.name,keys,t,updated:Date.now()};
  await store.setJSON(u.sub,saved);
  return Response.json({keys,t});
};
export const config={path:"/api/sync"};

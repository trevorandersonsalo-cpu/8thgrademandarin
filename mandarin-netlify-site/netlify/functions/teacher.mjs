import {getStore} from "@netlify/blobs";
import {verify} from "./_auth.mjs";
export default async(req)=>{
  let u; try{ u=await verify(req); }catch(r){ return r; }
  if(!u.isTeacher) return new Response("teachers only",{status:403});
  const store=getStore("students"); const {blobs}=await store.list();
  const rows=(await Promise.all(blobs.map(b=>store.get(b.key,{type:"json"})))).filter(Boolean).map(s=>({
    sub:s.sub,email:s.email,name:s.name,updated:s.updated,
    profile:s.keys["m8.profile"]||null,rounds:s.keys["m8.rounds"]||[],reviews:s.keys["m8.reviews"]||[],
    hw:s.keys["m8.hw.local-student"]||{},xpx:s.keys["m8.xpx.local-student"]||0}));
  return Response.json({students:rows});
};
export const config={path:"/api/teacher"};

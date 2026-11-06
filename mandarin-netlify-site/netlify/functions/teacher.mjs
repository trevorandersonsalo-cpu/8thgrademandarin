import {getStore} from "@netlify/blobs";
import {verify} from "./_auth.mjs";
const cfgStore=()=>getStore("admin");
const loadCfg=async()=>{ const c=(await cfgStore().get("config",{type:"json"}))||{}; return {sections:c.sections||[],assign:c.assign||{}}; };
const rid=()=>Math.random().toString(36).slice(2,8);
const emails=a=>[...new Set((a||[]).map(e=>String(e).trim().toLowerCase()).filter(e=>/^[^@\s]+@[^@\s]+$/.test(e)))];
export default async(req)=>{
  let u; try{ u=await verify(req); }catch(r){ return r; }
  const cfg=await loadCfg(), admin=u.isTeacher;
  const mine=cfg.sections.filter(s=>(s.teachers||[]).includes(u.email));
  if(!admin&&!mine.length) return new Response("not a teacher",{status:403});

  if(req.method==="POST"){
    if(!admin) return new Response("admin only",{status:403});
    let b; try{ b=await req.json(); }catch{ return new Response("bad json",{status:400}); }
    const sec=id=>cfg.sections.find(s=>s.id===id);
    if(b.action==="createSection"){ const n=String(b.name||"").trim().slice(0,60); if(!n) return new Response("name",{status:400}); cfg.sections.push({id:rid(),name:n,teachers:emails(b.teachers)}); }
    else if(b.action==="updateSection"){ const s=sec(b.id); if(!s) return new Response("nf",{status:404}); if(b.name!=null) s.name=String(b.name).trim().slice(0,60)||s.name; if(b.teachers!=null) s.teachers=emails(b.teachers); }
    else if(b.action==="deleteSection"){ cfg.sections=cfg.sections.filter(s=>s.id!==b.id); for(const k of Object.keys(cfg.assign)) if(cfg.assign[k]===b.id) delete cfg.assign[k]; }
    else if(b.action==="assign"){ if(b.sectionId&&!sec(b.sectionId)) return new Response("nf",{status:404}); for(const sub of (b.subs||[]).slice(0,500)){ if(b.sectionId) cfg.assign[sub]=b.sectionId; else delete cfg.assign[sub]; } }
    else return new Response("unknown action",{status:400});
    await cfgStore().setJSON("config",cfg);
  }

  const visible=admin?cfg.sections:mine, ids=new Set(visible.map(s=>s.id));
  const store=getStore("students"); const {blobs}=await store.list();
  let rows=(await Promise.all(blobs.map(b=>store.get(b.key,{type:"json"})))).filter(Boolean).map(s=>({
    sub:s.sub,email:s.email,name:s.name,updated:s.updated,section:cfg.assign[s.sub]||null,
    profile:s.keys["m8.profile"]||null,rounds:s.keys["m8.rounds"]||[],reviews:s.keys["m8.reviews"]||[]}));
  if(!admin) rows=rows.filter(r=>r.section&&ids.has(r.section));
  return Response.json({me:{email:u.email,admin},sections:visible.map(s=>admin?s:{id:s.id,name:s.name}),students:rows});
};
export const config={path:"/api/teacher"};

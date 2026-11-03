// Verifies a Google ID token and returns the user, or throws a Response.
export async function verify(req){
  const h=req.headers.get("authorization")||""; const tok=h.startsWith("Bearer ")?h.slice(7):"";
  if(!tok) throw new Response("no token",{status:401});
  const r=await fetch("https://oauth2.googleapis.com/tokeninfo?id_token="+encodeURIComponent(tok));
  if(!r.ok) throw new Response("bad token",{status:401});
  const j=await r.json();
  if(j.aud!==process.env.GOOGLE_CLIENT_ID) throw new Response("wrong audience",{status:401});
  if(!["accounts.google.com","https://accounts.google.com"].includes(j.iss)) throw new Response("bad issuer",{status:401});
  if(Number(j.exp)*1000<Date.now()) throw new Response("expired",{status:401});
  const email=String(j.email||"").toLowerCase();
  if(j.email_verified!=="true"&&j.email_verified!==true) throw new Response("unverified",{status:403});
  const doms=(process.env.ALLOWED_DOMAINS||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
  const teachers=(process.env.TEACHER_EMAILS||"").split(",").map(s=>s.trim().toLowerCase()).filter(Boolean);
  const isTeacher=teachers.includes(email);
  if(doms.length&&!doms.some(d=>email.endsWith("@"+d))&&!isTeacher) throw new Response("domain not allowed",{status:403});
  return {sub:j.sub,email,name:j.given_name||j.name||"",isTeacher};
}

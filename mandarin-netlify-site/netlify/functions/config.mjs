export default async()=>Response.json({clientId:process.env.GOOGLE_CLIENT_ID||"",domain:(process.env.ALLOWED_DOMAINS||"").split(",")[0].trim()||""});
export const config={path:"/api/config"};

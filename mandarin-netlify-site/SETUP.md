# Mandarin Practice on Netlify — setup (about 20 minutes)

What you get: students sign in with their school Google account; progress saves to their account and follows them across Chromebooks, iPads, laptops and phones. You get a teacher dashboard at `/teacher.html`.

## 1. Create a Google sign-in ID (free)
1. Go to console.cloud.google.com, create a project (e.g. "Mandarin Practice").
2. APIs & Services → OAuth consent screen → choose **Internal** if your school uses Google Workspace (only school accounts can sign in), fill in the app name and your email.
3. Credentials → Create credentials → **OAuth client ID** → Web application.
4. Under **Authorized JavaScript origins** add your Netlify address (e.g. `https://your-site.netlify.app`) and, if you use one, your custom domain. No redirect URI is needed.
5. Copy the **Client ID**.

## 2. Deploy to Netlify
1. Put this `netlify-site` folder in a Git repo and connect it in Netlify (Add new site → Import from Git). Netlify reads `netlify.toml` and installs the one dependency. (Drag-and-drop deploys do not build functions, so use Git or the Netlify CLI: `netlify deploy --prod`.)
2. Site settings → Environment variables, add:
   - `GOOGLE_CLIENT_ID` = the ID from step 1
   - `ALLOWED_DOMAINS` = `prospectschools.org` (comma-separate more; students outside these domains are refused)
   - `TEACHER_EMAILS` = your email (comma-separate co-teachers)
3. Redeploy. Share the site address in Google Classroom. Open `/teacher.html` yourself.

## How it behaves
- Data is stored per student in Netlify Blobs: name, school email, progress, handwriting, speaking self-ratings. Nothing else.
- Saves happen automatically a few seconds after each change. If a device is offline, progress is kept on the device and syncs when it reconnects.
- Two devices for one student merge (rounds are combined, never overwritten).
- A different student signing in on the same Chromebook starts clean; the previous student's data is cleared from that device (it stays on the server). "Sign out" also clears the device.
- "Continue without saving" lets a student try the app with no account; that progress stays on the device only.
- Only emails in `TEACHER_EMAILS` can read class data.

## Privacy checklist before students use it
- Confirm with Prospect's tech/privacy lead that storing student names and emails in Netlify is approved (FERPA/COPPA).
- To delete a student's data, delete their entry in Netlify → Blobs → `students`.

import{c as p,r as a,j as e,T as _,b as S,d as P,L as z}from"./index-BHa0aFkY.js";import{s as l}from"./storageService-D-dCn0uW.js";import{C,S as E,E as L}from"./shield-Cli23yUn.js";import{C as A}from"./copy-Bhepn7gX.js";import{A as D}from"./arrow-left-kUlVTMWl.js";/**
 * @license lucide-react v0.555.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const M=[["path",{d:"M10.733 5.076a10.744 10.744 0 0 1 11.205 6.575 1 1 0 0 1 0 .696 10.747 10.747 0 0 1-1.444 2.49",key:"ct8e1f"}],["path",{d:"M14.084 14.158a3 3 0 0 1-4.242-4.242",key:"151rxh"}],["path",{d:"M17.479 17.499a10.75 10.75 0 0 1-15.417-5.151 1 1 0 0 1 0-.696 10.75 10.75 0 0 1 4.446-5.143",key:"13bj9a"}],["path",{d:"m2 2 20 20",key:"1ooewy"}]],I=p("eye-off",M);/**
 * @license lucide-react v0.555.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const R=[["rect",{width:"18",height:"11",x:"3",y:"11",rx:"2",ry:"2",key:"1w4ew1"}],["path",{d:"M7 11V7a5 5 0 0 1 10 0v4",key:"fwvmzm"}]],T=p("lock",R);/**
 * @license lucide-react v0.555.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const $=[["path",{d:"M3 12a9 9 0 0 1 9-9 9.75 9.75 0 0 1 6.74 2.74L21 8",key:"v9h5vc"}],["path",{d:"M21 3v5h-5",key:"1q7to0"}],["path",{d:"M21 12a9 9 0 0 1-9 9 9.75 9.75 0 0 1-6.74-2.74L3 16",key:"3uifl3"}],["path",{d:"M8 16H3v5",key:"1cv678"}]],w=p("refresh-cw",$);/**
 * @license lucide-react v0.555.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const Q=[["path",{d:"M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2",key:"975kel"}],["circle",{cx:"12",cy:"7",r:"4",key:"17ys0d"}]],q=p("user",Q),F=({errorDetails:i})=>{const[u,r]=a.useState(!1),c=`-- Create tables in Supabase SQL Editor
create table if not exists news_layout_templates (
  template_id text primary key,
  name text,
  grid_columns int default 12,
  blocks jsonb,
  meta jsonb
);

create table if not exists news_items (
  id text primary key,
  template_id text references news_layout_templates(template_id),
  blocks jsonb,
  author text,
  tags text[],
  created_at timestamptz,
  updated_at timestamptz,
  published_at timestamptz,
  status text,
  rejection_reason text,
  approved_by text,
  meta jsonb
);

create table if not exists news_admins (
  id text primary key,
  email text,
  password_hash text,
  name text
);

-- Reset and Enable public access policies (Safe re-run)
alter table news_layout_templates enable row level security;
alter table news_items enable row level security;
alter table news_admins enable row level security;

drop policy if exists "Public access" on news_layout_templates;
create policy "Public access" on news_layout_templates for all using (true) with check (true);

drop policy if exists "Public access" on news_items;
create policy "Public access" on news_items for all using (true) with check (true);

drop policy if exists "Public access" on news_admins;
create policy "Public access" on news_admins for all using (true) with check (true);

-- Insert Demo Admin (Required for login)
insert into news_admins (id, email, password_hash, name)
values ('admin-1', 'admin@demo.local', 'demo123', 'Demo Admin')
on conflict (id) do nothing;

-- 7. Storage Setup (Bucket & Policies)
insert into storage.buckets (id, name, public)
values ('news-images', 'news-images', true)
on conflict (id) do nothing;
insert into storage.buckets (id, name, public)
values ('news-pdfs', 'news-pdfs', true)
on conflict (id) do nothing;

do $$
begin
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'Public Access News Images'
  ) then
    create policy "Public Access News Images" 
    on storage.objects 
    for all 
    using ( bucket_id = 'news-images' ) 
    with check ( bucket_id = 'news-images' );
  end if;
  if not exists (
    select 1 from pg_policies 
    where schemaname = 'storage' 
    and tablename = 'objects' 
    and policyname = 'Public Access News PDFs'
  ) then
    create policy "Public Access News PDFs" 
    on storage.objects 
    for all 
    using ( bucket_id = 'news-pdfs' ) 
    with check ( bucket_id = 'news-pdfs' );
  end if;
end $$;`,d=()=>{navigator.clipboard.writeText(c),r(!0),setTimeout(()=>r(!1),2e3)};return e.jsxs("div",{className:"mt-4 p-4 bg-slate-50 border border-slate-200 rounded-lg text-sm text-left animate-fade-in",children:[e.jsxs("div",{className:"flex items-start gap-2 text-red-600 mb-3 font-medium",children:[e.jsx(_,{size:16,className:"mt-0.5 shrink-0"}),e.jsxs("div",{children:[e.jsx("p",{children:"Database Connection Required"}),e.jsx("p",{className:"text-xs text-red-400 font-normal mt-1 opacity-80 break-all font-mono",children:i})]})]}),e.jsx("p",{className:"text-slate-600 mb-2 font-medium",children:"1. Run this SQL in your Supabase Dashboard:"}),e.jsxs("div",{className:"relative group mb-4",children:[e.jsx("pre",{className:"bg-slate-900 text-slate-50 p-3 rounded-md overflow-x-auto text-xs font-mono h-32 whitespace-pre",children:c}),e.jsx("button",{onClick:d,className:"absolute top-2 right-2 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded transition-colors",title:"Copy SQL",children:u?e.jsx(C,{size:14}):e.jsx(A,{size:14})})]}),e.jsx("p",{className:"text-slate-600 mb-2 font-medium",children:"2. After running SQL, click below to initialize:"})]})},O=()=>{const[i,u]=a.useState("admin@demo.local"),[r,c]=a.useState("demo123"),[d,y]=a.useState(!1),[h,g]=a.useState(!1),[m,f]=a.useState(!1),[k,o]=a.useState(null),j=S(),{addToast:n}=P();a.useEffect(()=>{(async()=>{const s=await l.checkConnection();!s.connected&&s.error&&o(l.getErrorMessage(s.error))})()},[]);const v=async t=>{t.preventDefault(),g(!0),o(null);const s=await l.loginAdmin(i,r);if(g(!1),s.success&&s.token)localStorage.setItem("news_auth_token",s.token),n("Welcome back!","success"),j("/admin/dashboard");else{const x=s.error,b=l.getErrorMessage(x);x&&(x.code==="PGRST205"||x.code==="42P01"||b.includes('relation "news_admins" does not exist'))?(o(b),n("Database tables missing.","error")):n(b,"error")}},N=async()=>{f(!0),o(null);const t=await l.seedIfEmpty();if(f(!1),t.success)n("Database seeded successfully. Try logging in.","success");else if(t.error){const s=l.getErrorMessage(t.error);o(s),n("Seeding failed. See instructions.","error")}};return e.jsxs("div",{className:"min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 relative overflow-hidden",children:[e.jsxs("div",{className:"absolute inset-0 overflow-hidden pointer-events-none",children:[e.jsx("div",{className:"absolute top-0 right-0 w-[600px] h-[600px] bg-maroon-600/5 rounded-full -translate-y-1/2 translate-x-1/4 blur-3xl"}),e.jsx("div",{className:"absolute bottom-0 left-0 w-[500px] h-[500px] bg-slate-400/5 rounded-full translate-y-1/2 -translate-x-1/4 blur-3xl"}),e.jsx("div",{className:"absolute inset-0 opacity-[0.03]",style:{backgroundImage:"linear-gradient(to right, #64748b 1px, transparent 1px), linear-gradient(to bottom, #64748b 1px, transparent 1px)",backgroundSize:"48px 48px"}})]}),e.jsxs("div",{className:"w-full max-w-sm relative z-10",children:[e.jsxs(z,{to:"/",className:"inline-flex items-center gap-2 text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white transition-colors mb-8 font-semibold text-xs uppercase tracking-widest group",children:[e.jsx(D,{size:15,className:"group-hover:-translate-x-1 transition-transform"}),"Back to Portal"]}),e.jsxs("div",{className:"bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/60 dark:shadow-slate-950/60 overflow-hidden",children:[e.jsx("div",{className:"h-1 bg-gradient-to-r from-maroon-700 via-maroon-500 to-maroon-700"}),e.jsxs("div",{className:"p-8",children:[e.jsxs("div",{className:"text-center mb-8",children:[e.jsx("div",{className:"inline-flex items-center justify-center w-14 h-14 bg-maroon-600 rounded-xl shadow-lg shadow-maroon-900/30 mb-5",children:e.jsx(E,{size:26,className:"text-white",strokeWidth:2.5})}),e.jsxs("h1",{className:"text-2xl font-black text-slate-900 dark:text-white tracking-tight",children:["PULSE-R",e.jsx("sup",{className:"text-base",children:"24"})]}),e.jsx("p",{className:"text-slate-500 dark:text-slate-400 text-[10px] mt-1.5 uppercase tracking-[0.3em] font-bold",children:"Admin Control Panel"})]}),e.jsxs("form",{onSubmit:v,className:"space-y-4",children:[e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2",children:"Email Address"}),e.jsxs("div",{className:"relative",children:[e.jsx(q,{size:15,className:"absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"}),e.jsx("input",{type:"email",className:"w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500",placeholder:"admin@demo.local",value:i,onChange:t=>u(t.target.value)})]})]}),e.jsxs("div",{children:[e.jsx("label",{className:"block text-[10px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-400 mb-2",children:"Password"}),e.jsxs("div",{className:"relative",children:[e.jsx(T,{size:15,className:"absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"}),e.jsx("input",{type:d?"text":"password",className:"w-full pl-10 pr-12 py-3 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-maroon-500/30 focus:border-maroon-500 outline-none transition-all text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500",placeholder:"••••••••",value:r,onChange:t=>c(t.target.value)}),e.jsx("button",{type:"button",onClick:()=>y(t=>!t),className:"absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors",children:d?e.jsx(I,{size:15}):e.jsx(L,{size:15})})]})]}),e.jsx("button",{type:"submit",disabled:h||m,className:"w-full py-3.5 mt-2 rounded-xl bg-maroon-600 hover:bg-maroon-500 active:scale-[0.98] text-white font-black text-xs uppercase tracking-[0.2em] transition-all disabled:opacity-50 shadow-lg shadow-maroon-900/20 flex items-center justify-center gap-2",children:h?e.jsxs(e.Fragment,{children:[e.jsx(w,{size:14,className:"animate-spin"}),"Authenticating…"]}):"Sign In"})]}),e.jsxs("div",{className:"flex items-center gap-3 my-6",children:[e.jsx("div",{className:"flex-1 h-px bg-slate-100 dark:bg-slate-800"}),e.jsx("span",{className:"text-[10px] text-slate-400 uppercase tracking-widest font-bold",children:"Demo"}),e.jsx("div",{className:"flex-1 h-px bg-slate-100 dark:bg-slate-800"})]}),k?e.jsxs("div",{className:"space-y-3",children:[e.jsx(F,{errorDetails:k}),e.jsxs("button",{onClick:N,disabled:m,className:"w-full flex items-center justify-center gap-2 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-50 border border-slate-200 dark:border-slate-700",children:[e.jsx(w,{size:13,className:m?"animate-spin":""}),m?"Initializing…":"Initialize Database"]})]}):e.jsxs("div",{className:"bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 rounded-xl p-4 text-center space-y-1",children:[e.jsx("p",{className:"text-[10px] font-black text-slate-500 dark:text-slate-400 uppercase tracking-widest mb-2",children:"Default Credentials"}),e.jsxs("div",{className:"flex justify-between items-center text-xs",children:[e.jsx("span",{className:"text-slate-400 dark:text-slate-500 font-semibold",children:"Email"}),e.jsx("span",{className:"text-slate-700 dark:text-slate-300 font-mono font-bold",children:"admin@demo.local"})]}),e.jsxs("div",{className:"flex justify-between items-center text-xs",children:[e.jsx("span",{className:"text-slate-400 dark:text-slate-500 font-semibold",children:"Password"}),e.jsx("span",{className:"text-slate-700 dark:text-slate-300 font-mono font-bold",children:"demo123"})]})]})]}),e.jsx("div",{className:"px-8 py-4 bg-slate-50 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800",children:e.jsx("p",{className:"text-center text-[9px] text-slate-400 dark:text-slate-600 uppercase tracking-widest leading-relaxed",children:"Unauthorized access is strictly prohibited"})})]})]})]})};export{O as Login};

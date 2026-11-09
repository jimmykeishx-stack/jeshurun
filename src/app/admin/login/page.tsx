import { signIn } from "@/app/admin/actions";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";

export default async function AdminLogin({ searchParams }: { searchParams: Promise<{error?:string}> }) {
  const params = await searchParams;
  let configured = true;
  try { const supabase = await createClient(); const { data } = await supabase.auth.getClaims(); if (data?.claims?.sub) { const { data: admin } = await supabase.rpc("is_jeshurun_admin"); if (admin) return <main className="admin-shell"><Link href="/" className="login-brand"><img src="/welcome-homes-logo.jpg" alt="Welcome Homes Agency — Your Dream Home, Our Priority"/></Link><h1>You are signed in</h1><Link className="button button-dark" href="/admin">Open dashboard</Link></main>; } }
  catch { configured = false; }
  return <main className="admin-shell"><Link href="/" className="login-brand"><img src="/welcome-homes-logo.jpg" alt="Welcome Homes Agency — Your Dream Home, Our Priority"/></Link><section className="admin-panel"><span className="kicker dark-kicker">Welcome Homes Agency</span><h1>Administrator sign in</h1><p>Sign in with an account that has been explicitly authorised by the business.</p>{params.error&&<p className="form-error" role="alert">{params.error}</p>}{!configured&&<p className="form-error" role="alert">Supabase is not configured yet. Add the project URL and anon key to the deployment environment.</p>}<form action={signIn} className="admin-form"><label>Email<input name="email" type="email" autoComplete="username" required maxLength={254}/></label><label>Password<input name="password" type="password" autoComplete="current-password" required minLength={8}/></label><button disabled={!configured} className="button button-dark">Sign in</button></form></section></main>;
}

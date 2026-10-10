"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthShell } from "@/components/portal/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input, Label, FormRow } from "@/components/ui/Field";
import { AlertCircle } from "lucide-react";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await signInWithEmailAndPassword(auth, email, password);
      let token;
      try {
        token = await cred.user.getIdTokenResult(true);
      } catch (err) {
        console.error("Signed in, but could not load the account role.", err);
        setError("We signed you in, but couldn't load your account role. Check the emulator and try again.");
        return;
      }
      const role = token.claims.role as string | undefined;
      const tenantSlug = token.claims.tenantSlug as string | undefined;

      if (role === "superadmin") {
        router.push("/superadmin/dashboard");
      } else if (role === "parent" && tenantSlug) {
        router.push(`/${tenantSlug}/parent/dashboard`);
      } else if (role && tenantSlug) {
        router.push(`/${tenantSlug}/${role}/dashboard`);
      } else {
        setError("This account isn't set up with a role yet. Contact your coaching admin.");
      }
    } catch (err) {
      const code = err && typeof err === "object" && "code" in err
        ? String(err.code)
        : "";
      if (code === "auth/network-request-failed") {
        setError("We couldn't reach Firebase. Start the local emulators and try again.");
      } else if (code === "auth/too-many-requests") {
        setError("Too many attempts. Wait a moment, then try again.");
      } else {
        setError("That email and password don't match our records.");
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Log in" subtitle="Enter your roll — one login works for every role."
      footer={<>New coaching? <Link href="/register" className="font-semibold text-board hover:underline">Start a free trial</Link></>}>
      <form onSubmit={handleSubmit}>
        <FormRow>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" placeholder="you@coaching.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormRow>
        <FormRow>
          <div className="mb-1.5 flex items-center justify-between">
            <Label htmlFor="password">Password</Label>
            <Link href="/forgot-password" className="text-xs font-semibold text-board hover:underline">Forgot?</Link>
          </div>
          <Input id="password" type="password" required autoComplete="current-password" placeholder="••••••••" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormRow>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-pen bg-red-pen-tint px-3 py-2.5 text-sm text-red-pen">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Checking…" : "Log in"}</Button>
      </form>

      <div className="mt-6 rounded-lg border border-rule bg-paper px-3 py-2.5 text-xs text-ink-soft">
        <p className="mb-1 font-semibold text-ink">Demo logins · ডেমো লগইন (password: Passw0rd!)</p>
        <p className="font-tabular">superadmin@roster.app</p>
        <p className="font-tabular">owner@brightprep.test</p>
        <p className="font-tabular">teacher@brightprep.test</p>
        <p className="font-tabular">student@brightprep.test</p>
        <p className="font-tabular">parent@brightprep.test</p>
      </div>
    </AuthShell>
  );
}

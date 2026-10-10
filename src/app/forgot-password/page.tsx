"use client";

import { useState } from "react";
import Link from "next/link";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";
import { AuthShell } from "@/components/portal/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input, Label, FormRow } from "@/components/ui/Field";
import { CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
    } catch {
      // Intentionally silent: don't reveal whether an email is registered.
    } finally {
      setLoading(false);
      setSent(true);
    }
  }

  return (
    <AuthShell title="Reset your password" subtitle="We'll email you a link to set a new one."
      footer={<Link href="/login" className="font-semibold text-board hover:underline">Back to log in</Link>}>
      {sent ? (
        <div className="flex flex-col items-center gap-2 py-4 text-center">
          <CheckCircle2 size={28} className="text-board" />
          <p className="text-sm text-ink">If <span className="font-semibold">{email}</span> has an account, a reset link is on its way.</p>
        </div>
      ) : (
        <form onSubmit={handleSubmit}>
          <FormRow>
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" required autoComplete="email" placeholder="you@coaching.com" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormRow>
          <Button type="submit" className="w-full" disabled={loading}>{loading ? "Sending…" : "Send reset link"}</Button>
        </form>
      )}
    </AuthShell>
  );
}

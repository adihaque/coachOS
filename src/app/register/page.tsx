"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import { auth, functions } from "@/lib/firebase";
import { AuthShell } from "@/components/portal/AuthShell";
import { Button } from "@/components/ui/Button";
import { Input, Label, Select, FormRow } from "@/components/ui/Field";
import { AlertCircle } from "lucide-react";

function slugify(value: string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

export default function RegisterPage() {
  const router = useRouter();
  const [coachingName, setCoachingName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [plan, setPlan] = useState("starter");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      const registerTenant = httpsCallable(functions, "registerTenant");
      const result = await registerTenant({ name: coachingName, slug: slugify(coachingName), plan, ownerName });
      await cred.user.getIdToken(true);
      const data = result.data as { slug: string };
      router.push(`/${data.slug}/owner/dashboard`);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      setError(message.replace(/^Firebase:\s*/, ""));
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell title="Start your coaching's trial" subtitle="Set up in under ten minutes. No card needed."
      footer={<>Already have an account? <Link href="/login" className="font-semibold text-board hover:underline">Log in</Link></>}>
      <form onSubmit={handleSubmit}>
        <FormRow>
          <Label htmlFor="coachingName">Coaching center name</Label>
          <Input id="coachingName" required placeholder="Bright Prep Coaching" value={coachingName} onChange={(e) => setCoachingName(e.target.value)} />
          {coachingName && <p className="mt-1.5 font-tabular text-xs text-ink-faint">yourapp.com/{slugify(coachingName)}</p>}
        </FormRow>
        <FormRow>
          <Label htmlFor="ownerName">Your name</Label>
          <Input id="ownerName" required placeholder="Farhana Rahman" value={ownerName} onChange={(e) => setOwnerName(e.target.value)} />
        </FormRow>
        <FormRow>
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" required autoComplete="email" placeholder="you@coaching.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        </FormRow>
        <FormRow>
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" required minLength={6} autoComplete="new-password" placeholder="At least 6 characters" value={password} onChange={(e) => setPassword(e.target.value)} />
        </FormRow>
        <FormRow>
          <Label htmlFor="plan">Plan</Label>
          <Select id="plan" value={plan} onChange={(e) => setPlan(e.target.value)}>
            <option value="starter">Starter — up to 200 students</option>
            <option value="standard">Standard — up to 1,000 students</option>
            <option value="premium">Premium — unlimited</option>
          </Select>
        </FormRow>

        {error && (
          <div className="mb-4 flex items-start gap-2 rounded-lg border border-red-pen bg-red-pen-tint px-3 py-2.5 text-sm text-red-pen">
            <AlertCircle size={16} className="mt-0.5 shrink-0" />{error}
          </div>
        )}

        <Button type="submit" className="w-full" disabled={loading}>{loading ? "Setting up…" : "Create my coaching"}</Button>
      </form>
    </AuthShell>
  );
}

"use client";
import { useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "@/lib/firebase";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, FormRow, Textarea } from "@/components/ui/Field";
export default function AssistantPage() {
  const [intent, setIntent] = useState("create_notice"); const [title, setTitle] = useState(""); const [body, setBody] = useState(""); const [preview, setPreview] = useState(""); const [done, setDone] = useState(false);
  async function run(confirmed: boolean) { const fn = httpsCallable(functions, "executeOwnerCommand"); const response = await fn({ intent, payload: { title, body }, confirmed }); const data = response.data as { preview?: boolean; ok?: boolean }; setPreview(data.preview ? `Preview: ${intent} with title "${title}"` : "Action completed and audit logged."); setDone(Boolean(data.ok)); }
  return <div><PageHeader eyebrow="Owner" title="Command assistant" description="Allowlisted actions only. Every write is previewed, explicitly confirmed, and audit logged." /><StampCard><FormRow><Label>Intent</Label><select className="w-full rounded-lg border border-rule bg-paper-raised px-3 py-2" value={intent} onChange={(e) => setIntent(e.target.value)}><option value="create_notice">Create notice</option><option value="create_homework">Create homework (requires batch payload)</option><option value="mark_fee">Mark fee (requires fee payload)</option></select></FormRow><FormRow><Label>Title / identifier</Label><Input value={title} onChange={(e) => setTitle(e.target.value)} /></FormRow><FormRow><Label>Details</Label><Textarea value={body} onChange={(e) => setBody(e.target.value)} /></FormRow><div className="flex gap-2"><Button variant="secondary" onClick={() => run(false)}>Preview</Button><Button onClick={() => run(true)}>Confirm & execute</Button></div>{preview && <p className="mt-4 text-sm text-board">{preview}{done ? " ✓" : ""}</p>}</StampCard></div>;
}

"use client";
import { useState } from "react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, FormRow } from "@/components/ui/Field";
export default function OmrPage() {
  const [count, setCount] = useState("20");
  const questions = Array.from({ length: Math.min(80, Math.max(1, Number(count) || 1)) }, (_, index) => index + 1);
  return <div><PageHeader eyebrow="Exams" title="Printable answer sheet" description="Browser-generated OMR-style sheet for manual or future assisted scanning. This MVP does not claim OCR accuracy." action={<Button onClick={() => window.print()}>Print sheet</Button>} /><StampCard className="print:border-0"><div className="mb-5 print:hidden"><FormRow><Label>Questions</Label><Input type="number" min="1" max="80" value={count} onChange={(e) => setCount(e.target.value)} /></FormRow></div><div className="border-2 border-ink p-5 text-ink"><div className="flex justify-between border-b-2 border-ink pb-3"><div><h2 className="font-display text-xl font-bold">CoachOS Answer Sheet</h2><p className="text-xs">Name: __________________________ Roll: __________</p></div><p className="font-tabular text-xs">Form A · {questions.length} questions</p></div><div className="mt-5 grid grid-cols-2 gap-x-8 gap-y-3 sm:grid-cols-4">{questions.map((number) => <div key={number} className="flex items-center gap-2 text-xs"><span className="w-5 font-tabular">{number}</span>{["A", "B", "C", "D"].map((option) => <span key={option} className="flex h-5 w-5 items-center justify-center rounded-full border border-ink">{option}</span>)}</div>)}</div></div><p className="mt-4 text-xs text-ink-faint print:hidden">Validation limitation: scan support is intentionally not automated; staff should verify marks against the printed key until a tested image-processing pipeline is introduced.</p></StampCard></div>;
}

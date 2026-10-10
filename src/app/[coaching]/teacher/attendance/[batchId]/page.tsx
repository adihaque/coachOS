"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { listStudents, getBatch, getAttendance, saveAttendance } from "@/lib/data";
import type { Student, Batch, AttendanceMark } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label } from "@/components/ui/Field";
import { CheckCircle2, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import clsx from "clsx";

const MARKS: { value: AttendanceMark; label: string }[] = [
  { value: "present", label: "Present" },
  { value: "late", label: "Late" },
  { value: "absent", label: "Absent" },
];

export default function MarkAttendancePage() {
  const { batchId } = useParams<{ batchId: string }>();
  const { user } = useAuth();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [marks, setMarks] = useState<Record<string, AttendanceMark>>({});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [readAloud, setReadAloud] = useState(false);
  const speechAvailable = typeof window !== "undefined" && "speechSynthesis" in window;

  useEffect(() => {
    if (!user?.tenantId) return;
    setLoading(true);
    setError("");
    Promise.all([getBatch(user.tenantId, batchId), listStudents(user.tenantId)]).then(([b, s]) => {
      const nextStudents = s.filter((st) => st.batchId === batchId).sort((a, b) => a.name.localeCompare(b.name));
      setBatch(b);
      setStudents(nextStudents);
      setCurrentIndex(0);
    }).catch(() => setError("This attendance session could not be loaded.")).finally(() => setLoading(false));
  }, [user?.tenantId, batchId]);

  useEffect(() => {
    if (!user?.tenantId) return;
    setError("");
    getAttendance(user.tenantId, batchId, date).then((rec) => {
      setMarks(rec?.marks ?? {});
      setCurrentIndex(0);
    }).catch(() => setError("Attendance for this date could not be loaded."));
  }, [user?.tenantId, batchId, date]);

  const speak = useCallback((names: string[]) => {
    if (!speechAvailable || names.length === 0) return;
    const utterance = new SpeechSynthesisUtterance(names.join(", "));
    const voices = window.speechSynthesis.getVoices();
    const banglaVoice = voices.find((voice) => /bn|bangla/i.test(voice.lang));
    if (banglaVoice) utterance.voice = banglaVoice;
    utterance.lang = banglaVoice ? banglaVoice.lang : "bn-BD";
    utterance.rate = 0.96;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }, [speechAvailable]);

  useEffect(() => {
    if (readAloud && students.length > 0) {
      const student = students[currentIndex];
      if (student) speak([student.name]);
    }
  }, [currentIndex, readAloud, speak, students]);

  function setMark(studentId: string, mark: AttendanceMark) {
    setMarks((prev) => ({ ...prev, [studentId]: mark }));
    setSaved(false);
    if (readAloud && currentIndex < students.length - 1) {
      const nextIndex = currentIndex + 1;
      setCurrentIndex(nextIndex);
      const nextStudent = students[nextIndex];
      if (nextStudent) {
        setTimeout(() => speak([nextStudent.name]), 150);
      }
    }
  }

  async function handleSave() {
    if (!user?.tenantId || !batch) return;
    setSaving(true);
    setError("");
    try {
      await saveAttendance(user.tenantId, {
        date, batchId, batchName: batch.name, marks,
        studentIds: students.map((student) => student.id),
        updatedAt: new Date().toISOString(), updatedBy: user.uid,
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError("Attendance could not be saved. Check your connection and try again.");
    } finally {
      setSaving(false);
    }
  }

  function markAll(mark: AttendanceMark) {
    setMarks(Object.fromEntries(students.map((student) => [student.id, mark])));
    setSaved(false);
  }

  function nextStudent() {
    setCurrentIndex((index) => {
      const next = Math.min(students.length - 1, index + 1);
      if (readAloud && students[next]) {
        setTimeout(() => speak([students[next].name]), 120);
      }
      return next;
    });
  }

  function previousStudent() {
    setCurrentIndex((index) => Math.max(0, index - 1));
  }

  if (loading) return <p className="text-sm text-ink-soft">Loading…</p>;
  if (!batch) return <p className="text-sm text-ink-soft">This batch could not be found.</p>;

  return (
    <div>
      <PageHeader eyebrow="Teacher" title={`Attendance — ${batch.name}`} />
      {error && <div className="mb-5 rounded-lg border border-red-pen bg-red-pen-tint px-3 py-2.5 text-sm text-red-pen">{error}</div>}

      <div className="mb-5 w-48">
        <Label htmlFor="date">Date</Label>
        <Input id="date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>

      <div className="mb-5 flex flex-wrap items-center gap-2 rounded-lg border border-rule bg-paper-raised px-3 py-2 text-sm">
        <label className="flex items-center gap-2 font-medium text-ink">
          <input type="checkbox" checked={readAloud} onChange={(e) => setReadAloud(e.target.checked)} disabled={!speechAvailable} />
          Read names aloud during session
        </label>
        {!speechAvailable && <span className="text-xs text-ink-faint">Speech is unavailable in this browser.</span>}
        <div className="ml-auto flex gap-2">
          <Button size="sm" variant="secondary" onClick={() => markAll("present")} disabled={students.length === 0}>Mark all present</Button>
          <Button size="sm" variant="ghost" onClick={() => markAll("absent")} disabled={students.length === 0}>Mark all absent</Button>
        </div>
      </div>

      {students.length === 0 ? (
        <p className="text-sm text-ink-soft">No students in this batch yet.</p>
      ) : (
        <StampCard>
          {(() => {
            const student = students[currentIndex];
            if (!student) return null;
            return (
              <div className="transition-all duration-200 animate-[pulse_0.2s_ease-in-out]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-tabular text-xs uppercase tracking-wide text-ink-faint">Student {currentIndex + 1} of {students.length}</p>
                    <h2 className="mt-1 font-display text-2xl font-semibold text-ink">{student.name}</h2>
                    <p className="mt-1 font-tabular text-sm text-ink-soft">Roll {student.roll}</p>
                  </div>
                  <button type="button" aria-label="Read student name aloud" onClick={() => speak([student.name])} disabled={!speechAvailable}
                    className="rounded-full border border-rule p-2 text-board hover:bg-[var(--board-tint)] disabled:opacity-40">
                    {speechAvailable ? <Volume2 size={20} /> : <VolumeX size={20} />}
                  </button>
                </div>
                <div className="mt-8 grid gap-2 sm:grid-cols-3">
                  {MARKS.map((m) => (
                    <button type="button" key={m.value} onClick={() => setMark(student.id, m.value)}
                      className={clsx("rounded-lg border px-4 py-3 text-sm font-semibold transition",
                        marks[student.id] === m.value
                          ? m.value === "present" ? "border-board bg-board text-white"
                          : m.value === "late" ? "border-chalk bg-chalk text-ink"
                          : "border-red-pen bg-red-pen text-white"
                          : "border-rule bg-paper-raised text-ink-soft hover:bg-[var(--board-tint)]") }>
                      {m.label}
                    </button>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between">
                  <Button variant="ghost" onClick={previousStudent} disabled={currentIndex === 0} icon={<ChevronLeft size={16} />}>Previous</Button>
                  <Button variant="ghost" onClick={nextStudent} disabled={currentIndex === students.length - 1} icon={<ChevronRight size={16} />}>Next</Button>
                </div>
              </div>
            );
          })()}
        </StampCard>
      )}

      <div className="mt-6 flex items-center gap-3">
        <Button onClick={handleSave} disabled={saving || students.length === 0} icon={saved ? <CheckCircle2 size={16} /> : undefined}>
          {saving ? "Saving…" : saved ? "Saved" : "Save attendance"}
        </Button>
        <span className="text-xs text-ink-faint">{Object.keys(marks).length} of {students.length} marked</span>
      </div>
    </div>
  );
}

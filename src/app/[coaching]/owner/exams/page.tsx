"use client";

import { useCallback, useEffect, useState } from "react";
import { addDoc, collection, updateDoc, doc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { useAuth } from "@/lib/auth-context";
import { listBatches, listExams, listExamResults, listStudents } from "@/lib/data";
import type { Batch, Exam, ExamResult, Student } from "@/lib/types";
import { PageHeader } from "@/components/ui/PageHeader";
import { StampCard } from "@/components/ui/StampCard";
import { Button } from "@/components/ui/Button";
import { Input, Label, FormRow, Select } from "@/components/ui/Field";

export default function ExamsPage() {
  const { user } = useAuth();
  const [exams, setExams] = useState<Exam[]>([]);
  const [results, setResults] = useState<ExamResult[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [title, setTitle] = useState("");
  const [subject, setSubject] = useState("");
  const [chapter, setChapter] = useState("");
  const [topic, setTopic] = useState("");
  const [marks, setMarks] = useState("100");
  const [selectedBatchIds, setSelectedBatchIds] = useState<string[]>([]);
  const [status, setStatus] = useState<Exam["status"]>("draft");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    const tenantId = user?.tenantId;
    if (!tenantId) return;
    const [examRows, studentRows, batchRows] = await Promise.all([
      listExams(tenantId),
      listStudents(tenantId),
      listBatches(tenantId),
    ]);
    setExams(examRows);
    setStudents(studentRows);
    setBatches(batchRows);
    const resultRows = await Promise.all(examRows.map((exam) => listExamResults(tenantId, exam.id)));
    setResults(resultRows.flat());
  }, [user]);

  async function create() {
    if (!user?.tenantId || !title.trim() || !subject.trim() || !selectedBatchIds.length || Number(marks) < 1) {
      setError("Add a title, subject, positive marks total, and at least one batch.");
      return;
    }
    setSaving(true);
    setError("");
    try {
      await addDoc(collection(db, "tenants", user.tenantId, "exams"), {
      tenantId: user.tenantId,
      title: title.trim(),
      subject: subject.trim(),
      chapter: chapter.trim(),
      topic: topic.trim(),
      description: `${subject.trim()} · ${chapter.trim() || "General"} · ${topic.trim() || "Assessment"}`,
      batchIds: selectedBatchIds,
      scheduledAt: new Date().toISOString(),
      totalMarks: Number(marks),
      status,
      publishedAt: status === "published" ? new Date().toISOString() : null,
      });
      setTitle(""); setSubject(""); setChapter(""); setTopic(""); setMarks("100"); setSelectedBatchIds([]); setStatus("draft");
      await load();
    } catch {
      setError("The exam could not be created. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  async function updateExamStatus(examId: string, nextStatus: Exam["status"]) {
    if (!user?.tenantId) return;
    setError("");
    try {
      await updateDoc(doc(db, "tenants", user.tenantId, "exams", examId), {
        status: nextStatus,
        publishedAt: nextStatus === "published" ? new Date().toISOString() : null,
      });
      await load();
    } catch {
      setError("The exam status could not be updated.");
    }
  }

  useEffect(() => {
    load();
  }, [load]);

  return (
    <div>
      <PageHeader eyebrow="Owner" title="Exams & results" description="Create exam shells, assign them to batches, publish them, and manage results once the assessment is complete." />
      {error && <div className="mb-5 rounded-lg border border-red-pen bg-red-pen-tint px-3 py-2.5 text-sm text-red-pen">{error}</div>}

      <StampCard className="mb-5">
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <FormRow>
            <Label>Title</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Midterm assessment" />
          </FormRow>
          <FormRow>
            <Label>Subject</Label>
            <Input value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Physics" />
          </FormRow>
          <FormRow>
            <Label>Chapter</Label>
            <Input value={chapter} onChange={(e) => setChapter(e.target.value)} placeholder="Motion" />
          </FormRow>
          <FormRow>
            <Label>Topic</Label>
            <Input value={topic} onChange={(e) => setTopic(e.target.value)} placeholder="Vectors" />
          </FormRow>
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <FormRow>
            <Label>Total marks</Label>
            <Input type="number" min="1" value={marks} onChange={(e) => setMarks(e.target.value)} />
          </FormRow>
          <FormRow>
            <Label>Status</Label>
            <Select value={status} onChange={(e) => setStatus(e.target.value as Exam["status"]) }>
              <option value="draft">Draft</option>
              <option value="published">Published</option>
              <option value="completed">Completed</option>
            </Select>
          </FormRow>
        </div>

        <FormRow>
          <Label htmlFor="batchIds">Assign to batches</Label>
          <Select id="batchIds" multiple value={selectedBatchIds} onChange={(e) => setSelectedBatchIds(Array.from(e.target.selectedOptions, (option) => option.value))}>
            {batches.length === 0 ? <option value="">No batches yet</option> : batches.map((batch) => <option key={batch.id} value={batch.id}>{batch.name}</option>)}
          </Select>
        </FormRow>

        <Button onClick={create} disabled={saving}>{saving ? "Creating…" : "Create exam"}</Button>
      </StampCard>

      <div className="space-y-3">
        {exams.map((exam) => (
          <StampCard key={exam.id}>
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <h2 className="font-display font-semibold text-ink">{exam.title}</h2>
                <p className="text-sm text-ink-soft">{exam.subject} · {exam.chapter ?? "General"} · {exam.topic ?? "Assessment"}</p>
                <p className="mt-1 text-xs uppercase tracking-wide text-ink-faint">{exam.status} · {exam.totalMarks} marks</p>
              </div>
              <div className="flex gap-2">
                {exam.status === "draft" && <Button size="sm" variant="secondary" onClick={() => updateExamStatus(exam.id, "published")}>Publish</Button>}
                {exam.status === "published" && <Button size="sm" variant="ghost" onClick={() => updateExamStatus(exam.id, "completed")}>Close</Button>}
              </div>
            </div>

            <div className="mt-4 border-t border-rule pt-3 text-sm">
              <p className="mb-2 text-xs uppercase tracking-wide text-ink-faint">Result board</p>
              {results.filter((result) => result.examId === exam.id).sort((a, b) => a.rank - b.rank).length === 0 ? (
                <p className="text-ink-soft">No marks recorded yet for this exam.</p>
              ) : (
                results.filter((result) => result.examId === exam.id).sort((a, b) => a.rank - b.rank).map((result) => (
                  <p key={result.id} className="flex items-center justify-between gap-3 py-1">
                    <span>{students.find((student) => student.id === result.studentId)?.name ?? "Student"} · {result.grade}</span>
                    <span className="font-tabular">Rank {result.rank} · {result.percentage}%</span>
                  </p>
                ))
              )}
            </div>
          </StampCard>
        ))}
      </div>
    </div>
  );
}

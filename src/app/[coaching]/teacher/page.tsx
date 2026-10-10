"use client";

import { redirect, useParams } from "next/navigation";

export default function TeacherIndex() {
  const { coaching } = useParams<{ coaching: string }>();
  redirect(`/${coaching}/teacher/dashboard`);
}

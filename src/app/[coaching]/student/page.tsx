"use client";

import { redirect, useParams } from "next/navigation";

export default function StudentIndex() {
  const { coaching } = useParams<{ coaching: string }>();
  redirect(`/${coaching}/student/dashboard`);
}

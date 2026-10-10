"use client";

import { redirect, useParams } from "next/navigation";

export default function OwnerIndex() {
  const { coaching } = useParams<{ coaching: string }>();
  redirect(`/${coaching}/owner/dashboard`);
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";
import { Spinner } from "@/components/ui";

export default function VerifyPage() {
  const { token } = useParams<{ token: string }>();
  const [state, setState] = useState<"verifying" | "ok" | "failed">(
    "verifying",
  );
  const ran = useRef(false);

  useEffect(() => {
    if (!token || ran.current) return;
    ran.current = true;
    api
      .verifyEmail(token)
      .then(() => setState("ok"))
      .catch(() => setState("failed"));
  }, [token]);

  return (
    <div className="mx-auto max-w-md px-4 py-24 text-center">
      {state === "verifying" && (
        <>
          <Spinner />
          <p className="mt-4 text-stone-600 dark:text-stone-400">
            Verifying your email…
          </p>
        </>
      )}

      {state === "ok" && (
        <>
          <span className="text-5xl">✅</span>
          <h1 className="mt-4 font-serif text-2xl font-bold">
            Email verified!
          </h1>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            Your account is active. Log in and start building your shelf.
          </p>
          <Link
            href="/login"
            className="mt-8 inline-block rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700"
          >
            Log in
          </Link>
        </>
      )}

      {state === "failed" && (
        <>
          <span className="text-5xl">⚠️</span>
          <h1 className="mt-4 font-serif text-2xl font-bold">
            Verification failed
          </h1>
          <p className="mt-3 text-stone-600 dark:text-stone-400">
            This link is invalid or has expired. Sign up again to receive a new
            one.
          </p>
          <Link
            href="/signup"
            className="mt-8 inline-block rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700"
          >
            Back to sign up
          </Link>
        </>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { api } from "@/lib/api";
import { Alert, Button, Field, inputClass, Spinner } from "@/components/ui";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.requestPasswordReset(email);
      setSent(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Request failed");
    } finally {
      setBusy(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="text-5xl">📬</span>
        <h1 className="mt-4 font-serif text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          If an account exists for <strong>{email}</strong>, you&apos;ll receive
          a link to reset your password.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl font-bold">Reset your password</h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        Enter your account email and we&apos;ll send you a reset link.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="Email">
          <input
            type="email"
            className={inputClass}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </Field>

        {error && <Alert kind="error">{error}</Alert>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy && <Spinner />} Send reset link
        </Button>
      </form>
    </div>
  );
}

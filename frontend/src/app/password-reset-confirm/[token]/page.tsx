"use client";

import { useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { Alert, Button, Field, inputClass, Spinner } from "@/components/ui";

export default function PasswordResetConfirmPage() {
  const { token } = useParams<{ token: string }>();
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    setBusy(true);
    try {
      await api.confirmPasswordReset(token, password, confirm);
      router.push("/login?reset=1");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reset failed");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl font-bold">Choose a new password</h1>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <Field label="New password">
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            maxLength={128}
            placeholder="At least 8 characters"
          />
        </Field>

        <Field label="Confirm new password">
          <input
            type="password"
            className={inputClass}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            required
            minLength={8}
            maxLength={128}
          />
        </Field>

        {error && <Alert kind="error">{error}</Alert>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy && <Spinner />} Reset password
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
        Remembered it after all?{" "}
        <Link
          href="/login"
          className="font-semibold text-amber-700 hover:underline dark:text-amber-500"
        >
          Log in
        </Link>
      </p>
    </div>
  );
}

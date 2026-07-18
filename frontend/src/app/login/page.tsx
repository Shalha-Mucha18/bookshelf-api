"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { Alert, Button, Field, inputClass, Spinner } from "@/components/ui";

export default function LoginPage() {
  const { login } = useAuth();
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await login(email, password);
      router.push("/books");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
      setBusy(false);
    }
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl font-bold">Welcome back</h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        Log in to open your bookshelf.
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

        <Field label="Password">
          <input
            type="password"
            className={inputClass}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </Field>

        {error && <Alert kind="error">{error}</Alert>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy && <Spinner />} Log in
        </Button>
      </form>

      <div className="mt-6 space-y-2 text-center text-sm text-stone-600 dark:text-stone-400">
        <p>
          <Link
            href="/forgot-password"
            className="font-semibold text-amber-700 hover:underline dark:text-amber-500"
          >
            Forgot your password?
          </Link>
        </p>
        <p>
          New here?{" "}
          <Link
            href="/signup"
            className="font-semibold text-amber-700 hover:underline dark:text-amber-500"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}

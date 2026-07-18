"use client";

import { useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";
import { Alert, Button, Field, inputClass, Spinner } from "@/components/ui";

export default function SignupPage() {
  const [form, setForm] = useState({
    username: "",
    email: "",
    first_name: "",
    last_name: "",
    password: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [busy, setBusy] = useState(false);

  function set(key: keyof typeof form, value: string) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    try {
      await api.signUp(form);
      setDone(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Sign up failed");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    return (
      <div className="mx-auto max-w-md px-4 py-24 text-center">
        <span className="text-5xl">📬</span>
        <h1 className="mt-4 font-serif text-2xl font-bold">Check your email</h1>
        <p className="mt-3 text-stone-600 dark:text-stone-400">
          We sent a verification link to <strong>{form.email}</strong>. Click it
          to activate your account, then log in.
        </p>
        <Link
          href="/login"
          className="mt-8 inline-block rounded-xl bg-amber-600 px-6 py-3 font-semibold text-white transition hover:bg-amber-700"
        >
          Go to login
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <h1 className="font-serif text-3xl font-bold">Create your account</h1>
      <p className="mt-2 text-sm text-stone-600 dark:text-stone-400">
        Start cataloguing your bookshelf in minutes.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <Field label="First name">
            <input
              className={inputClass}
              value={form.first_name}
              onChange={(e) => set("first_name", e.target.value)}
              required
              maxLength={50}
            />
          </Field>
          <Field label="Last name">
            <input
              className={inputClass}
              value={form.last_name}
              onChange={(e) => set("last_name", e.target.value)}
              required
              maxLength={50}
            />
          </Field>
        </div>

        <Field label="Username">
          <input
            className={inputClass}
            value={form.username}
            onChange={(e) => set("username", e.target.value)}
            required
            maxLength={50}
          />
        </Field>

        <Field label="Email">
          <input
            type="email"
            className={inputClass}
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
            maxLength={100}
          />
        </Field>

        <Field label="Password">
          <input
            type="password"
            className={inputClass}
            value={form.password}
            onChange={(e) => set("password", e.target.value)}
            required
            minLength={8}
            maxLength={128}
            placeholder="At least 8 characters"
          />
        </Field>

        {error && <Alert kind="error">{error}</Alert>}

        <Button type="submit" disabled={busy} className="w-full">
          {busy && <Spinner />} Create account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-stone-600 dark:text-stone-400">
        Already have an account?{" "}
        <Link href="/login" className="font-semibold text-amber-700 hover:underline dark:text-amber-500">
          Log in
        </Link>
      </p>
    </div>
  );
}

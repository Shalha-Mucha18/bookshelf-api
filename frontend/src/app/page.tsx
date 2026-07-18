"use client";

import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="mx-auto flex max-w-6xl flex-col items-center px-4 py-24 text-center">
      <span className="mb-6 text-6xl">📚</span>
      <h1 className="max-w-2xl font-serif text-5xl font-bold leading-tight tracking-tight text-stone-900 dark:text-stone-100">
        Your bookshelf,
        <span className="text-amber-600"> beautifully organised</span>
      </h1>
      <p className="mt-6 max-w-xl text-lg text-stone-600 dark:text-stone-400">
        Catalogue the books you own, rate and review what you&apos;ve read, and
        tag your collection so you can always find the right book.
      </p>

      <div className="mt-10 flex gap-4">
        {user ? (
          <Link
            href="/books"
            className="rounded-xl bg-amber-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-amber-700"
          >
            Go to my books →
          </Link>
        ) : (
          <>
            <Link
              href="/signup"
              className="rounded-xl bg-amber-600 px-8 py-3.5 text-base font-semibold text-white shadow-sm transition hover:bg-amber-700"
            >
              Get started
            </Link>
            <Link
              href="/login"
              className="rounded-xl border border-stone-300 bg-white px-8 py-3.5 text-base font-semibold text-stone-800 transition hover:bg-stone-100 dark:border-stone-700 dark:bg-stone-900 dark:text-stone-200 dark:hover:bg-stone-800"
            >
              Log in
            </Link>
          </>
        )}
      </div>

      <div className="mt-24 grid w-full gap-6 sm:grid-cols-3">
        {[
          {
            icon: "✍️",
            title: "Review & rate",
            text: "Score books out of five stars and keep your thoughts alongside every title.",
          },
          {
            icon: "🏷️",
            title: "Tag everything",
            text: "Group books by genre, mood or project with flexible tags.",
          },
          {
            icon: "🔐",
            title: "Private & secure",
            text: "Email-verified accounts with secure sign-in keep your shelf yours.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border border-stone-200 bg-white p-6 text-left shadow-sm dark:border-stone-800 dark:bg-stone-900"
          >
            <span className="text-3xl">{f.icon}</span>
            <h3 className="mt-3 font-serif text-lg font-bold">{f.title}</h3>
            <p className="mt-1.5 text-sm text-stone-600 dark:text-stone-400">
              {f.text}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

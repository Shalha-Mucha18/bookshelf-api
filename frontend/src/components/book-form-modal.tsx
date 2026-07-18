"use client";

import { useState } from "react";
import type { Book, BookCreate } from "@/lib/types";
import { Alert, Button, Field, inputClass, Spinner } from "./ui";

export function BookFormModal({
  initial,
  onSubmit,
  onClose,
}: {
  initial?: Book;
  onSubmit: (data: BookCreate) => Promise<void>;
  onClose: () => void;
}) {
  const [form, setForm] = useState<BookCreate>({
    title: initial?.title ?? "",
    author: initial?.author ?? "",
    publisher: initial?.publisher ?? "",
    published_date: initial?.published_date ?? "",
    page_count: initial?.page_count ?? 0,
    language: initial?.language ?? "English",
  });
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  function set<K extends keyof BookCreate>(key: K, value: BookCreate[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSaving(true);
    try {
      await onSubmit(form);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-stone-900"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="mb-4 font-serif text-xl font-bold text-stone-900 dark:text-stone-100">
          {initial ? "Edit book" : "Add a book"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <Field label="Title">
            <input
              className={inputClass}
              value={form.title}
              onChange={(e) => set("title", e.target.value)}
              required
            />
          </Field>

          <div className="grid grid-cols-2 gap-4">
            <Field label="Author">
              <input
                className={inputClass}
                value={form.author}
                onChange={(e) => set("author", e.target.value)}
                required
              />
            </Field>
            <Field label="Publisher">
              <input
                className={inputClass}
                value={form.publisher}
                onChange={(e) => set("publisher", e.target.value)}
                required
              />
            </Field>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <Field label="Published">
              <input
                type="date"
                className={inputClass}
                value={form.published_date}
                onChange={(e) => set("published_date", e.target.value)}
                required
              />
            </Field>
            <Field label="Pages">
              <input
                type="number"
                min={1}
                className={inputClass}
                value={form.page_count || ""}
                onChange={(e) => set("page_count", Number(e.target.value))}
                required
              />
            </Field>
            <Field label="Language">
              <input
                className={inputClass}
                value={form.language}
                onChange={(e) => set("language", e.target.value)}
                required
              />
            </Field>
          </div>

          {error && <Alert kind="error">{error}</Alert>}

          <div className="flex justify-end gap-3 pt-2">
            <Button type="button" variant="secondary" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Spinner />}
              {initial ? "Save changes" : "Add book"}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}

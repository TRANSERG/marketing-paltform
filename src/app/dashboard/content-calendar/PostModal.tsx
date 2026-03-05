"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import type { ContentPost, PostPlatform, PostStatus } from "@/types/database";

const PLATFORMS: { value: PostPlatform; label: string }[] = [
  { value: "instagram", label: "Instagram" },
  { value: "facebook", label: "Facebook" },
  { value: "linkedin", label: "LinkedIn" },
  { value: "twitter", label: "Twitter / X" },
  { value: "tiktok", label: "TikTok" },
];

const STATUSES: { value: PostStatus; label: string }[] = [
  { value: "draft", label: "Draft" },
  { value: "scheduled", label: "Scheduled" },
  { value: "published", label: "Published" },
];

interface PostModalProps {
  clientId: string;
  /** Pre-filled date string (YYYY-MM-DD) when creating from a day click */
  initialDate?: string;
  /** Existing post for edit mode */
  post?: ContentPost;
  onClose: () => void;
}

function toDatetimeLocal(iso: string): string {
  // Convert ISO timestamptz to datetime-local format (YYYY-MM-DDTHH:mm)
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export function PostModal({ clientId, initialDate, post, onClose }: PostModalProps) {
  const router = useRouter();
  const isEdit = Boolean(post);

  const defaultScheduledAt = post
    ? toDatetimeLocal(post.scheduled_at)
    : initialDate
    ? `${initialDate}T09:00`
    : "";

  const [platform, setPlatform] = useState<PostPlatform>(post?.platform ?? "instagram");
  const [caption, setCaption] = useState(post?.caption ?? "");
  const [scheduledAt, setScheduledAt] = useState(defaultScheduledAt);
  const [status, setStatus] = useState<PostStatus>(post?.status ?? "draft");
  const [notes, setNotes] = useState(post?.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const backdropRef = useRef<HTMLDivElement>(null);

  async function handleSave() {
    if (!scheduledAt) {
      setError("Scheduled date & time is required.");
      return;
    }
    setSaving(true);
    setError(null);
    try {
      const body = {
        client_id: clientId,
        platform,
        caption,
        scheduled_at: new Date(scheduledAt).toISOString(),
        status,
        notes: notes || null,
      };

      const res = isEdit
        ? await fetch(`/api/content-posts/${post!.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          })
        : await fetch("/api/content-posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(body),
          });

      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to save post.");
        return;
      }

      router.refresh();
      onClose();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!post || !confirm("Delete this post?")) return;
    setDeleting(true);
    setError(null);
    try {
      const res = await fetch(`/api/content-posts/${post.id}`, { method: "DELETE" });
      if (!res.ok) {
        const json = await res.json();
        setError(json.error ?? "Failed to delete post.");
        return;
      }
      router.refresh();
      onClose();
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setDeleting(false);
    }
  }

  const inputClass =
    "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm";
  const labelClass = "mb-1 block text-sm text-zinc-400";

  return (
    <>
      {/* Backdrop */}
      <div
        ref={backdropRef}
        className="fixed inset-0 z-40 bg-black/50"
        onClick={(e) => {
          if (e.target === backdropRef.current) onClose();
        }}
      />

      {/* Slide-over panel */}
      <div className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col bg-zinc-950 border-l border-zinc-800 shadow-xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-800 px-5 py-4">
          <h2 className="text-base font-medium text-white">
            {isEdit ? "Edit post" : "New post"}
          </h2>
          <button
            onClick={onClose}
            className="rounded p-1 text-zinc-400 hover:bg-zinc-800 hover:text-white"
            aria-label="Close"
          >
            <svg className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
          {/* Platform */}
          <div>
            <label className={labelClass}>Platform</label>
            <select
              value={platform}
              onChange={(e) => setPlatform(e.target.value as PostPlatform)}
              className={inputClass}
            >
              {PLATFORMS.map((p) => (
                <option key={p.value} value={p.value}>
                  {p.label}
                </option>
              ))}
            </select>
          </div>

          {/* Scheduled at */}
          <div>
            <label className={labelClass}>Scheduled date & time <span className="text-red-400">*</span></label>
            <input
              type="datetime-local"
              value={scheduledAt}
              onChange={(e) => setScheduledAt(e.target.value)}
              className={inputClass}
            />
          </div>

          {/* Status */}
          <div>
            <label className={labelClass}>Status</label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value as PostStatus)}
              className={inputClass}
            >
              {STATUSES.map((s) => (
                <option key={s.value} value={s.value}>
                  {s.label}
                </option>
              ))}
            </select>
          </div>

          {/* Caption */}
          <div>
            <label className={labelClass}>Caption</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={5}
              placeholder="Write your post caption..."
              className={`${inputClass} resize-y`}
            />
          </div>

          {/* Notes */}
          <div>
            <label className={labelClass}>Internal notes</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={3}
              placeholder="Optional notes for your team..."
              className={`${inputClass} resize-y`}
            />
          </div>

          {error && (
            <p className="rounded-lg border border-red-800 bg-red-950/50 px-3 py-2 text-sm text-red-400">
              {error}
            </p>
          )}
        </div>

        {/* Footer */}
        <div className="border-t border-zinc-800 px-5 py-4 flex items-center gap-3">
          {isEdit && (
            <button
              onClick={handleDelete}
              disabled={deleting || saving}
              className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-red-800 bg-red-950/50 px-4 py-2 text-sm text-red-400 hover:bg-red-900/30 disabled:opacity-50"
            >
              {deleting ? <Spinner size="sm" /> : null}
              Delete
            </button>
          )}
          <div className="flex-1" />
          <button
            onClick={onClose}
            disabled={saving || deleting}
            className="inline-flex min-h-[44px] items-center rounded-lg border border-zinc-600 px-4 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || deleting}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? <Spinner size="sm" /> : null}
            {isEdit ? "Save changes" : "Create post"}
          </button>
        </div>
      </div>
    </>
  );
}

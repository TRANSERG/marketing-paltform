"use client";

import { useTransition, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import type { TaskStatus, TaskOutputData, TaskTemplateField } from "@/types/database";

const TASK_STATUSES: TaskStatus[] = [
  "draft",
  "scheduled",
  "ongoing",
  "overdue",
  "completed",
  "cancelled",
];

interface TaskDetailFormProps {
  taskId: string;
  clientId: string;
  initialStatus: TaskStatus;
  initialDueDate?: string;
  initialOutput?: string;
  initialOutputData?: TaskOutputData | null;
  templateFields?: TaskTemplateField[];
}

export function TaskDetailForm({
  taskId,
  initialStatus,
  initialDueDate,
  initialOutput,
  initialOutputData,
  templateFields = [],
}: TaskDetailFormProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const hasFormFields = templateFields.length > 0;
  const [outputData, setOutputData] = useState<TaskOutputData>(() => {
    const o: TaskOutputData = {};
    templateFields.forEach((f) => {
      const v = initialOutputData?.[f.key];
      if (f.field_type === "file" || f.field_type === "file_multiple") {
        o[f.key] = Array.isArray(v) ? v : v != null ? [String(v)] : null;
      } else {
        o[f.key] = v != null ? (typeof v === "number" ? v : String(v)) : null;
      }
    });
    return o;
  });
  const [uploading, setUploading] = useState<string | null>(null);

  const setFieldValue = useCallback((key: string, value: string | number | string[] | null) => {
    setOutputData((prev) => ({ ...prev, [key]: value }));
  }, []);

  const handleFileUpload = useCallback(
    async (fieldKey: string, multiple: boolean) => {
      const input = document.createElement("input");
      input.type = "file";
      input.multiple = multiple;
      input.accept = "image/*,video/*,application/pdf";
      input.onchange = async (e) => {
        const files = (e.target as HTMLInputElement).files;
        if (!files?.length) return;
        setUploading(fieldKey);
        const formData = new FormData();
        formData.set("field_key", fieldKey);
        if (files.length === 1) formData.set("file", files[0]);
        else Array.from(files).forEach((f) => formData.append("files", f));
        try {
          const res = await fetch(`/api/tasks/${taskId}/upload`, {
            method: "POST",
            body: formData,
          });
          const data = await res.json().catch(() => ({}));
          if (!res.ok) throw new Error(data.error ?? "Upload failed");
          const paths = data.paths as string[];
          setOutputData((prev) => {
            const current = prev[fieldKey];
            const arr = Array.isArray(current) ? current : current ? [String(current)] : [];
            return { ...prev, [fieldKey]: [...arr, ...paths] };
          });
          router.refresh();
        } catch (err) {
          alert(err instanceof Error ? err.message : "Upload failed");
        } finally {
          setUploading(null);
        }
      };
      input.click();
    },
    [taskId, router]
  );

  const removeFile = useCallback((fieldKey: string, index: number) => {
    setOutputData((prev) => {
      const current = prev[fieldKey];
      const arr = Array.isArray(current) ? current : current ? [String(current)] : [];
      const next = arr.filter((_, i) => i !== index);
      return { ...prev, [fieldKey]: next.length ? next : null };
    });
  }, []);

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    const status = formData.get("status") as TaskStatus;
    const due_date = (formData.get("due_date") as string) || null;
    const output = hasFormFields ? null : (formData.get("output") as string) || null;
    const body: { status: TaskStatus; due_date: string | null; output?: string | null; output_data?: TaskOutputData } = {
      status,
      due_date,
    };
    if (!hasFormFields) body.output = output;
    else body.output_data = outputData;
    startTransition(async () => {
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (res.ok) router.refresh();
      else {
        const data = await res.json().catch(() => ({}));
        alert(data.error ?? "Failed to update task");
      }
    });
  }

  const sortedFields = [...templateFields].sort((a, b) => a.sort_order - b.sort_order);

  return (
    <form onSubmit={handleSubmit} className="mt-4 space-y-4">
      <div>
        <label htmlFor="status" className="block text-sm text-zinc-400">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={initialStatus}
          disabled={isPending}
          className="mt-1 w-full max-w-xs rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        >
          {TASK_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </div>
      <div>
        <label htmlFor="due_date" className="block text-sm text-zinc-400">
          Due date
        </label>
        <input
          type="date"
          id="due_date"
          name="due_date"
          defaultValue={initialDueDate ?? ""}
          disabled={isPending}
          className="mt-1 w-full max-w-xs rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      {hasFormFields ? (
        <div className="space-y-4">
          {sortedFields.map((f) => (
            <div key={f.id}>
              <label className="block text-sm text-zinc-400">
                {f.label}
                {f.required && <span className="text-red-400"> *</span>}
              </label>
              {(f.field_type === "text" || f.field_type === "url") && (
                <input
                  type={f.field_type === "url" ? "url" : "text"}
                  value={(outputData[f.key] as string) ?? ""}
                  onChange={(e) => setFieldValue(f.key, e.target.value || null)}
                  disabled={isPending}
                  className="mt-1 w-full max-w-md rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              )}
              {f.field_type === "textarea" && (
                <textarea
                  value={(outputData[f.key] as string) ?? ""}
                  onChange={(e) => setFieldValue(f.key, e.target.value || null)}
                  rows={4}
                  disabled={isPending}
                  className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              )}
              {f.field_type === "number" && (
                <input
                  type="number"
                  value={(outputData[f.key] as number) ?? ""}
                  onChange={(e) => {
                    const v = e.target.value;
                    setFieldValue(f.key, v === "" ? null : Number(v));
                  }}
                  disabled={isPending}
                  className="mt-1 w-full max-w-xs rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              )}
              {f.field_type === "date" && (
                <input
                  type="date"
                  value={(outputData[f.key] as string) ?? ""}
                  onChange={(e) => setFieldValue(f.key, e.target.value || null)}
                  disabled={isPending}
                  className="mt-1 w-full max-w-xs rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              )}
              {(f.field_type === "file" || f.field_type === "file_multiple") && (
                <div className="mt-1 space-y-2">
                  <button
                    type="button"
                    onClick={() => handleFileUpload(f.key, f.field_type === "file_multiple")}
                    disabled={isPending || uploading === f.key}
                    className="rounded border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800 disabled:opacity-50 inline-flex items-center gap-2"
                  >
                    {uploading === f.key ? (
                      <>
                        <Spinner size="sm" className="h-4 w-4 shrink-0" />
                        Uploading…
                      </>
                    ) : (
                      "Upload"
                    )}
                  </button>
                  {(() => {
                    const paths = outputData[f.key];
                    const arr = Array.isArray(paths) ? paths : paths ? [String(paths)] : [];
                    return (
                      <ul className="list-inside list-disc text-sm text-zinc-400">
                        {arr.map((path, i) => (
                          <li key={path} className="flex items-center gap-2">
                            <span className="truncate">{path.split("/").pop()}</span>
                            <button
                              type="button"
                              onClick={() => removeFile(f.key, i)}
                              className="text-red-400 hover:underline"
                            >
                              Remove
                            </button>
                          </li>
                        ))}
                      </ul>
                    );
                  })()}
                </div>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div>
          <label htmlFor="output" className="block text-sm text-zinc-400">
            Output
          </label>
          <textarea
            id="output"
            name="output"
            rows={6}
            defaultValue={initialOutput ?? ""}
            disabled={isPending}
            placeholder="Share notes, links, or deliverables..."
            className="mt-1 w-full rounded border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          />
        </div>
      )}

      <button
        type="submit"
        disabled={isPending}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
      >
        {isPending ? (
          <>
            <Spinner size="sm" className="shrink-0" />
            Saving…
          </>
        ) : (
          "Save changes"
        )}
      </button>
    </form>
  );
}

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Spinner } from "@/components/Spinner";
import { ALL_PERMISSIONS } from "@/lib/permissions";

interface EditRoleFormProps {
  roleId: string;
  initialName: string;
  initialDescription: string;
  initialPermissions: string[];
}

export function EditRoleForm({
  roleId,
  initialName,
  initialDescription,
  initialPermissions,
}: EditRoleFormProps) {
  const router = useRouter();
  const [name, setName] = useState(initialName);
  const [description, setDescription] = useState(initialDescription);
  const [permissions, setPermissions] = useState<Set<string>>(new Set(initialPermissions));
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);

  function togglePermission(perm: string) {
    setPermissions((prev) => {
      const next = new Set(prev);
      if (next.has(perm)) next.delete(perm);
      else next.add(perm);
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    const trimmedName = name.trim();
    if (!trimmedName) {
      setMessage({ type: "error", text: "Name is required" });
      return;
    }
    setLoading(true);
    const res = await fetch(`/api/admin/roles/${roleId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: trimmedName,
        description: description.trim() || null,
        permissions: Array.from(permissions),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setMessage({ type: "ok", text: "Role updated." });
      router.refresh();
    } else {
      setMessage({ type: "error", text: data.error ?? "Failed to update role" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
      <div>
        <label htmlFor="edit-role-name" className="mb-1 block text-sm text-zinc-400">
          Name
        </label>
        <input
          id="edit-role-name"
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
      </div>
      <div>
        <label htmlFor="edit-role-description" className="mb-1 block text-sm text-zinc-400">
          Description
        </label>
        <input
          id="edit-role-description"
          type="text"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional"
        />
      </div>
      <div>
        <span className="text-sm text-zinc-400">Permissions</span>
        <div className="mt-2 flex flex-wrap gap-x-6 gap-y-2">
          {ALL_PERMISSIONS.map((perm) => (
            <label key={perm} className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={permissions.has(perm)}
                onChange={() => togglePermission(perm)}
                className="rounded border-zinc-600 bg-zinc-900 text-blue-600 focus:ring-blue-500"
              />
              {perm}
            </label>
          ))}
        </div>
      </div>
      {message && (
        <p className={message.type === "ok" ? "text-green-400" : "text-red-400"}>
          {message.text}
        </p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
      >
        {loading ? (
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

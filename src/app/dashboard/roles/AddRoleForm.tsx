"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ALL_PERMISSIONS } from "@/lib/permissions";

export function AddRoleForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [permissions, setPermissions] = useState<Set<string>>(new Set());
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
    const res = await fetch("/api/admin/roles", {
      method: "POST",
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
      setMessage({ type: "ok", text: "Role created." });
      setName("");
      setDescription("");
      setPermissions(new Set());
      router.refresh();
    } else {
      setMessage({ type: "error", text: data.error ?? "Failed to create role" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="flex flex-wrap items-end gap-4">
        <div>
          <label htmlFor="role-name" className="mb-1 block text-sm text-zinc-400">
            Name
          </label>
          <input
            id="role-name"
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="e.g. manager"
          />
        </div>
        <div className="min-w-[200px]">
          <label htmlFor="role-description" className="mb-1 block text-sm text-zinc-400">
            Description
          </label>
          <input
            id="role-description"
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Optional"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {loading ? "Creating…" : "Add role"}
        </button>
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
    </form>
  );
}

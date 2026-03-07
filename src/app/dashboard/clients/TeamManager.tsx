"use client";

import { useState, useTransition } from "react";
import { Spinner } from "@/components/Spinner";
import type { ClientTeamMember } from "@/types/database";
import type {
  createTeamMemberAction,
  updateTeamMemberAction,
  deleteTeamMemberAction,
} from "./actions/team";

const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm";
const labelCls = "mb-1 block text-xs text-zinc-400";

type CreateAction = typeof createTeamMemberAction;
type UpdateAction = typeof updateTeamMemberAction;
type DeleteAction = typeof deleteTeamMemberAction;

interface TeamManagerProps {
  clientId: string;
  initialMembers: ClientTeamMember[];
  canUpdate: boolean;
  createAction: (prev: { error?: string } | undefined, formData: FormData) => ReturnType<CreateAction>;
  updateAction: (id: string, prev: { error?: string } | undefined, formData: FormData) => ReturnType<UpdateAction>;
  deleteAction: (id: string) => ReturnType<DeleteAction>;
}

function MemberForm({
  member,
  onSubmit,
  onCancel,
  isPending,
  error,
}: {
  member?: ClientTeamMember;
  onSubmit: (fd: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
  error?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4 space-y-3">
      <form action={(fd) => onSubmit(fd)} className="space-y-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Name *</label>
            <input name="name" type="text" required defaultValue={member?.name ?? ""} className={inputCls} placeholder="Priya Sharma" />
          </div>
          <div>
            <label className={labelCls}>Role / Title</label>
            <input name="role" type="text" defaultValue={member?.role ?? ""} className={inputCls} placeholder="Senior Stylist" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Bio</label>
          <textarea name="bio" rows={2} defaultValue={member?.bio ?? ""} className={inputCls} placeholder="10 years of experience, specialises in bridal..." />
        </div>
        <div>
          <label className={labelCls}>Specialties <span className="text-zinc-500">(comma-separated)</span></label>
          <input name="specialties" type="text" defaultValue={member?.specialties?.join(", ") ?? ""} className={inputCls} placeholder="Balayage, Keratin, Bridal" />
        </div>
        <div>
          <label className={labelCls}>Instagram handle</label>
          <div className="flex">
            <span className="inline-flex items-center rounded-l-lg border border-r-0 border-zinc-700 bg-zinc-800 px-3 text-zinc-400 text-xs">@</span>
            <input name="instagram_handle" type="text" defaultValue={member?.instagram_handle ?? ""} className="flex-1 rounded-l-none rounded-r-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm" placeholder="priya.styles" />
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
          <input type="checkbox" name="is_active" value="true" defaultChecked={member?.is_active ?? true} className="accent-blue-500" />
          Active team member
        </label>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={isPending}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">
            {isPending ? <><Spinner size="sm" />Saving…</> : (member ? "Update" : "Add member")}
          </button>
          <button type="button" onClick={onCancel}
            className="rounded-lg border border-zinc-600 px-3 py-2 text-sm text-zinc-300 hover:bg-zinc-800">
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}

export function TeamManager({
  clientId,
  initialMembers,
  canUpdate,
  createAction,
  updateAction,
  deleteAction,
}: TeamManagerProps) {
  const [members, setMembers] = useState(initialMembers);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [createError, setCreateError] = useState<string>();
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  const handleCreate = (fd: FormData) => {
    startTransition(async () => {
      const result = await createAction(undefined, fd);
      if (result?.error) { setCreateError(result.error); return; }
      window.location.reload();
    });
  };

  const handleUpdate = (id: string, fd: FormData) => {
    startTransition(async () => {
      const result = await updateAction(id, undefined, fd);
      if (result?.error) { setUpdateErrors((e) => ({ ...e, [id]: result.error! })); return; }
      window.location.reload();
    });
  };

  const handleDelete = (id: string, name: string) => {
    if (!confirm(`Remove ${name} from the team?`)) return;
    startTransition(async () => {
      await deleteAction(id);
      setMembers((prev) => prev.filter((m) => m.id !== id));
    });
  };

  return (
    <div className="space-y-6">
      {canUpdate && (
        <div className="flex justify-end">
          <button
            onClick={() => { setShowAddForm(true); setEditingId(null); }}
            className="rounded-lg bg-blue-600 px-3 py-2.5 text-sm text-white hover:bg-blue-700 min-h-[44px]"
          >
            + Add team member
          </button>
        </div>
      )}

      {showAddForm && (
        <MemberForm
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          isPending={isPending}
          error={createError}
        />
      )}

      {members.length === 0 && !showAddForm ? (
        <p className="py-8 text-center text-zinc-500 text-sm">
          No team members added yet. {canUpdate && "Add stylists, trainers, chefs, or other staff."}
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {members.map((m) => (
            <div key={m.id}>
              {editingId === m.id ? (
                <MemberForm
                  member={m}
                  onSubmit={(fd) => handleUpdate(m.id, fd)}
                  onCancel={() => setEditingId(null)}
                  isPending={isPending}
                  error={updateErrors[m.id]}
                />
              ) : (
                <div className="rounded-lg border border-zinc-800 bg-zinc-900/40 p-4">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-medium text-sm">{m.name}</span>
                        {!m.is_active && (
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">Inactive</span>
                        )}
                      </div>
                      {m.role && (
                        <p className="text-xs text-zinc-400 mt-0.5">{m.role}</p>
                      )}
                      {m.bio && (
                        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{m.bio}</p>
                      )}
                      {m.specialties?.length ? (
                        <div className="mt-2 flex flex-wrap gap-1">
                          {m.specialties.map((s) => (
                            <span key={s} className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-300">{s}</span>
                          ))}
                        </div>
                      ) : null}
                      {m.instagram_handle && (
                        <p className="mt-1 text-xs text-blue-400">@{m.instagram_handle}</p>
                      )}
                    </div>
                    {canUpdate && (
                      <div className="flex gap-2 shrink-0">
                        <button onClick={() => setEditingId(m.id)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                        <button onClick={() => handleDelete(m.id, m.name)} className="text-xs text-red-400 hover:text-red-300">Remove</button>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

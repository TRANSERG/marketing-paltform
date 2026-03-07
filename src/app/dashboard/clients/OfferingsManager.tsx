"use client";

import { useActionState, useState, useTransition } from "react";
import { Spinner } from "@/components/Spinner";
import type { ClientOffering, OfferingType } from "@/types/database";
import type {
  createOfferingAction,
  updateOfferingAction,
  deleteOfferingAction,
} from "./actions/offerings";

const OFFERING_TYPE_LABELS: Record<OfferingType, string> = {
  menu_item:  "Menu Item",
  service:    "Service",
  class:      "Class",
  product:    "Product",
  membership: "Membership",
  package:    "Package",
};

const inputCls =
  "w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-white placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-blue-500 text-sm";
const labelCls = "mb-1 block text-xs text-zinc-400";

type CreateAction = typeof createOfferingAction;
type UpdateAction = typeof updateOfferingAction;
type DeleteAction = typeof deleteOfferingAction;

interface OfferingsManagerProps {
  clientId: string;
  initialOfferings: ClientOffering[];
  canUpdate: boolean;
  createAction: (prev: { error?: string } | undefined, formData: FormData) => ReturnType<CreateAction>;
  updateAction: (id: string, prev: { error?: string } | undefined, formData: FormData) => ReturnType<UpdateAction>;
  deleteAction: (id: string) => ReturnType<DeleteAction>;
}

function OfferingForm({
  offering,
  onSubmit,
  onCancel,
  isPending,
  error,
}: {
  offering?: ClientOffering;
  onSubmit: (formData: FormData) => void;
  onCancel: () => void;
  isPending: boolean;
  error?: string;
}) {
  return (
    <div className="rounded-lg border border-zinc-700 bg-zinc-900/60 p-4 space-y-3">
      <form
        action={(fd) => onSubmit(fd)}
        className="space-y-3"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <div>
            <label className={labelCls}>Type</label>
            <select name="offering_type" defaultValue={offering?.offering_type ?? "service"} className={inputCls}>
              {(Object.entries(OFFERING_TYPE_LABELS) as [OfferingType, string][]).map(([v, l]) => (
                <option key={v} value={v}>{l}</option>
              ))}
            </select>
          </div>
          <div>
            <label className={labelCls}>Category</label>
            <input name="category" type="text" defaultValue={offering?.category ?? ""} className={inputCls} placeholder="Mains, Hair Services, Yoga..." />
          </div>
        </div>
        <div>
          <label className={labelCls}>Name *</label>
          <input name="name" type="text" required defaultValue={offering?.name ?? ""} className={inputCls} placeholder="Signature Latte" />
        </div>
        <div>
          <label className={labelCls}>Description</label>
          <textarea name="description" rows={2} defaultValue={offering?.description ?? ""} className={inputCls} placeholder="Double shot espresso with house-made vanilla syrup..." />
        </div>
        <div className="grid gap-3 sm:grid-cols-3">
          <div>
            <label className={labelCls}>Price</label>
            <input name="price" type="number" step="0.01" min="0" defaultValue={offering?.price ?? ""} className={inputCls} placeholder="250" />
          </div>
          <div>
            <label className={labelCls}>Currency</label>
            <input name="currency" type="text" defaultValue={offering?.currency ?? "INR"} className={inputCls} placeholder="INR" />
          </div>
          <div>
            <label className={labelCls}>Duration (mins)</label>
            <input name="duration_minutes" type="number" min="0" defaultValue={offering?.duration_minutes ?? ""} className={inputCls} placeholder="60" />
          </div>
        </div>
        <div>
          <label className={labelCls}>Tags <span className="text-zinc-500">(comma-separated)</span></label>
          <input name="tags" type="text" defaultValue={offering?.tags?.join(", ") ?? ""} className={inputCls} placeholder="bestseller, vegan, new" />
        </div>
        <div className="flex gap-4">
          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
            <input type="checkbox" name="is_featured" value="true" defaultChecked={offering?.is_featured} className="accent-blue-500" />
            Featured
          </label>
          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
            <input type="checkbox" name="is_available" value="true" defaultChecked={offering?.is_available ?? true} className="accent-blue-500" />
            Available
          </label>
        </div>
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button type="submit" disabled={isPending}
            className="rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2">
            {isPending ? <><Spinner size="sm" />Saving…</> : (offering ? "Update" : "Add offering")}
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

export function OfferingsManager({
  clientId,
  initialOfferings,
  canUpdate,
  createAction,
  updateAction,
  deleteAction,
}: OfferingsManagerProps) {
  const [offerings, setOfferings] = useState(initialOfferings);
  const [showAddForm, setShowAddForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();
  const [createError, setCreateError] = useState<string>();
  const [updateErrors, setUpdateErrors] = useState<Record<string, string>>({});

  const grouped = offerings.reduce<Record<string, ClientOffering[]>>((acc, o) => {
    const key = o.category || "Uncategorised";
    (acc[key] ||= []).push(o);
    return acc;
  }, {});

  const handleCreate = (fd: FormData) => {
    startTransition(async () => {
      const result = await createAction(undefined, fd);
      if (result?.error) { setCreateError(result.error); return; }
      // Refresh: re-fetch would be cleanest but for simplicity reload page section
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

  const handleDelete = (id: string) => {
    if (!confirm("Delete this offering?")) return;
    startTransition(async () => {
      await deleteAction(id);
      setOfferings((prev) => prev.filter((o) => o.id !== id));
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
            + Add offering
          </button>
        </div>
      )}

      {showAddForm && (
        <OfferingForm
          onSubmit={handleCreate}
          onCancel={() => setShowAddForm(false)}
          isPending={isPending}
          error={createError}
        />
      )}

      {offerings.length === 0 && !showAddForm ? (
        <p className="py-8 text-center text-zinc-500 text-sm">
          No offerings yet. {canUpdate && "Add menu items, services, or products."}
        </p>
      ) : (
        Object.entries(grouped).map(([category, items]) => (
          <div key={category}>
            <h4 className="mb-2 text-xs font-medium uppercase tracking-wide text-zinc-500">{category}</h4>
            <div className="rounded-lg border border-zinc-800 divide-y divide-zinc-800">
              {items.map((o) => (
                <div key={o.id}>
                  {editingId === o.id ? (
                    <div className="p-3">
                      <OfferingForm
                        offering={o}
                        onSubmit={(fd) => handleUpdate(o.id, fd)}
                        onCancel={() => setEditingId(null)}
                        isPending={isPending}
                        error={updateErrors[o.id]}
                      />
                    </div>
                  ) : (
                    <div className="flex items-start gap-3 px-4 py-3">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-medium text-sm">{o.name}</span>
                          {o.is_featured && (
                            <span className="rounded-full bg-amber-900/40 px-2 py-0.5 text-xs text-amber-400">Featured</span>
                          )}
                          {!o.is_available && (
                            <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-500">Unavailable</span>
                          )}
                          <span className="rounded-full bg-zinc-800 px-2 py-0.5 text-xs text-zinc-400">
                            {OFFERING_TYPE_LABELS[o.offering_type]}
                          </span>
                        </div>
                        {o.description && (
                          <p className="mt-0.5 text-xs text-zinc-500 line-clamp-1">{o.description}</p>
                        )}
                        <div className="mt-1 flex items-center gap-3 text-xs text-zinc-400">
                          {o.price != null && (
                            <span>{o.currency} {o.price.toLocaleString()}</span>
                          )}
                          {o.duration_minutes && (
                            <span>{o.duration_minutes} min</span>
                          )}
                          {o.tags?.length ? (
                            <span>{o.tags.join(", ")}</span>
                          ) : null}
                        </div>
                      </div>
                      {canUpdate && (
                        <div className="flex gap-2 shrink-0">
                          <button onClick={() => setEditingId(o.id)} className="text-xs text-zinc-400 hover:text-white">Edit</button>
                          <button onClick={() => handleDelete(o.id)} className="text-xs text-red-400 hover:text-red-300">Delete</button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
}

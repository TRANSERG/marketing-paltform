"use client";

import Link from "next/link";
import { useActionState } from "react";
import type { ServiceWithStages } from "@/lib/services";

type FormAction = (formData: FormData) => Promise<{ error?: string } | void>;

interface AddServiceFormProps {
  action: FormAction;
  services: ServiceWithStages[];
  clientId: string;
}

export function AddServiceForm({ action, services, clientId }: AddServiceFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_: { error?: string } | undefined, formData: FormData) => {
      const result = await action(formData);
      if (result && "error" in result) return result;
      return undefined;
    },
    undefined as { error?: string } | undefined
  );

  return (
    <form action={formAction} className="max-w-md space-y-4">
      <div>
        <label htmlFor="service_id" className="mb-1 block text-sm text-zinc-400">
          Service
        </label>
        <select
          id="service_id"
          name="service_id"
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
        >
          <option value="">Select a service</option>
          {services.map((s) => (
            <option key={s.id} value={s.id}>
              {s.name}
            </option>
          ))}
        </select>
      </div>
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <div className="flex flex-wrap gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 min-h-[48px]"
        >
          {isPending ? "Adding…" : "Add service"}
        </button>
        <Link
          href={`/dashboard/clients/${clientId}`}
          className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 min-h-[48px] inline-flex items-center"
        >
          Cancel
        </Link>
      </div>
    </form>
  );
}

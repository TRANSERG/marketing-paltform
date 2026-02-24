"use client";

import { useActionState } from "react";
import { Spinner } from "@/components/Spinner";
import type { Client, ClientStatus } from "@/types/database";

const STATUS_OPTIONS: ClientStatus[] = [
  "lead",
  "qualified",
  "closed",
  "active",
  "churned",
];

type FormAction = (formData: FormData) => Promise<{ error?: string } | void>;

interface ClientFormProps {
  action: FormAction;
  client?: Client | null;
}

export function ClientForm({ action, client }: ClientFormProps) {
  const [state, formAction, isPending] = useActionState(
    async (_: { error?: string } | undefined, formData: FormData) => {
      const result = await action(formData);
      if (result && "error" in result) return result;
      return undefined;
    },
    undefined as { error?: string } | undefined
  );

  return (
    <form action={formAction} className="max-w-xl space-y-4">
      <div>
        <label htmlFor="name" className="mb-1 block text-sm text-zinc-400">
          Name *
        </label>
        <input
          id="name"
          name="name"
          type="text"
          required
          defaultValue={client?.name}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          placeholder="Business name"
        />
      </div>
      <div>
        <label htmlFor="contact_email" className="mb-1 block text-sm text-zinc-400">
          Contact email
        </label>
        <input
          id="contact_email"
          name="contact_email"
          type="email"
          defaultValue={client?.contact_email ?? ""}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
          placeholder="contact@example.com"
        />
      </div>
      <div>
        <label htmlFor="contact_phone" className="mb-1 block text-sm text-zinc-400">
          Contact phone
        </label>
        <input
          id="contact_phone"
          name="contact_phone"
          type="tel"
          defaultValue={client?.contact_phone ?? ""}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        />
      </div>
      <div>
        <label htmlFor="address" className="mb-1 block text-sm text-zinc-400">
          Address
        </label>
        <textarea
          id="address"
          name="address"
          rows={2}
          defaultValue={client?.address ?? ""}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        />
      </div>
      <div>
        <label htmlFor="timezone" className="mb-1 block text-sm text-zinc-400">
          Timezone
        </label>
        <input
          id="timezone"
          name="timezone"
          type="text"
          defaultValue={client?.timezone ?? "UTC"}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white placeholder-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        />
      </div>
      <div>
        <label htmlFor="status" className="mb-1 block text-sm text-zinc-400">
          Status
        </label>
        <select
          id="status"
          name="status"
          defaultValue={client?.status ?? "lead"}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base"
        >
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s.charAt(0).toUpperCase() + s.slice(1)}
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
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 min-h-[48px] inline-flex items-center gap-2"
        >
          {isPending ? (
            <>
              <Spinner size="sm" className="shrink-0" />
              Saving…
            </>
          ) : (
            client ? "Update client" : "Create client"
          )}
        </button>
        {client && (
          <a
            href={`/dashboard/clients/${client.id}`}
            className="rounded-lg border border-zinc-600 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 min-h-[48px] inline-flex items-center"
          >
            Cancel
          </a>
        )}
      </div>
    </form>
  );
}

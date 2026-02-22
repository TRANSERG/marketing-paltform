"use client";

import { useActionState } from "react";

type FormAction = (formData: FormData) => Promise<{ error?: string } | void>;

interface NewServiceFormProps {
  action: FormAction;
}

export function NewServiceForm({ action }: NewServiceFormProps) {
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
        <label htmlFor="name" className="mb-1 block text-sm text-zinc-400">
          Name
        </label>
        <input
          type="text"
          id="name"
          name="name"
          required
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base min-h-[48px]"
          placeholder="e.g. GBP Optimization"
        />
      </div>
      <div>
        <label htmlFor="description" className="mb-1 block text-sm text-zinc-400">
          Description
        </label>
        <textarea
          id="description"
          name="description"
          rows={3}
          className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-base placeholder-zinc-500"
          placeholder="Short description of the service"
        />
      </div>
      {state?.error && (
        <p className="text-sm text-red-400">{state.error}</p>
      )}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={isPending}
          className="rounded-lg bg-blue-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 min-h-[48px]"
        >
          {isPending ? "Creating…" : "Create service"}
        </button>
      </div>
    </form>
  );
}

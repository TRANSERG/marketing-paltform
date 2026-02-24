"use client";

import { useState } from "react";
import { Spinner } from "@/components/Spinner";
import { useRouter } from "next/navigation";

interface AddUserFormProps {
  roles: { id: string; name: string }[];
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PASSWORD_MIN_LENGTH = 6;
const DISPLAY_NAME_MAX_LENGTH = 100;

export function AddUserForm({ roles }: AddUserFormProps) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [roleId, setRoleId] = useState(roles[0]?.id ?? "");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "ok" | "error"; text: string } | null>(null);
  const [errors, setErrors] = useState<{
    email?: string;
    password?: string;
    confirmPassword?: string;
    displayName?: string;
    role?: string;
  }>({});

  function validate(): boolean {
    const next: typeof errors = {};
    const trimmedEmail = email.trim();
    const trimmedDisplayName = displayName.trim();

    if (!trimmedEmail) {
      next.email = "Email is required.";
    } else if (!EMAIL_REGEX.test(trimmedEmail)) {
      next.email = "Enter a valid email address.";
    }

    if (!password) {
      next.password = "Password is required.";
    } else if (password.length < PASSWORD_MIN_LENGTH) {
      next.password = `Password must be at least ${PASSWORD_MIN_LENGTH} characters.`;
    }

    if (!confirmPassword) {
      next.confirmPassword = "Please confirm your password.";
    } else if (password !== confirmPassword) {
      next.confirmPassword = "Passwords do not match.";
    }

    if (trimmedDisplayName.length > DISPLAY_NAME_MAX_LENGTH) {
      next.displayName = `Display name must be ${DISPLAY_NAME_MAX_LENGTH} characters or less.`;
    }

    if (!roleId) {
      next.role = "Please select a role.";
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage(null);
    setErrors({});
    if (!validate()) return;

    setLoading(true);
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: email.trim(),
        password,
        display_name: displayName.trim() || undefined,
        role_id: roleId,
      }),
    });
    const data = await res.json().catch(() => ({}));
    setLoading(false);
    if (res.ok) {
      setMessage({ type: "ok", text: "User created." });
      setEmail("");
      setPassword("");
      setConfirmPassword("");
      setDisplayName("");
      setErrors({});
      router.refresh();
    } else {
      setMessage({ type: "error", text: data.error ?? "Failed to create user" });
    }
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-wrap items-end gap-3">
      <div>
        <label htmlFor="add-user-email" className="mb-1 block text-sm text-zinc-400">
          Email
        </label>
        <input
          id="add-user-email"
          type="email"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (errors.email) setErrors((p) => ({ ...p, email: undefined }));
          }}
          required
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="user@example.com"
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "add-user-email-error" : undefined}
        />
        {errors.email && (
          <p id="add-user-email-error" className="mt-1 text-xs text-red-400">
            {errors.email}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="add-user-password" className="mb-1 block text-sm text-zinc-400">
          Password
        </label>
        <input
          id="add-user-password"
          type="password"
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            if (errors.password) setErrors((p) => ({ ...p, password: undefined }));
            if (errors.confirmPassword && e.target.value === confirmPassword) {
              setErrors((p) => ({ ...p, confirmPassword: undefined }));
            }
          }}
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder={`Min ${PASSWORD_MIN_LENGTH} characters`}
          aria-invalid={!!errors.password}
          aria-describedby={errors.password ? "add-user-password-error" : undefined}
        />
        {errors.password && (
          <p id="add-user-password-error" className="mt-1 text-xs text-red-400">
            {errors.password}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="add-user-confirm-password" className="mb-1 block text-sm text-zinc-400">
          Confirm password
        </label>
        <input
          id="add-user-confirm-password"
          type="password"
          value={confirmPassword}
          onChange={(e) => {
            setConfirmPassword(e.target.value);
            if (errors.confirmPassword) setErrors((p) => ({ ...p, confirmPassword: undefined }));
          }}
          required
          minLength={PASSWORD_MIN_LENGTH}
          autoComplete="new-password"
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Repeat password"
          aria-invalid={!!errors.confirmPassword}
          aria-describedby={errors.confirmPassword ? "add-user-confirm-password-error" : undefined}
        />
        {errors.confirmPassword && (
          <p id="add-user-confirm-password-error" className="mt-1 text-xs text-red-400">
            {errors.confirmPassword}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="add-user-display-name" className="mb-1 block text-sm text-zinc-400">
          Display name
        </label>
        <input
          id="add-user-display-name"
          type="text"
          value={displayName}
          onChange={(e) => {
            setDisplayName(e.target.value);
            if (errors.displayName) setErrors((p) => ({ ...p, displayName: undefined }));
          }}
          maxLength={DISPLAY_NAME_MAX_LENGTH}
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          placeholder="Optional"
          aria-invalid={!!errors.displayName}
          aria-describedby={errors.displayName ? "add-user-display-name-error" : undefined}
        />
        {errors.displayName && (
          <p id="add-user-display-name-error" className="mt-1 text-xs text-red-400">
            {errors.displayName}
          </p>
        )}
      </div>
      <div>
        <label htmlFor="add-user-role" className="mb-1 block text-sm text-zinc-400">
          Role
        </label>
        <select
          id="add-user-role"
          value={roleId}
          onChange={(e) => {
            setRoleId(e.target.value);
            if (errors.role) setErrors((p) => ({ ...p, role: undefined }));
          }}
          required
          className="rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          aria-invalid={!!errors.role}
          aria-describedby={errors.role ? "add-user-role-error" : undefined}
        >
          {roles.map((r) => (
            <option key={r.id} value={r.id}>
              {r.name}
            </option>
          ))}
        </select>
        {errors.role && (
          <p id="add-user-role-error" className="mt-1 text-xs text-red-400">
            {errors.role}
          </p>
        )}
      </div>
      <button
        type="submit"
        disabled={loading}
        className="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 inline-flex items-center gap-2"
      >
        {loading ? (
          <>
            <Spinner size="sm" className="shrink-0" />
            Creating…
          </>
        ) : (
          "Add user"
        )}
      </button>
      {message && (
        <span className={message.type === "ok" ? "text-green-400" : "text-red-400"}>
          {message.text}
        </span>
      )}
    </form>
  );
}

import { createClient } from "@/lib/supabase/server";
import type { AuthUser, RoleName } from "@/types/auth";

interface JWTClaims {
  sub?: string;
  email?: string;
  user_role?: string;
  user_roles?: string[];
  permissions?: string[];
}

export async function getAuthUser(): Promise<AuthUser | null> {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session?.user) return null;

  const user = session.user;
  let user_role: RoleName | undefined;
  let user_roles: RoleName[] | undefined;
  let permissions: string[] | undefined;

  try {
    const token = (session as { access_token?: string }).access_token;
    if (token) {
      const { decodeJwt } = await import("jose");
      const payload = decodeJwt(token) as JWTClaims & { claims?: JWTClaims };
      const claims = payload.claims ?? payload;
      user_role = claims.user_role as RoleName | undefined;
      user_roles = Array.isArray(claims.user_roles)
        ? (claims.user_roles as RoleName[])
        : undefined;
      permissions = Array.isArray(claims.permissions)
        ? (claims.permissions as string[])
        : undefined;
    }
  } catch {
    // ignore JWT parse errors
  }

  return {
    id: user.id,
    email: user.email ?? undefined,
    user_role,
    user_roles,
    permissions,
  };
}

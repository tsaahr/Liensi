import { redirect } from "next/navigation";

import { createClient } from "@/lib/supabase/server";
import type { User } from "@supabase/supabase-js";

type CurrentSession = {
  user: User | null;
  isAdmin: boolean;
};

export async function getCurrentSession(): Promise<CurrentSession> {
  try {
    const supabase = await createClient();
    const {
      data: { user }
    } = await supabase.auth.getUser();

    if (!user) {
      return { user: null, isAdmin: false };
    }

    const { data, error } = await supabase.rpc("is_admin");

    if (error) {
      return { user, isAdmin: false };
    }

    return { user, isAdmin: Boolean(data) };
  } catch {
    return { user: null, isAdmin: false };
  }
}

export async function getCurrentUser() {
  const { user } = await getCurrentSession();
  return user;
}

export async function getCurrentAdmin() {
  const { user, isAdmin } = await getCurrentSession();
  return isAdmin ? user : null;
}

export async function requireAdmin() {
  const user = await getCurrentAdmin();

  if (!user) {
    redirect("/admin/login");
  }

  return user;
}

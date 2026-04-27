import type { AuthChangeEvent, Session } from "@supabase/supabase-js";
import { createClient } from "@/services/supabase/client";

export type Profile = {
  id: string;
  full_name: string | null;
  avatar_url: string | null;
  hourly_rate: number | null;
  created_at: string;
  updated_at: string;
};

type AuthStateChangeCallback = (
  event: AuthChangeEvent,
  session: Session | null,
) => void;

let browserSupabase = createClient();

function getSupabaseClient() {
  return browserSupabase;
}

function clearClientStorage() {
  if (typeof window === "undefined") {
    return;
  }

  const theme = window.localStorage.getItem("theme");
  window.localStorage.clear();
  if (theme) {
    window.localStorage.setItem("theme", theme);
  }
  window.sessionStorage.clear();
}

export async function signIn(email: string, password: string) {
  await signOut();
  clearClientStorage();

  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: email.trim(),
    password,
  });

  if (error) {
    throw error;
  }

  return data.session;
}

export async function signUp(
  email: string,
  password: string,
  fullName: string,
) {
  const supabase = getSupabaseClient();
  const emailRedirectTo =
    typeof window === "undefined" ? undefined : `${window.location.origin}/`;

  const { data, error } = await supabase.auth.signUp({
    email: email.trim(),
    password,
    options: {
      data: {
        full_name: fullName.trim(),
      },
      emailRedirectTo,
    },
  });

  if (error) {
    throw error;
  }

  return {
    session: data.session,
    redirectTo: data.session ? "/" : "/login",
  };
}

export async function signOut() {
  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.auth.signOut();

    if (error) {
      throw error;
    }
  } finally {
    clearClientStorage();
    browserSupabase = createClient();
  }
}

export async function getSession() {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase.auth.getSession();

  if (error) {
    throw error;
  }

  return data.session;
}

export function onAuthStateChange(callback: AuthStateChangeCallback) {
  const supabase = getSupabaseClient();
  const {
    data: { subscription },
  } = supabase.auth.onAuthStateChange(callback);

  return () => {
    subscription.unsubscribe();
  };
}

export async function getProfile(userId: string) {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("profiles")
    .select("id, full_name, avatar_url, hourly_rate, created_at, updated_at")
    .eq("id", userId)
    .single();

  if (error) {
    throw error;
  }

  return data as Profile;
}
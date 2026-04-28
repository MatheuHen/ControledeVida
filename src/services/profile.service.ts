import { createClient } from "@/services/supabase/client";
import type { Profile } from "@/services/auth.service";

const PROFILE_SELECT = "id, full_name, avatar_url, avatar_preset, hourly_rate, cpf, phone, salary_monthly, work_hours_per_day, work_days_per_week, created_at, updated_at";

export type UpdateProfileData = {
  full_name?: string | null;
  avatar_url?: string | null;
  avatar_preset?: string | null;
  hourly_rate?: number | null;
  cpf?: string | null;
  phone?: string | null;
  salary_monthly?: number | null;
  work_hours_per_day?: number | null;
  work_days_per_week?: number | null;
};

const supabase = createClient();

export const profileService = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select(PROFILE_SELECT)
      .eq("id", userId)
      .single();
    if (error) throw error;
    return data as Profile;
  },

  async update(userId: string, data: UpdateProfileData) {
    const { data: updated, error } = await supabase
      .from("profiles")
      .update(data)
      .eq("id", userId)
      .select(PROFILE_SELECT)
      .single();
    if (error) throw error;
    return updated as Profile;
  },
};

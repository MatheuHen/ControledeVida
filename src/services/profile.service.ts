import { createClient } from "@/services/supabase/client";
import type { Profile } from "@/services/auth.service";

export type UpdateProfileData = Partial<
  Omit<Profile, "id" | "created_at" | "updated_at">
>;

const supabase = createClient();

export const profileService = {
  async get(userId: string) {
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, avatar_url, hourly_rate, created_at, updated_at")
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
      .select("id, full_name, avatar_url, hourly_rate, created_at, updated_at")
      .single();
    if (error) throw error;
    return updated as Profile;
  },
};

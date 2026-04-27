import { createClient } from "@/services/supabase/client";

export type SharedAccessPermission = "full" | "finances" | "investments";
export type SharedAccessStatus = "pending" | "accepted" | "revoked";

export type SharedAccess = {
  id: string;
  owner_id: string;
  target_user_id: string | null;
  target_user_email: string;
  permission_level: SharedAccessPermission;
  status: SharedAccessStatus;
  created_at: string;
  updated_at: string;
};

export type CreateSharedAccessData = {
  owner_id: string;
  target_user_email: string;
  permission_level: SharedAccessPermission;
};

const supabase = createClient();

export const sharedService = {
  async getSharedWithMe(userId: string) {
    const { data, error } = await supabase
      .from("shared_access")
      .select("*")
      .eq("target_user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as SharedAccess[];
  },

  async getMyShares(userId: string) {
    const { data, error } = await supabase
      .from("shared_access")
      .select("*")
      .eq("owner_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return data as SharedAccess[];
  },

  async createInvite(data: CreateSharedAccessData) {
    const { data: created, error } = await supabase
      .from("shared_access")
      .insert({ ...data, status: "pending" })
      .select()
      .single();
    if (error) throw error;
    return created as SharedAccess;
  },

  async acceptInvite(id: string, userId: string) {
    const { data: updated, error } = await supabase
      .from("shared_access")
      .update({ status: "accepted", target_user_id: userId })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return updated as SharedAccess;
  },

  async revokeAccess(id: string) {
    const { data: updated, error } = await supabase
      .from("shared_access")
      .update({ status: "revoked" })
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return updated as SharedAccess;
  },
};

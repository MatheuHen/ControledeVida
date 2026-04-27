import { createClient } from "@/services/supabase/client";

export type ReserveEntryType = "deposit" | "withdrawal";

export type ReserveEntry = {
  id: string;
  user_id: string;
  amount: number;
  type: ReserveEntryType;
  description: string | null;
  date: string;
  created_at: string;
  updated_at: string;
};

export type CreateReserveEntryData = Omit<
  ReserveEntry,
  "id" | "created_at" | "updated_at"
>;
export type UpdateReserveEntryData = Partial<
  Omit<ReserveEntry, "id" | "user_id" | "created_at" | "updated_at">
>;

const supabase = createClient();

export const reserveEntriesService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from("reserve_entries")
      .select("*")
      .eq("user_id", userId)
      .order("date", { ascending: false });
    if (error) throw error;
    return data as ReserveEntry[];
  },

  async create(data: CreateReserveEntryData) {
    const { data: created, error } = await supabase
      .from("reserve_entries")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created as ReserveEntry;
  },

  async update(id: string, data: UpdateReserveEntryData) {
    const { data: updated, error } = await supabase
      .from("reserve_entries")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return updated as ReserveEntry;
  },

  async delete(id: string) {
    const { error } = await supabase
      .from("reserve_entries")
      .delete()
      .eq("id", id);
    if (error) throw error;
  },
};

import { createClient } from "@/services/supabase/client";
import type { TransactionType } from "@/services/transactions.service";

export type Category = {
  id: string;
  user_id: string;
  name: string;
  type: TransactionType;
  color: string | null;
  icon: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateCategoryData = Omit<Category, "id" | "created_at" | "updated_at">;
export type UpdateCategoryData = Partial<
  Omit<Category, "id" | "user_id" | "created_at" | "updated_at">
>;

const supabase = createClient();

export const categoriesService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from("categories")
      .select("*")
      .eq("user_id", userId)
      .order("name");
    if (error) throw error;
    return data as Category[];
  },

  async create(data: CreateCategoryData) {
    const { data: created, error } = await supabase
      .from("categories")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created as Category;
  },

  async update(id: string, data: UpdateCategoryData) {
    const { data: updated, error } = await supabase
      .from("categories")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return updated as Category;
  },

  async delete(id: string) {
    const { error } = await supabase.from("categories").delete().eq("id", id);
    if (error) throw error;
  },
};

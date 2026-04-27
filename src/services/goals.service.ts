import { createClient } from "@/services/supabase/client";

export type GoalStatus = "active" | "completed" | "failed" | "paused" | "late";
export type GoalType = "economy" | "limit" | "debt";

export type Goal = {
  id: string;
  user_id: string;
  name: string;
  type: GoalType;
  target_amount: number;
  current_amount: number;
  status: GoalStatus;
  start_date: string;
  end_date: string;
  description: string | null;
  created_at: string;
  updated_at: string;
};

export type CreateGoalData = Omit<Goal, "id" | "created_at" | "updated_at">;
export type UpdateGoalData = Partial<
  Omit<Goal, "id" | "user_id" | "created_at" | "updated_at">
>;

const supabase = createClient();

export const goalsService = {
  async getAll(userId: string) {
    const { data, error } = await supabase
      .from("goals")
      .select("*")
      .eq("user_id", userId)
      .order("end_date");
    if (error) throw error;
    return data as Goal[];
  },

  async create(data: CreateGoalData) {
    const { data: created, error } = await supabase
      .from("goals")
      .insert(data)
      .select()
      .single();
    if (error) throw error;
    return created as Goal;
  },

  async update(id: string, data: UpdateGoalData) {
    const { data: updated, error } = await supabase
      .from("goals")
      .update(data)
      .eq("id", id)
      .select()
      .single();
    if (error) throw error;
    return updated as Goal;
  },

  async delete(id: string) {
    const { error } = await supabase.from("goals").delete().eq("id", id);
    if (error) throw error;
  },
};

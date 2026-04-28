import { createClient } from "@/lib/supabase/client";
import { format, subDays } from "date-fns";

export interface StreakData {
  current_streak: number;
  longest_streak: number;
}

export const streakService = {
  async get(userId: string): Promise<StreakData> {
    const supabase = createClient();
    const { data } = await supabase
      .from("user_streaks").select("current_streak, longest_streak").eq("user_id", userId).single();
    return data ?? { current_streak: 0, longest_streak: 0 };
  },

  async recordActivity(userId: string): Promise<number> {
    const supabase = createClient();
    const today = format(new Date(), "yyyy-MM-dd");
    const yesterday = format(subDays(new Date(), 1), "yyyy-MM-dd");

    const { data: existing } = await supabase
      .from("user_streaks").select("*").eq("user_id", userId).single();

    if (!existing) {
      await supabase.from("user_streaks").insert({
        user_id: userId, current_streak: 1, longest_streak: 1, last_activity_date: today,
      });
      return 1;
    }

    if (existing.last_activity_date === today) return existing.current_streak;

    const newStreak = existing.last_activity_date === yesterday ? existing.current_streak + 1 : 1;
    const newLongest = Math.max(newStreak, existing.longest_streak);

    await supabase.from("user_streaks").update({
      current_streak: newStreak, longest_streak: newLongest,
      last_activity_date: today, updated_at: new Date().toISOString(),
    }).eq("user_id", userId);

    return newStreak;
  },
};

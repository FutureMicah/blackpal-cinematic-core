import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export interface Mission {
  id: string;
  title: string;
  description?: string;
  xp_reward: number;
  coin_reward: number;
  est_minutes: number;
  mission_type: string;
  order_index: number;
}

export interface UserMission extends Mission {
  user_mission_id: string;
  status: string;
  progress_percent: number;
  completed_at?: string;
}

export const useBlackBoardData = () => {
  const [missions, setMissions] = useState<UserMission[]>([]);
  const [currentLesson, setCurrentLesson] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      // Load missions
      const { data: activeMissions } = await supabase
        .from('missions')
        .select('*')
        .eq('is_active', true)
        .order('order_index');

      if (activeMissions) {
        // Check if user has mission entries, create if not
        for (const mission of activeMissions) {
          const { error } = await supabase
            .from('user_missions')
            .upsert({
              user_id: user.id,
              mission_id: mission.id,
              status: 'pending',
              progress_percent: 0
            }, {
              onConflict: 'user_id,mission_id',
              ignoreDuplicates: true
            });
        }

        // Fetch user missions with details
        const { data: userMissions } = await supabase
          .from('user_missions')
          .select(`
            id,
            status,
            progress_percent,
            completed_at,
            missions (
              id,
              title,
              description,
              xp_reward,
              coin_reward,
              est_minutes,
              mission_type,
              order_index
            )
          `)
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (userMissions) {
          const formatted = userMissions.map((um: any) => ({
            user_mission_id: um.id,
            status: um.status,
            progress_percent: um.progress_percent,
            completed_at: um.completed_at,
            id: um.missions.id,
            title: um.missions.title,
            description: um.missions.description,
            xp_reward: um.missions.xp_reward,
            coin_reward: um.missions.coin_reward,
            est_minutes: um.missions.est_minutes,
            mission_type: um.missions.mission_type,
            order_index: um.missions.order_index,
          }));
          setMissions(formatted);
        }
      }

      // Load current lesson progress
      const { data: lessonProgress } = await supabase
        .from('lesson_progress')
        .select(`
          *,
          lessons (
            id,
            title,
            thumbnail_url,
            duration
          )
        `)
        .eq('user_id', user.id)
        .eq('completed', false)
        .order('last_watched_at', { ascending: false })
        .limit(1)
        .single();

      if (lessonProgress) {
        setCurrentLesson({
          id: lessonProgress.lessons.id,
          title: lessonProgress.lessons.title,
          thumbnail_url: lessonProgress.lessons.thumbnail_url,
          duration: lessonProgress.lessons.duration,
          progress_percent: lessonProgress.progress_percent || 0,
        });
      }
    } catch (error) {
      console.error('Error loading BlackBoard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const refreshMissions = () => {
    loadData();
  };

  return {
    missions,
    currentLesson,
    loading,
    refreshMissions
  };
};

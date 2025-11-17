import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Trophy, Coins, BookOpen, TrendingUp } from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Activity {
  id: string;
  activity_type: string;
  title: string;
  description: string;
  metadata: any;
  created_at: string;
}

const getActivityIcon = (type: string) => {
  switch (type) {
    case 'mission_completed':
      return <Trophy className="w-4 h-4 text-accent" />;
    case 'xp_earned':
      return <TrendingUp className="w-4 h-4 text-primary" />;
    case 'lesson_completed':
      return <BookOpen className="w-4 h-4 text-primary" />;
    case 'coins_earned':
      return <Coins className="w-4 h-4 text-accent" />;
    default:
      return <TrendingUp className="w-4 h-4 text-primary" />;
  }
};

export const ActivityFeed = () => {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadActivities();
    
    // Subscribe to realtime updates
    const channel = supabase
      .channel('activity-feed')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'user_activities'
        },
        (payload) => {
          setActivities(prev => [payload.new as Activity, ...prev].slice(0, 20));
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const loadActivities = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data, error } = await supabase
        .from('user_activities')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20);

      if (error) throw error;
      setActivities(data || []);
    } catch (error) {
      console.error('Error loading activities:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="glass rounded-lg p-3 animate-pulse">
            <div className="h-4 bg-muted rounded w-3/4 mb-2" />
            <div className="h-3 bg-muted rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  if (activities.length === 0) {
    return (
      <div className="glass rounded-lg p-6 text-center text-muted-foreground">
        <p>No activities yet. Complete missions to see your progress here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {activities.map((activity, index) => (
        <div
          key={activity.id}
          className="glass rounded-lg p-3 flex items-start gap-3 hover:bg-muted/30 transition-colors duration-200"
          style={{
            animation: 'slide-in-right 0.3s ease-out',
            animationDelay: `${index * 0.05}s`,
            animationFillMode: 'backwards',
          }}
        >
          <div className="mt-0.5">
            {getActivityIcon(activity.activity_type)}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium">{activity.title}</p>
            <p className="text-xs text-muted-foreground truncate">
              {activity.description}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {formatDistanceToNow(new Date(activity.created_at), { addSuffix: true })}
            </p>
          </div>
          {activity.metadata?.xp && (
            <div className="text-xs font-semibold text-primary whitespace-nowrap">
              +{activity.metadata.xp} XP
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card } from "./ui/card";
import { Loader2 } from "lucide-react";

interface CountryActivity {
  id: string;
  country_code: string;
  country_name: string;
  region: string;
  city: string;
  active_users: number;
  total_xp: number;
  recent_milestones: any;
}

export const CountryHeatmap = () => {
  const [activities, setActivities] = useState<CountryActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedRegion, setSelectedRegion] = useState<CountryActivity | null>(null);

  useEffect(() => {
    fetchCountryActivity();
    
    // Subscribe to real-time updates
    const channel = supabase
      .channel('country-activity-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'country_activity'
        },
        () => {
          fetchCountryActivity();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchCountryActivity = async () => {
    try {
      const { data, error } = await supabase
        .from('country_activity')
        .select('*')
        .order('total_xp', { ascending: false });

      if (error) throw error;
      
      // Parse recent_milestones if it's a JSON string
      const parsedData = (data || []).map(item => ({
        ...item,
        recent_milestones: Array.isArray(item.recent_milestones) 
          ? item.recent_milestones 
          : []
      }));
      
      setActivities(parsedData);
    } catch (error) {
      console.error('Error fetching country activity:', error);
    } finally {
      setLoading(false);
    }
  };

  const getActivityColor = (xp: number) => {
    if (xp > 10000) return 'from-gold via-orange to-gold';
    if (xp > 5000) return 'from-accent via-primary to-accent';
    if (xp > 1000) return 'from-primary via-secondary to-primary';
    return 'from-muted via-border to-muted';
  };

  const getGlowClass = (xp: number) => {
    if (xp > 10000) return 'glow-gold';
    if (xp > 5000) return 'glow-green';
    if (xp > 1000) return 'glow-cyan';
    return '';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold gradient-text-cyber">Global Activity Heatmap</h2>
        <p className="text-muted-foreground">Real-time tracking of academy performance worldwide</p>
      </div>

      {/* 3D Heatmap Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {activities.map((activity, index) => (
          <Card
            key={activity.id}
            className={`glass card-3d p-6 cursor-pointer transition-all duration-300 hover:scale-105 ${getGlowClass(activity.total_xp)}`}
            onClick={() => setSelectedRegion(activity)}
            style={{
              animationDelay: `${index * 100}ms`,
            }}
          >
            <div className="space-y-4">
              {/* Country/Region Header */}
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="text-xl font-bold text-foreground">
                    {activity.country_name}
                  </h3>
                  <p className="text-sm text-muted-foreground">{activity.region || activity.city}</p>
                </div>
                <div className="text-4xl">
                  {activity.country_code === 'NG' && '🇳🇬'}
                  {activity.country_code === 'GH' && '🇬🇭'}
                  {activity.country_code === 'KE' && '🇰🇪'}
                  {activity.country_code === 'ZA' && '🇿🇦'}
                  {activity.country_code === 'US' && '🇺🇸'}
                  {activity.country_code === 'GB' && '🇬🇧'}
                </div>
              </div>

              {/* Activity Metrics */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Active Users</span>
                  <span className="text-lg font-bold gradient-text-cyber">
                    {activity.active_users}
                  </span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Total XP</span>
                  <span className="text-lg font-bold gradient-text-wealth">
                    {activity.total_xp.toLocaleString()}
                  </span>
                </div>
              </div>

              {/* Activity Bar */}
              <div className="relative h-2 bg-muted rounded-full overflow-hidden">
                <div
                  className={`absolute inset-y-0 left-0 bg-gradient-to-r ${getActivityColor(activity.total_xp)} animate-glow-pulse`}
                  style={{
                    width: `${Math.min((activity.total_xp / 15000) * 100, 100)}%`,
                  }}
                />
              </div>

              {/* Floating particles for high activity */}
              {activity.total_xp > 5000 && (
                <div className="absolute inset-0 overflow-hidden pointer-events-none">
                  {[...Array(3)].map((_, i) => (
                    <div
                      key={i}
                      className="absolute w-1 h-1 bg-primary rounded-full animate-particle"
                      style={{
                        left: `${Math.random() * 100}%`,
                        top: `${Math.random() * 100}%`,
                        animationDelay: `${i * 0.5}s`,
                      }}
                    />
                  ))}
                </div>
              )}
            </div>
          </Card>
        ))}
      </div>

      {/* Selected Region Detail Modal */}
      {selectedRegion && (
        <div
          className="fixed inset-0 bg-background/80 backdrop-blur-md flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedRegion(null)}
        >
          <Card
            className="glass-strong max-w-2xl w-full p-8 space-y-6 animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-3xl font-bold gradient-text-cyber">
                  {selectedRegion.country_name}
                </h2>
                <p className="text-muted-foreground">{selectedRegion.region}</p>
              </div>
              <button
                onClick={() => setSelectedRegion(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                ✕
              </button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Active Students</p>
                <p className="text-4xl font-bold gradient-text-cyber">
                  {selectedRegion.active_users}
                </p>
              </div>
              <div className="glass p-4 rounded-lg text-center">
                <p className="text-sm text-muted-foreground mb-2">Total XP Earned</p>
                <p className="text-4xl font-bold gradient-text-wealth">
                  {selectedRegion.total_xp.toLocaleString()}
                </p>
              </div>
            </div>

            {selectedRegion.recent_milestones && Array.isArray(selectedRegion.recent_milestones) && selectedRegion.recent_milestones.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-lg font-semibold">Recent Milestones</h3>
                <div className="space-y-2">
                  {selectedRegion.recent_milestones.map((milestone: any, i: number) => (
                    <div key={i} className="glass p-3 rounded-lg text-sm">
                      {milestone.description || 'Milestone achieved'}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>
      )}
    </div>
  );
};

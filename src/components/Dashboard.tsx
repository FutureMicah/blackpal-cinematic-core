import { TrendingUp, Zap, Trophy, Target, Star, Users } from "lucide-react";
import { BentoCard } from "./BentoCard";
import { StreakMeter } from "./StreakMeter";
import { MilestoneCard } from "./MilestoneCard";
import { Leaderboard } from "./Leaderboard";
import { FloatingNav } from "./FloatingNav";
import { ResumeLessonCard } from "./blackboard/ResumeLessonCard";
import { MissionCard } from "./blackboard/MissionCard";
import { ProgressReactor } from "./blackboard/ProgressReactor";
import { ActivityFeed } from "./blackboard/ActivityFeed";
import { WalletSnapshot } from "./blackboard/WalletSnapshot";
import { useBlackBoardData } from "@/hooks/useBlackBoardData";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Dashboard = () => {
  const { missions, currentLesson, loading, refreshMissions } = useBlackBoardData();
  const [userStats, setUserStats] = useState({ xp: 0, level: 1, xpToNext: 1000 });

  useEffect(() => {
    const loadUserStats = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: profile } = await supabase
        .from('profiles')
        .select('total_xp, current_streak')
        .eq('id', user.id)
        .single();

      if (profile) {
        const level = Math.floor(profile.total_xp / 1000) + 1;
        const xpToNext = level * 1000;
        setUserStats({ xp: profile.total_xp, level, xpToNext });
      }
    };

    loadUserStats();
  }, []);

  return (
    <div className="min-h-screen p-8 pl-24 relative overflow-hidden">
      <FloatingNav />
      {/* Animated background particles */}
      <div className="absolute inset-0 -z-10">
        {[...Array(30)].map((_, i) => (
          <div
            key={i}
            className="absolute w-2 h-2 bg-primary/30 rounded-full animate-particle blur-sm"
            style={{
              left: `${Math.random() * 100}%`,
              top: `${Math.random() * 100}%`,
              animationDelay: `${Math.random() * 5}s`,
              animationDuration: `${5 + Math.random() * 5}s`,
            }}
          />
        ))}
      </div>

      {/* Header */}
      <header className="mb-12 animate-slide-up">
        <div>
          <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold mb-2 gradient-text-cyber">
            Command Center
          </h1>
          <p className="text-base sm:text-lg md:text-xl text-muted-foreground">
            Your portfolio. Your strategy. Your legacy.
          </p>
        </div>
      </header>

      {/* Streak Meter - Prominent */}
      <div className="mb-12 animate-scale-in" style={{ animationDelay: '0.1s' }}>
        <StreakMeter currentStreak={7} totalDays={30} xp={userStats.xp} />
      </div>

      {/* BlackBoard Main Section */}
      <section className="mb-12 space-y-8">
        <h2 className="text-3xl font-bold gradient-text-cyber">BlackBoard</h2>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column: Resume Lesson & Missions */}
          <div className="lg:col-span-2 space-y-6">
            {/* Resume Lesson Card */}
            {currentLesson && (
              <div className="animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <ResumeLessonCard lesson={currentLesson} />
              </div>
            )}

            {/* Today's Missions */}
            <div className="animate-slide-up" style={{ animationDelay: '0.3s' }}>
              <h3 className="text-xl font-bold mb-4">Today's Missions</h3>
              <div className="space-y-3">
                {loading ? (
                  [...Array(3)].map((_, i) => (
                    <div key={i} className="glass rounded-xl p-4 animate-pulse">
                      <div className="h-5 bg-muted rounded w-3/4 mb-2" />
                      <div className="h-4 bg-muted rounded w-1/2" />
                    </div>
                  ))
                ) : (
                  missions.slice(0, 5).map((mission, index) => (
                    <div
                      key={mission.id}
                      style={{
                        animation: 'slide-in-left 0.4s ease-out',
                        animationDelay: `${index * 0.1}s`,
                        animationFillMode: 'backwards',
                      }}
                    >
                      <MissionCard mission={mission} onComplete={refreshMissions} />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Right Column: Reactor, Wallet, Activity */}
          <div className="space-y-6">
            {/* Progress Reactor */}
            <div className="glass rounded-2xl p-8 animate-scale-in" style={{ animationDelay: '0.4s' }}>
              <h3 className="text-xl font-bold mb-6 text-center">XP Reactor</h3>
              <ProgressReactor 
                xp={userStats.xp} 
                xpToNext={userStats.xpToNext} 
                level={userStats.level} 
              />
            </div>

            {/* Wallet Snapshot */}
            <div className="animate-slide-up" style={{ animationDelay: '0.5s' }}>
              <WalletSnapshot />
            </div>

            {/* Activity Feed */}
            <div className="glass rounded-2xl p-6 animate-slide-up" style={{ animationDelay: '0.6s' }}>
              <h3 className="text-lg font-bold mb-4">Recent Activity</h3>
              <ActivityFeed />
            </div>
          </div>
        </div>
      </section>

      {/* Futuristic 3D Bento Grid - Inspired by reference */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-12">
        {/* Large feature card */}
        <BentoCard
          icon={TrendingUp}
          title="Portfolio Value"
          value="$125,430"
          change="+12.5%"
          trend="up"
          delay={0.2}
          size="large"
        />
        
        {/* XP card */}
        <BentoCard
          icon={Zap}
          title="Total XP"
          value={userStats.xp.toLocaleString()}
          subtitle={`Level ${userStats.level} Trader`}
          trend="neutral"
          delay={0.3}
        />
        
        {/* Coins card */}
        <BentoCard
          icon={Trophy}
          title="Coins Earned"
          value="3,420"
          subtitle="Top 15% this week"
          trend="up"
          delay={0.4}
        />
        
        {/* Missions card */}
        <BentoCard
          icon={Target}
          title="Missions Complete"
          value={`${missions.filter(m => m.status === 'completed').length}/${missions.length}`}
          subtitle={`${missions.filter(m => m.status === 'pending').length} remaining`}
          trend="neutral"
          delay={0.5}
        />
        
        {/* Streak card */}
        <BentoCard
          icon={Star}
          title="Streak Bonus"
          value="2.5x"
          subtitle="7-day active"
          trend="up"
          delay={0.6}
        />
        
        {/* Global rank - glass style */}
        <BentoCard
          icon={Users}
          title="Global Rank"
          value="#342"
          subtitle="Top 5%"
          trend="up"
          delay={0.7}
        />
      </div>

      {/* Milestones Section */}
      <section className="mb-12">
        <h2 className="text-3xl font-bold mb-6 gradient-text-wealth">
          Recent Milestones
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <MilestoneCard
            title="7-Day Streak Master"
            description="Maintained trading activity for 7 consecutive days"
            xpReward={500}
            coinReward={200}
            unlocked={true}
            delay={0.8}
          />
          <MilestoneCard
            title="First Profit"
            description="Achieved your first profitable trade"
            xpReward={250}
            coinReward={100}
            unlocked={true}
            delay={0.9}
          />
          <MilestoneCard
            title="Strategy Specialist"
            description="Complete 10 advanced trading lessons"
            xpReward={1000}
            coinReward={500}
            unlocked={false}
            progress={7}
            total={10}
            delay={1.0}
          />
        </div>
      </section>

      {/* Leaderboard */}
      <section className="animate-slide-up" style={{ animationDelay: '1.1s' }}>
        <h2 className="text-3xl font-bold mb-6 gradient-text-cyber">
          Global Leaderboard
        </h2>
        <Leaderboard />
      </section>
    </div>
  );
};

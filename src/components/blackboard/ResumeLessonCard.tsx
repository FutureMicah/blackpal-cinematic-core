import { useState } from "react";
import { Play, Clock } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface ResumeLessonCardProps {
  lesson: {
    id: string;
    title: string;
    thumbnail_url?: string;
    progress_percent: number;
    duration: number;
  };
}

export const ResumeLessonCard = ({ lesson }: ResumeLessonCardProps) => {
  const [isHovered, setIsHovered] = useState(false);
  const navigate = useNavigate();
  
  const progress = lesson.progress_percent || 0;
  const remainingTime = Math.ceil((lesson.duration * (100 - progress)) / 100);

  return (
    <div
      className="group glass rounded-2xl p-6 cursor-pointer relative overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:-translate-y-2"
      style={{
        transform: isHovered ? 'perspective(1000px) rotateX(2deg) rotateY(-3deg)' : 'none',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => navigate(`/blackboard`)}
    >
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

      <div className="relative flex gap-6">
        {/* Thumbnail */}
        <div className="relative w-32 h-32 rounded-xl overflow-hidden flex-shrink-0">
          {lesson.thumbnail_url ? (
            <img 
              src={lesson.thumbnail_url} 
              alt={lesson.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Play className="w-12 h-12 text-primary" />
            </div>
          )}
          
          {/* Circular progress */}
          <svg className="absolute inset-0 w-full h-full -rotate-90" viewBox="0 0 100 100">
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--muted))"
              strokeWidth="2"
              opacity="0.3"
            />
            <circle
              cx="50"
              cy="50"
              r="45"
              fill="none"
              stroke="hsl(var(--primary))"
              strokeWidth="2"
              strokeDasharray={`${progress * 2.827} 282.7`}
              className="transition-all duration-800"
              style={{ filter: 'drop-shadow(0 0 8px hsl(var(--primary)))' }}
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 flex flex-col justify-between">
          <div>
            <h3 className="text-xl font-bold mb-2 gradient-text-cyber">
              {lesson.title}
            </h3>
            <p className="text-sm text-muted-foreground mb-3">
              Continue where you left off
            </p>
            <div className="flex items-center gap-4 text-sm">
              <div className="flex items-center gap-1">
                <Clock className="w-4 h-4 text-primary" />
                <span className="text-muted-foreground">{remainingTime} min left</span>
              </div>
              <div className="text-primary font-semibold">
                {Math.round(progress)}% complete
              </div>
            </div>
          </div>

          <button
            className="mt-4 flex items-center gap-2 px-4 py-2 rounded-lg bg-primary/10 hover:bg-primary/20 border border-primary/30 text-primary font-semibold transition-all duration-200 hover:scale-105 w-fit"
          >
            <Play className="w-4 h-4" />
            Resume Lesson
          </button>
        </div>
      </div>

      {/* Hover particles */}
      {isHovered && (
        <div className="absolute inset-0 pointer-events-none">
          {[...Array(8)].map((_, i) => (
            <div
              key={i}
              className="absolute w-1 h-1 bg-primary rounded-full animate-particle"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random()}s`,
              }}
            />
          ))}
        </div>
      )}
    </div>
  );
};

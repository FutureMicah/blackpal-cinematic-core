-- Create enum for lesson difficulty
CREATE TYPE lesson_difficulty AS ENUM ('beginner', 'intermediate', 'advanced');

-- Create enum for XP source types
CREATE TYPE xp_source AS ENUM ('lesson_completion', 'quiz_pass', 'streak_bonus', 'milestone', 'daily_login');

-- Courses/Modules table
CREATE TABLE courses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT NOT NULL,
  description TEXT,
  difficulty lesson_difficulty DEFAULT 'beginner',
  thumbnail_url TEXT,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lessons table
CREATE TABLE lessons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  video_url TEXT NOT NULL,
  duration INTEGER NOT NULL, -- in seconds
  thumbnail_url TEXT,
  order_index INTEGER DEFAULT 0,
  xp_reward INTEGER DEFAULT 25,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Lesson progress tracking
CREATE TABLE lesson_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  progress_percent DECIMAL(5,2) DEFAULT 0 CHECK (progress_percent >= 0 AND progress_percent <= 100),
  completed BOOLEAN DEFAULT FALSE,
  last_watched_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(user_id, lesson_id)
);

-- Quizzes table
CREATE TABLE quizzes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  lesson_id UUID NOT NULL REFERENCES lessons(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options JSONB NOT NULL, -- Array of options
  correct_answer INTEGER NOT NULL, -- Index of correct option
  explanation TEXT,
  xp_reward INTEGER DEFAULT 40,
  order_index INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Quiz attempts
CREATE TABLE quiz_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  quiz_id UUID NOT NULL REFERENCES quizzes(id) ON DELETE CASCADE,
  selected_answer INTEGER NOT NULL,
  is_correct BOOLEAN NOT NULL,
  xp_earned INTEGER DEFAULT 0,
  time_spent INTEGER, -- in seconds
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- XP transactions ledger
CREATE TABLE xp_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL,
  source xp_source NOT NULL,
  reference_id UUID, -- ID of the lesson/quiz/etc that triggered XP
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Add XP and streak columns to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS total_xp INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS current_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS longest_streak INTEGER DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_activity_date DATE;

-- Create indexes for performance
CREATE INDEX idx_lessons_course_id ON lessons(course_id);
CREATE INDEX idx_lesson_progress_user_id ON lesson_progress(user_id);
CREATE INDEX idx_lesson_progress_lesson_id ON lesson_progress(lesson_id);
CREATE INDEX idx_quizzes_lesson_id ON quizzes(lesson_id);
CREATE INDEX idx_quiz_attempts_user_id ON quiz_attempts(user_id);
CREATE INDEX idx_xp_transactions_user_id ON xp_transactions(user_id);

-- Enable RLS
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE lessons ENABLE ROW LEVEL SECURITY;
ALTER TABLE lesson_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quiz_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE xp_transactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for courses (public read, admin write)
CREATE POLICY "Courses are viewable by everyone" ON courses FOR SELECT USING (true);
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for lessons (public read, admin write)
CREATE POLICY "Lessons are viewable by everyone" ON lessons FOR SELECT USING (true);
CREATE POLICY "Admins can manage lessons" ON lessons FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for lesson_progress (users own their progress)
CREATE POLICY "Users can view their own progress" ON lesson_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own progress" ON lesson_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own progress" ON lesson_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON lesson_progress FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for quizzes (public read, admin write)
CREATE POLICY "Quizzes are viewable by everyone" ON quizzes FOR SELECT USING (true);
CREATE POLICY "Admins can manage quizzes" ON quizzes FOR ALL USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for quiz_attempts (users own their attempts)
CREATE POLICY "Users can view their own attempts" ON quiz_attempts FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own attempts" ON quiz_attempts FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all attempts" ON quiz_attempts FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- RLS Policies for xp_transactions (users see their own, admins see all)
CREATE POLICY "Users can view their own XP" ON xp_transactions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all XP" ON xp_transactions FOR SELECT USING (has_role(auth.uid(), 'admin'));

-- Function to award XP and update profile
CREATE OR REPLACE FUNCTION award_xp(
  p_user_id UUID,
  p_amount INTEGER,
  p_source xp_source,
  p_reference_id UUID DEFAULT NULL,
  p_description TEXT DEFAULT NULL
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Insert XP transaction
  INSERT INTO xp_transactions (user_id, amount, source, reference_id, description)
  VALUES (p_user_id, p_amount, p_source, p_reference_id, p_description);
  
  -- Update user's total XP
  UPDATE profiles
  SET total_xp = total_xp + p_amount,
      updated_at = NOW()
  WHERE id = p_user_id;
END;
$$;

-- Trigger to update lesson progress completion
CREATE OR REPLACE FUNCTION update_lesson_completion()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
  -- If progress reaches 90% or more, mark as completed
  IF NEW.progress_percent >= 90 AND NOT NEW.completed THEN
    NEW.completed = TRUE;
    NEW.completed_at = NOW();
    
    -- Award XP for lesson completion
    PERFORM award_xp(
      NEW.user_id,
      (SELECT xp_reward FROM lessons WHERE id = NEW.lesson_id),
      'lesson_completion',
      NEW.lesson_id,
      'Completed lesson'
    );
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER lesson_progress_completion
  BEFORE UPDATE ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_lesson_completion();

-- Trigger to update streak
CREATE OR REPLACE FUNCTION update_user_streak()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
  days_diff INTEGER;
BEGIN
  -- Calculate days since last activity
  SELECT EXTRACT(DAY FROM (CURRENT_DATE - last_activity_date))::INTEGER
  INTO days_diff
  FROM profiles
  WHERE id = NEW.user_id;
  
  -- Update streak logic
  IF days_diff IS NULL OR days_diff > 1 THEN
    -- Reset streak if more than 1 day gap
    UPDATE profiles
    SET current_streak = 1,
        last_activity_date = CURRENT_DATE
    WHERE id = NEW.user_id;
  ELSIF days_diff = 1 THEN
    -- Increment streak
    UPDATE profiles
    SET current_streak = current_streak + 1,
        longest_streak = GREATEST(longest_streak, current_streak + 1),
        last_activity_date = CURRENT_DATE
    WHERE id = NEW.user_id;
  END IF;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER update_streak_on_progress
  AFTER INSERT ON lesson_progress
  FOR EACH ROW
  EXECUTE FUNCTION update_user_streak();

-- Insert sample data
INSERT INTO courses (title, description, difficulty, order_index) VALUES
('Technical Analysis Mastery', 'Master the art of reading charts and identifying trading patterns', 'beginner', 1),
('Risk Management Fundamentals', 'Learn to protect your capital and manage trading risks effectively', 'beginner', 2),
('Advanced Trading Strategies', 'Develop sophisticated trading strategies for consistent profits', 'intermediate', 3),
('Algorithmic Trading', 'Build and deploy automated trading systems', 'advanced', 4);

-- Insert sample lessons for first course
INSERT INTO lessons (course_id, title, description, video_url, duration, order_index, xp_reward)
SELECT 
  c.id,
  'Introduction to Trading',
  'Learn the fundamentals of trading and market analysis',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  1200,
  1,
  25
FROM courses c WHERE c.title = 'Technical Analysis Mastery';

INSERT INTO lessons (course_id, title, description, video_url, duration, order_index, xp_reward)
SELECT 
  c.id,
  'Understanding Candlestick Patterns',
  'Master the language of price action through candlestick analysis',
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  1800,
  2,
  25
FROM courses c WHERE c.title = 'Technical Analysis Mastery';

-- Insert sample quizzes
INSERT INTO quizzes (lesson_id, question, options, correct_answer, explanation, xp_reward, order_index)
SELECT 
  l.id,
  'What is the primary purpose of technical analysis?',
  '["To predict future prices", "To analyze company financials", "To identify market sentiment", "To calculate intrinsic value"]'::jsonb,
  0,
  'Technical analysis focuses on predicting future price movements based on historical price data and patterns.',
  40,
  1
FROM lessons l WHERE l.title = 'Introduction to Trading';

INSERT INTO quizzes (lesson_id, question, options, correct_answer, explanation, xp_reward, order_index)
SELECT 
  l.id,
  'What does a bullish candlestick pattern indicate?',
  '["Price will go up", "Price will go down", "Market is neutral", "High volatility"]'::jsonb,
  0,
  'Bullish patterns suggest upward price movement and buying pressure.',
  40,
  1
FROM lessons l WHERE l.title = 'Understanding Candlestick Patterns';
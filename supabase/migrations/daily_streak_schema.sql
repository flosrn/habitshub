-- Daily Streak Schema
-- This schema adds support for tracking daily streaks (GitHub commits + logins)

-- Create user_streaks table to track streak data
CREATE TABLE IF NOT EXISTS public.user_streaks (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  current_streak INT NOT NULL DEFAULT 0,
  longest_streak INT NOT NULL DEFAULT 0,
  last_login_date DATE,
  last_commit_date DATE,
  last_reward_claimed_date DATE,
  total_xp INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Add comment for documentation
COMMENT ON TABLE public.user_streaks IS 'Tracks user daily streaks from both GitHub commits and application logins';

-- Create daily_activities table to track specific daily activities
CREATE TABLE IF NOT EXISTS public.daily_activities (
  id UUID PRIMARY KEY DEFAULT extensions.uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
  has_github_commit BOOLEAN NOT NULL DEFAULT FALSE,
  has_logged_in BOOLEAN NOT NULL DEFAULT FALSE,
  reward_claimed BOOLEAN NOT NULL DEFAULT FALSE,
  xp_earned INT NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  UNIQUE(user_id, activity_date)
);

-- Add comment for documentation
COMMENT ON TABLE public.daily_activities IS 'Records daily user activities for streak tracking';

-- Enable Row Level Security (RLS) on both tables
ALTER TABLE public.user_streaks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.daily_activities ENABLE ROW LEVEL SECURITY;

-- Create policies to allow users to read their own streak data
CREATE POLICY user_streaks_select ON public.user_streaks 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Create policies to allow users to read their own daily activities
CREATE POLICY daily_activities_select ON public.daily_activities 
  FOR SELECT TO authenticated 
  USING (user_id = auth.uid());

-- Create function to update user streak when activity is recorded
CREATE OR REPLACE FUNCTION public.update_user_streak()
RETURNS TRIGGER AS $$
DECLARE
  streak_record RECORD;
  is_streak_active BOOLEAN;
  yesterday DATE := CURRENT_DATE - INTERVAL '1 day';
BEGIN
  -- Get or create user streak record
  SELECT * INTO streak_record FROM public.user_streaks 
  WHERE user_id = NEW.user_id;
  
  IF NOT FOUND THEN
    INSERT INTO public.user_streaks (user_id) 
    VALUES (NEW.user_id)
    RETURNING * INTO streak_record;
  END IF;
  
  -- Update last login or commit date if applicable
  IF NEW.has_logged_in THEN
    UPDATE public.user_streaks 
    SET last_login_date = NEW.activity_date
    WHERE user_id = NEW.user_id;
  END IF;
  
  IF NEW.has_github_commit THEN
    UPDATE public.user_streaks 
    SET last_commit_date = NEW.activity_date
    WHERE user_id = NEW.user_id;
  END IF;
  
  -- Update streak count and last reward claimed date if a reward was claimed
  IF NEW.reward_claimed AND NOT OLD.reward_claimed THEN
    -- Check if both activities were completed
    IF NEW.has_logged_in AND NEW.has_github_commit THEN
      -- Check if the streak is active (yesterday had activity)
      SELECT EXISTS(
        SELECT 1 FROM public.daily_activities
        WHERE user_id = NEW.user_id 
        AND activity_date = yesterday
        AND has_logged_in = TRUE 
        AND has_github_commit = TRUE
        AND reward_claimed = TRUE
      ) INTO is_streak_active;
      
      -- Update the streak count accordingly
      UPDATE public.user_streaks 
      SET 
        current_streak = CASE 
          WHEN is_streak_active THEN current_streak + 1
          ELSE 1
        END,
        longest_streak = GREATEST(
          CASE 
            WHEN is_streak_active THEN current_streak + 1
            ELSE 1
          END, 
          longest_streak
        ),
        last_reward_claimed_date = NEW.activity_date,
        total_xp = total_xp + NEW.xp_earned,
        updated_at = NOW()
      WHERE user_id = NEW.user_id;
    END IF;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create triggers to update user streak when activities are updated
CREATE TRIGGER update_user_streak_on_activity
  AFTER INSERT OR UPDATE ON public.daily_activities
  FOR EACH ROW
  EXECUTE FUNCTION public.update_user_streak();

-- Function to insert or update daily activity record
CREATE OR REPLACE FUNCTION public.record_daily_activity(
  p_user_id UUID,
  p_activity_date DATE,
  p_has_github_commit BOOLEAN DEFAULT NULL,
  p_has_logged_in BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  -- Attempt to insert a new record, or update if it already exists
  INSERT INTO public.daily_activities 
    (user_id, activity_date, has_github_commit, has_logged_in)
  VALUES 
    (p_user_id, p_activity_date, 
     COALESCE(p_has_github_commit, FALSE), 
     COALESCE(p_has_logged_in, FALSE))
  ON CONFLICT (user_id, activity_date) 
  DO UPDATE SET
    has_github_commit = COALESCE(p_has_github_commit, daily_activities.has_github_commit),
    has_logged_in = COALESCE(p_has_logged_in, daily_activities.has_logged_in),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to claim daily reward
CREATE OR REPLACE FUNCTION public.claim_daily_reward(
  p_user_id UUID,
  p_activity_date DATE DEFAULT CURRENT_DATE
)
RETURNS BOOLEAN AS $$
DECLARE
  xp_to_award INT;
  streak_count INT;
  is_eligible BOOLEAN;
BEGIN
  -- Check if user is eligible for reward (has both activities and hasn't claimed today)
  SELECT 
    has_github_commit AND has_logged_in AND NOT reward_claimed INTO is_eligible
  FROM public.daily_activities
  WHERE user_id = p_user_id AND activity_date = p_activity_date;
  
  -- If no record exists, they're not eligible
  IF is_eligible IS NULL THEN
    RETURN FALSE;
  END IF;
  
  -- If eligible, calculate XP based on current streak
  IF is_eligible THEN
    -- Get current streak
    SELECT current_streak INTO streak_count FROM public.user_streaks
    WHERE user_id = p_user_id;
    
    -- Calculate XP (base + streak bonus)
    xp_to_award := 50 + (streak_count * 10);
    
    -- Award the XP and mark reward as claimed
    UPDATE public.daily_activities
    SET 
      reward_claimed = TRUE,
      xp_earned = xp_to_award,
      updated_at = NOW()
    WHERE user_id = p_user_id AND activity_date = p_activity_date;
    
    RETURN TRUE;
  END IF;
  
  RETURN FALSE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Policies to allow mutations through RPC functions only
CREATE POLICY "Users can update their own streaks via functions" 
  ON public.user_streaks FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());

CREATE POLICY "Users can update their own activities via functions" 
  ON public.daily_activities FOR UPDATE TO authenticated 
  USING (user_id = auth.uid());
  
CREATE POLICY "Users can insert their own activities via functions" 
  ON public.daily_activities FOR INSERT TO authenticated 
  WITH CHECK (user_id = auth.uid());

-- Grant necessary permissions to authenticated users
GRANT SELECT, UPDATE ON public.user_streaks TO authenticated;
GRANT SELECT, INSERT, UPDATE ON public.daily_activities TO authenticated;
GRANT EXECUTE ON FUNCTION public.record_daily_activity TO authenticated;
GRANT EXECUTE ON FUNCTION public.claim_daily_reward TO authenticated; 
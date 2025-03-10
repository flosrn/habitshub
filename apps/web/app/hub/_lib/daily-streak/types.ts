/**
 * The user streak information from the database
 */
export type UserStreak = {
  id: string;
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_login_date: string | null;
  last_commit_date: string | null;
  last_reward_claimed_date: string | null;
  total_xp: number;
  created_at: string;
  updated_at: string;
};

/**
 * The daily activity record from the database
 */
export type DailyActivity = {
  id: string;
  user_id: string;
  activity_date: string;
  has_github_commit: boolean;
  has_logged_in: boolean;
  reward_claimed: boolean;
  xp_earned: number;
  created_at: string;
  updated_at: string;
};

/**
 * Status of the user's streak
 */
export type StreakStatus = 'active' | 'completed' | 'broken' | 'pending';

/**
 * Combined information about the user's streak status
 */
export type StreakInfo = {
  status: StreakStatus;
  currentStreak: number;
  longestStreak: number;
  totalXp: number;

  // Activity state for today
  hasGithubCommit: boolean;
  hasLoggedIn: boolean;
  rewardClaimed: boolean;

  // Whether user is eligible to claim reward today
  canClaimReward: boolean;

  // If reward is claimed, how much XP was earned
  xpEarned?: number;

  // Dates of last activities
  lastLoginDate?: string;
  lastCommitDate?: string;
  lastRewardClaimedDate?: string;
};

/**
 * Result from claiming a daily reward
 */
export type ClaimRewardResult = {
  success: boolean;
  xpEarned?: number;
  newStreak?: number;
  message?: string;
};

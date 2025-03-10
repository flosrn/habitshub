import { SupabaseClient } from '@supabase/supabase-js';

import {
  ClaimRewardResult,
  DailyActivity,
  StreakInfo,
  UserStreak,
} from './types';

/**
 * Simple logger implementation (replace with actual logger when available)
 */
const logger = {
  info: (
    ctx: {
      name: string;
      userId: string;
      [key: string]: string | number | boolean;
    },
    message: string,
  ) => {
    console.info(`[INFO] [${ctx.name}] ${message}`, ctx);
  },
  error: (
    ctx: {
      name: string;
      userId: string;
      [key: string]: string | number | boolean;
    },
    message: string,
  ) => {
    console.error(`[ERROR] [${ctx.name}] ${message}`, ctx);
  },
};

/**
 * Creates an API for managing daily streaks
 */
export function createDailyStreakApi(client: SupabaseClient) {
  /**
   * Records a login for the current user for today
   */
  async function recordLogin(userId: string): Promise<void> {
    const ctx = {
      name: 'daily-streak-record-login',
      userId,
    };

    try {
      logger.info(ctx, 'Recording login activity');

      const { error } = await client.rpc('record_daily_activity', {
        p_user_id: userId,
        p_activity_date: new Date().toISOString().split('T')[0],
        p_has_logged_in: true,
      });

      if (error) {
        logger.error(ctx, `Failed to record login: ${error.message}`);
        throw error;
      }

      logger.info(ctx, 'Successfully recorded login activity');
    } catch (error) {
      logger.error(ctx, `Error recording login: ${error}`);
      throw error;
    }
  }

  /**
   * Gets the current streak information for a user
   */
  async function getStreakInfo(userId: string): Promise<StreakInfo | null> {
    const ctx = {
      name: 'daily-streak-get-info',
      userId,
    };

    try {
      logger.info(ctx, 'Fetching streak information');

      // Today's date in YYYY-MM-DD format
      const today = new Date().toISOString().split('T')[0];

      // Get the user's streak record
      const { data: streakData, error: streakError } = await client
        .from('user_streaks')
        .select('*')
        .eq('user_id', userId)
        .single();

      // Si pas de données mais pas d'erreur, créer un enregistrement par défaut
      if (!streakData && !streakError) {
        // Aucun enregistrement trouvé mais pas d'erreur (normal pour un nouvel utilisateur)
        const _defaultStreak: UserStreak = {
          id: '',
          user_id: userId,
          current_streak: 0,
          longest_streak: 0,
          last_login_date: null,
          last_commit_date: null,
          last_reward_claimed_date: null,
          total_xp: 0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        };

        return {
          status: 'pending',
          currentStreak: 0,
          longestStreak: 0,
          totalXp: 0,
          hasGithubCommit: false,
          hasLoggedIn: false,
          rewardClaimed: false,
          canClaimReward: false,
        };
      }

      if (streakError) {
        logger.error(
          ctx,
          `Failed to fetch streak data: ${streakError.message}`,
        );
        return {
          status: 'pending',
          currentStreak: 0,
          longestStreak: 0,
          totalXp: 0,
          hasGithubCommit: false,
          hasLoggedIn: false,
          rewardClaimed: false,
          canClaimReward: false,
        };
      }

      // Get today's activity record if it exists
      const { data: activityData, error: activityError } = await client
        .from('daily_activities')
        .select('*')
        .eq('user_id', userId)
        .eq('activity_date', today)
        .single();

      if (activityError && activityError.code !== 'PGRST116') {
        // PGRST116 is "No rows returned" - that's okay, it means no record for today yet
        logger.error(
          ctx,
          `Failed to fetch activity data: ${activityError.message}`,
        );
      }

      const userStreak = streakData as UserStreak | null;
      const todayActivity = activityData as DailyActivity | null;

      // Determine streak status
      let status: StreakInfo['status'] = 'pending';

      if (!userStreak) {
        // User has no streak record yet
        status = 'pending';
      } else if (userStreak.last_reward_claimed_date === today) {
        // User has claimed reward for today
        status = 'completed';
      } else {
        // Check if the streak is broken
        const lastClaimedDate = userStreak.last_reward_claimed_date;

        if (lastClaimedDate) {
          const yesterday = new Date();
          yesterday.setDate(yesterday.getDate() - 1);

          // Format yesterday to YYYY-MM-DD for comparison
          const yesterdayFormatted = yesterday.toISOString().split('T')[0];

          if (lastClaimedDate !== yesterdayFormatted) {
            // Last claimed was not yesterday, streak is broken
            status = 'broken';
          } else {
            // Last claimed was yesterday, streak is active
            status = 'active';
          }
        } else {
          // No previous claim, starting fresh
          status = 'pending';
        }
      }

      // If both activities are done but reward not claimed, it's ready to claim
      const canClaimReward =
        !!todayActivity &&
        todayActivity.has_github_commit &&
        todayActivity.has_logged_in &&
        !todayActivity.reward_claimed;

      return {
        status,
        currentStreak: userStreak?.current_streak || 0,
        longestStreak: userStreak?.longest_streak || 0,
        totalXp: userStreak?.total_xp || 0,

        hasGithubCommit: todayActivity?.has_github_commit || false,
        hasLoggedIn: todayActivity?.has_logged_in || false,
        rewardClaimed: todayActivity?.reward_claimed || false,

        canClaimReward,
        xpEarned: todayActivity?.xp_earned || 0,

        lastLoginDate: userStreak?.last_login_date || undefined,
        lastCommitDate: userStreak?.last_commit_date || undefined,
        lastRewardClaimedDate:
          userStreak?.last_reward_claimed_date || undefined,
      };
    } catch (error) {
      logger.error(ctx, `Error fetching streak info: ${error}`);
      return null;
    }
  }

  /**
   * Claims the daily reward if eligible
   */
  async function claimDailyReward(userId: string): Promise<ClaimRewardResult> {
    const ctx = {
      name: 'daily-streak-claim-reward',
      userId,
    };

    try {
      logger.info(ctx, 'Attempting to claim daily reward');

      // Call the claim_daily_reward function
      const { data, error } = await client.rpc('claim_daily_reward', {
        p_user_id: userId,
      });

      if (error) {
        logger.error(ctx, `Failed to claim reward: ${error.message}`);
        return {
          success: false,
          message: 'Error claiming reward: ' + error.message,
        };
      }

      const success = data as boolean;

      if (!success) {
        logger.info(ctx, 'User not eligible for reward claim');
        return {
          success: false,
          message:
            "You're not eligible to claim a reward today. Complete both daily activities first!",
        };
      }

      // Get updated streak info to return to client
      const updatedInfo = await getStreakInfo(userId);

      logger.info(
        ctx,
        `Successfully claimed reward, earned ${updatedInfo?.xpEarned} XP`,
      );

      return {
        success: true,
        xpEarned: updatedInfo?.xpEarned,
        newStreak: updatedInfo?.currentStreak,
        message: 'Reward claimed successfully!',
      };
    } catch (error) {
      logger.error(ctx, `Error claiming reward: ${error}`);
      return {
        success: false,
        message: 'An unexpected error occurred',
      };
    }
  }

  /**
   * Syncs GitHub commit data with the streak system
   */
  async function syncGithubActivity(
    userId: string,
    hasCommitToday: boolean,
  ): Promise<void> {
    const ctx = {
      name: 'daily-streak-sync-github',
      userId,
    };

    try {
      logger.info(
        ctx,
        `Syncing GitHub activity, has commit today: ${hasCommitToday}`,
      );

      const { error } = await client.rpc('record_daily_activity', {
        p_user_id: userId,
        p_activity_date: new Date().toISOString().split('T')[0],
        p_has_github_commit: hasCommitToday,
      });

      if (error) {
        logger.error(ctx, `Failed to sync GitHub activity: ${error.message}`);
        throw error;
      }

      logger.info(ctx, 'Successfully synced GitHub activity');
    } catch (error) {
      logger.error(ctx, `Error syncing GitHub activity: ${error}`);
      throw error;
    }
  }

  return {
    recordLogin,
    getStreakInfo,
    claimDailyReward,
    syncGithubActivity,
  };
}

'use client';

import { useCallback } from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { useSupabase } from '@kit/supabase/hooks/use-supabase';

import { createDailyStreakApi } from '~/hub/_lib/daily-streak/api';
import { ClaimRewardResult } from '~/hub/_lib/daily-streak/types';

import { useGithubContributions } from './use-github-contributions';

/**
 * Hook for interacting with the daily streak system
 */
export function useDailyStreak(username?: string, userId?: string) {
  const supabase = useSupabase();
  const queryClient = useQueryClient();
  const streakApi = createDailyStreakApi(supabase);

  // GitHub contributions data to check for commits today
  const {
    data: githubData,
    isLoading: isGithubLoading,
    isError: isGithubError,
  } = useGithubContributions(username);

  // Query for fetching streak information
  const {
    data: streakInfo,
    isLoading: isStreakLoading,
    isError: isStreakError,
    refetch: refetchStreakInfo,
  } = useQuery({
    queryKey: ['daily-streak', userId],
    queryFn: async () => {
      if (!userId) {
        return null;
      }

      try {
        // Record login activity when fetching streak info
        await streakApi.recordLogin(userId);
      } catch (error) {
        console.error('Error recording login:', error);
        // Continue même en cas d'erreur
      }

      try {
        // Sync GitHub commit data if available
        if (githubData) {
          const today = new Date().toISOString().split('T')[0];
          const hasTodayCommit = !!githubData.contributions.find(
            (day: { date: string; count: number }) =>
              day.date === today && day.count > 0,
          );

          await streakApi.syncGithubActivity(userId, hasTodayCommit);
        }
      } catch (error) {
        console.error('Error syncing GitHub activity:', error);
        // Continue même en cas d'erreur
      }

      try {
        // Récupérer les infos de streak
        return await streakApi.getStreakInfo(userId);
      } catch (error) {
        console.error('Error getting streak info:', error);
        return null;
      }
    },
    enabled: !!userId,
    retry: 1, // Limite le nombre de tentatives en cas d'échec
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Mutation for claiming daily reward
  const claimRewardMutation = useMutation({
    mutationFn: async () => {
      if (!userId) {
        throw new Error('User is not authenticated');
      }

      return streakApi.claimDailyReward(userId);
    },
    onSuccess: () => {
      // Refetch streak info after claiming reward
      queryClient.invalidateQueries({ queryKey: ['daily-streak'] });
    },
    onError: (error) => {
      console.error('Error claiming reward:', error);
    },
  });

  // Memoized function to claim reward
  const claimDailyReward = useCallback(async (): Promise<ClaimRewardResult> => {
    if (!streakInfo?.canClaimReward) {
      return {
        success: false,
        message: 'Cannot claim reward - complete both daily activities first',
      };
    }

    try {
      const result = await claimRewardMutation.mutateAsync();
      return result;
    } catch (error) {
      console.error('Error claiming reward:', error);
      return {
        success: false,
        message: 'An error occurred while claiming your reward',
      };
    }
  }, [streakInfo, claimRewardMutation]);

  return {
    streakInfo,
    isStreakLoading: isStreakLoading || isGithubLoading,
    isStreakError: isStreakError || isGithubError,
    claimDailyReward,
    isClaimingReward: claimRewardMutation.isPending,
    refetchStreakInfo,
  };
}

'use client';

import { useEffect, useState } from 'react';

import {
  AlertCircle,
  AlertTriangle,
  Check,
  CheckCircle,
  Clock,
  Flame,
  Gift,
  GitCommit,
  Github,
  LogIn,
  PartyPopper,
  RefreshCw,
  Trophy,
  Zap,
} from 'lucide-react';
import { Tooltip } from 'recharts';

import { Badge } from '@kit/ui/badge';
import { Button } from '@kit/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import { Progress } from '@kit/ui/progress';
import {
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@kit/ui/tooltip';
import { cn } from '@kit/ui/utils';

import { useDailyStreak } from '~/hub/_hooks/use-daily-streak';
import { StreakStatus } from '~/hub/_lib/daily-streak/types';

/**
 * Daily Streak Card Component
 *
 * A clear, intuitive UI for tracking daily activity streaks and progress.
 * Designed to motivate users by highlighting their consistency and achievements.
 */

type DailyStreakCardProps = {
  username?: string;
  userId?: string;
  className?: string;
};

export function DailyStreakCard({
  username,
  userId,
  className,
}: DailyStreakCardProps) {
  const [earnedXp, setEarnedXp] = useState(0);
  const [isClaimingReward, setIsClaimingReward] = useState(false);
  const [showXpAnimation, setShowXpAnimation] = useState(false);
  const [showProgressAnimations, setShowProgressAnimations] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const {
    streakInfo,
    isStreakLoading,
    isStreakError,
    claimDailyReward,
    refetchStreakInfo,
  } = useDailyStreak(username, userId);

  // Set initial animations after data loads
  useEffect(() => {
    if (streakInfo && !isStreakLoading) {
      setTimeout(() => {
        setShowProgressAnimations(true);
      }, 300);
    }
  }, [streakInfo, isStreakLoading]);

  // Handle claiming daily reward
  const handleClaimReward = async () => {
    if (!streakInfo?.canClaimReward || isClaimingReward) return;

    try {
      setIsClaimingReward(true);
      const result = await claimDailyReward();

      if (result?.success) {
        if (result.xpEarned) {
          setEarnedXp(result.xpEarned);
          setShowXpAnimation(true);

          // Play celebration sound
          playCelebrationSound();

          // Hide animation after 3 seconds
          setTimeout(() => {
            setShowXpAnimation(false);
            refetchStreakInfo();
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Failed to claim reward:', error);
    } finally {
      setIsClaimingReward(false);
    }
  };

  // Play celebration sound when a reward is claimed
  const playCelebrationSound = () => {
    const audio = new Audio('/sounds/success.mp3');
    audio.volume = 0.5;

    try {
      audio.play();
    } catch (error) {
      console.log('Failed to play sound', error);
    }
  };

  // Handle refresh button click
  const handleRefresh = async () => {
    if (refreshing) return;

    setRefreshing(true);
    await refetchStreakInfo();
    setTimeout(() => setRefreshing(false), 800);
  };

  // Get remaining time until streak reset
  const getTimeRemaining = () => {
    const now = new Date();
    const endOfDay = new Date();
    endOfDay.setHours(23, 59, 59, 999);

    const timeRemaining = endOfDay.getTime() - now.getTime();
    const hours = Math.floor(timeRemaining / (1000 * 60 * 60));
    const minutes = Math.floor(
      (timeRemaining % (1000 * 60 * 60)) / (1000 * 60),
    );

    return `${hours}h ${minutes}m`;
  };

  // Get status color
  const getStatusColor = (status: StreakStatus) => {
    switch (status) {
      case 'active':
        return 'border-green-500 text-green-500';
      case 'completed':
        return 'border-blue-500 text-blue-500';
      case 'broken':
        return 'border-red-500 text-red-500';
      case 'pending':
      default:
        return 'border-yellow-500 text-yellow-500';
    }
  };

  // Get status text
  const getStatusText = (status: StreakStatus) => {
    switch (status) {
      case 'active':
        return 'Active Streak';
      case 'completed':
        return 'Completed Today';
      case 'broken':
        return 'Streak Broken';
      case 'pending':
      default:
        return 'Pending Activities';
    }
  };

  // Get motivational message based on streak status
  const getMotivationalMessage = () => {
    if (!streakInfo) return null;

    if (streakInfo.canClaimReward) {
      return (
        <div className="mt-3 animate-pulse rounded-md border border-green-500/20 bg-green-500/10 p-2 text-center font-medium text-green-500">
          <span className="flex items-center justify-center gap-1">
            <Gift className="h-4 w-4" />
            <span>You can claim your reward now!</span>
            <Gift className="h-4 w-4" />
          </span>
        </div>
      );
    }

    if (streakInfo.rewardClaimed) {
      return (
        <div className="mt-3 rounded-md border border-blue-500/20 bg-blue-500/10 p-2 text-center font-medium text-blue-400">
          <span className="flex items-center justify-center gap-1">
            <CheckCircle className="h-4 w-4" />
            <span>Well done! Come back tomorrow to continue your streak!</span>
          </span>
        </div>
      );
    }

    if (!streakInfo.hasGithubCommit && !streakInfo.hasLoggedIn) {
      return (
        <div className="mt-3 rounded-md border border-yellow-500/20 bg-yellow-500/10 p-2 text-center font-medium text-yellow-500">
          <span className="flex items-center justify-center gap-1">
            <AlertTriangle className="h-4 w-4" />
            <span>
              Complete today&apos;s activities to maintain your streak!
            </span>
          </span>
        </div>
      );
    }

    if (streakInfo.hasGithubCommit && !streakInfo.hasLoggedIn) {
      return (
        <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/10 p-2 text-center font-medium text-amber-500">
          <span className="flex items-center justify-center gap-1">
            <AlertCircle className="h-4 w-4" />
            <span>You&apos;ve made a commit. Now just log in!</span>
          </span>
        </div>
      );
    }

    if (!streakInfo.hasGithubCommit && streakInfo.hasLoggedIn) {
      return (
        <div className="mt-3 rounded-md border border-amber-500/20 bg-amber-500/10 p-2 text-center font-medium text-amber-500">
          <span className="flex items-center justify-center gap-1">
            <GitCommit className="h-4 w-4" />
            <span>You&apos;ve logged in. Now make a GitHub commit!</span>
          </span>
        </div>
      );
    }

    if (streakInfo.hasGithubCommit && streakInfo.hasLoggedIn) {
      return (
        <div className="text-primary bg-primary/10 border-primary/20 mt-3 rounded-md border p-2 text-center font-medium">
          <span className="flex items-center justify-center gap-1">
            <PartyPopper className="h-4 w-4" />
            <span>
              All activities completed! Click the button below to claim your
              reward!
            </span>
          </span>
        </div>
      );
    }

    return null;
  };

  return (
    <Card className={cn('relative h-full overflow-hidden', className)}>
      {/* XP Animation Overlay */}
      {showXpAnimation && (
        <div className="animate-in fade-in absolute inset-0 z-50 flex items-center justify-center bg-black/80 duration-300">
          <div className="flex flex-col items-center">
            <div className="animate-bounce text-6xl font-bold text-yellow-400">
              +{earnedXp} XP
            </div>
            <div className="mt-4 text-xl text-white">
              <span className="inline-flex items-center">
                <Flame className="mr-2 h-6 w-6 animate-pulse text-orange-500" />
                Streak Continued!
                <Flame className="ml-2 h-6 w-6 animate-pulse text-orange-500" />
              </span>
            </div>
            {streakInfo?.currentStreak && streakInfo.currentStreak > 1 && (
              <div className="mt-2 text-lg text-green-400">
                <Trophy className="mr-1 inline h-5 w-5" />
                {streakInfo.currentStreak} days streak!
              </div>
            )}
            <div className="mt-6 animate-pulse text-sm text-white/70">
              Come back tomorrow to keep your streak going!
            </div>
          </div>
        </div>
      )}

      <CardHeader className="flex-shrink-0 p-4 pb-2 sm:p-6 sm:pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center">
            <CardTitle className="flex items-center text-xl sm:text-2xl">
              <Flame className="mr-2 h-5 w-5 sm:h-6 sm:w-6" />
              Daily Streak
            </CardTitle>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Clock className="text-muted-foreground ml-2 h-4 w-4 cursor-help" />
                </TooltipTrigger>
                <TooltipContent>
                  <p>Resets in: {getTimeRemaining()}</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <div className="flex items-center space-x-2">
            {streakInfo && (
              <Badge
                variant="outline"
                className={cn(
                  'animate-in fade-in duration-700',
                  getStatusColor(streakInfo.status),
                )}
              >
                {getStatusText(streakInfo.status)}
              </Badge>
            )}

            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              disabled={isStreakLoading || refreshing}
              className="h-8 w-8 rounded-full"
              aria-label="Refresh streak data"
            >
              <RefreshCw
                className={cn(
                  'h-4 w-4',
                  refreshing && 'animate-spin',
                  !refreshing && 'transition-transform hover:rotate-90',
                )}
              />
            </Button>
          </div>
        </div>
        <CardDescription className="mt-1">
          Complete daily activities to earn XP and maintain your streak
        </CardDescription>
      </CardHeader>

      <CardContent className="flex-grow overflow-auto p-4 sm:px-6">
        {isStreakLoading ? (
          <div className="flex h-full min-h-[10rem] items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        ) : isStreakError ? (
          <div className="text-destructive flex h-full min-h-[10rem] flex-col items-center justify-center space-y-2 text-center">
            <AlertCircle className="h-8 w-8" />
            <p>Unable to load streak data</p>
          </div>
        ) : (
          <div className="flex h-full flex-col">
            <div className="mb-4 grid grid-cols-1 gap-6 md:grid-cols-2">
              {/* Streak Counter */}
              <div className="bg-accent/30 flex items-center justify-center rounded-lg p-4">
                <div className="mx-4 flex flex-col items-center">
                  <div className="text-4xl font-bold">
                    {streakInfo?.currentStreak || 0}
                  </div>
                  <div className="text-muted-foreground text-sm">Current</div>
                </div>
                <Flame className="h-10 w-10 text-orange-500" />
                <div className="mx-4 flex flex-col items-center">
                  <div className="text-4xl font-bold">
                    {streakInfo?.longestStreak || 0}
                  </div>
                  <div className="text-muted-foreground text-sm">Best</div>
                </div>
              </div>

              {/* Total XP */}
              <div className="bg-accent/30 flex items-center justify-center rounded-lg p-4">
                <div className="flex flex-col items-center">
                  <div className="text-muted-foreground mb-1 text-sm">
                    Total XP Earned
                  </div>
                  <div className="flex items-center text-2xl font-semibold">
                    <Zap className="mr-2 h-5 w-5 text-yellow-500" />
                    {streakInfo?.totalXp || 0} XP
                  </div>
                </div>
              </div>
            </div>

            {/* Motivational message */}
            <div className="text-sm">{getMotivationalMessage()}</div>

            {/* Daily Activities */}
            <div className="bg-card mt-4 space-y-4 rounded-lg border p-4">
              <div className="flex items-center justify-between">
                <h3 className="font-medium">Today&apos;s Activities</h3>
                {streakInfo?.hasGithubCommit && streakInfo?.hasLoggedIn ? (
                  <Badge variant="default" className="shimmer animate-pulse">
                    Completed!
                  </Badge>
                ) : (
                  <Badge variant="outline">In Progress</Badge>
                )}
              </div>

              <div className="space-y-4">
                {/* GitHub Commit Activity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={cn(
                          'mr-2 flex h-9 w-9 items-center justify-center rounded-full',
                          streakInfo?.hasGithubCommit
                            ? 'bg-green-500/20 text-green-500 ring-1 ring-green-500/50'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {streakInfo?.hasGithubCommit ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <Github className="h-5 w-5" />
                        )}
                      </div>
                      <span className="font-medium">GitHub Commit</span>
                    </div>
                    {streakInfo?.hasGithubCommit && (
                      <span className="text-xs font-medium text-green-500">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                  <Progress
                    value={streakInfo?.hasGithubCommit ? 100 : 0}
                    className={cn(
                      'h-2 transition-all duration-1000',
                      showProgressAnimations &&
                        streakInfo?.hasGithubCommit &&
                        'animate-progressGrow',
                    )}
                  />
                </div>

                {/* Daily Login Activity */}
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center">
                      <div
                        className={cn(
                          'mr-2 flex h-9 w-9 items-center justify-center rounded-full',
                          streakInfo?.hasLoggedIn
                            ? 'bg-green-500/20 text-green-500 ring-1 ring-green-500/50'
                            : 'bg-muted text-muted-foreground',
                        )}
                      >
                        {streakInfo?.hasLoggedIn ? (
                          <Check className="h-5 w-5" />
                        ) : (
                          <LogIn className="h-5 w-5" />
                        )}
                      </div>
                      <span className="font-medium">Daily Login</span>
                    </div>
                    {streakInfo?.hasLoggedIn && (
                      <span className="text-xs font-medium text-green-500">
                        ✓ Completed
                      </span>
                    )}
                  </div>
                  <Progress
                    value={streakInfo?.hasLoggedIn ? 100 : 0}
                    className={cn(
                      'h-2 transition-all duration-1000',
                      showProgressAnimations &&
                        streakInfo?.hasGithubCommit &&
                        'animate-progressGrow',
                    )}
                  />
                </div>
              </div>
            </div>

            {/* Claim button */}
            <div className="mt-auto pt-6">
              <Button
                className={cn(
                  'h-10 w-full transition-all sm:h-11',
                  streakInfo?.canClaimReward
                    ? 'animate-pulse bg-gradient-to-r from-green-500 to-emerald-600 shadow-lg hover:from-green-600 hover:to-emerald-700'
                    : '',
                  streakInfo?.rewardClaimed
                    ? 'bg-blue-500 hover:bg-blue-600'
                    : '',
                )}
                variant={streakInfo?.canClaimReward ? 'default' : 'outline'}
                disabled={!streakInfo?.canClaimReward || isClaimingReward}
                onClick={handleClaimReward}
                size="lg"
              >
                {isClaimingReward ? (
                  <div className="flex items-center justify-center gap-2">
                    <div className="h-4 w-4 animate-spin rounded-full border-b-2 border-white"></div>
                    <span>Claiming...</span>
                  </div>
                ) : streakInfo?.canClaimReward ? (
                  <div className="flex items-center justify-center gap-2">
                    <Gift className="h-5 w-5" />
                    <span>Claim {earnedXp} XP Reward</span>
                  </div>
                ) : streakInfo?.rewardClaimed ? (
                  <div className="flex items-center justify-center gap-2">
                    <CheckCircle className="h-5 w-5" />
                    <span>Reward Claimed!</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2">
                    <Trophy className="h-5 w-5" />
                    <span>Complete Activities to Earn XP</span>
                  </div>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

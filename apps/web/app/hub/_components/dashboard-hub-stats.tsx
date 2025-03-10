'use client';

import { Sparkles } from 'lucide-react';

import { useUser } from '@kit/supabase/hooks/use-user';
import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';

import { useGithubContributions } from '~/hub/_hooks/use-github-contributions';

import { DailyStreakCard } from './daily-streak-card';
import { GithubActivity } from './github-activity';
import GithubActivityCalendar from './github-activity-calendar';

/**
 * Dashboard Hub Stats
 *
 * This component displays the user's productivity dashboard with streak and GitHub activity metrics.
 * The layout is designed to provide a clear overview of user's achievements and habits at a glance.
 */

export default function DashboardHubStats() {
  const { data: user } = useUser();
  const username = user?.user_metadata?.user_name;
  const {
    data: githubData,
    isLoading: isGithubLoading,
    isError: isGithubError,
  } = useGithubContributions(username);

  return (
    <div className="animate-in fade-in space-y-3 py-2 duration-500">
      <div className="grid grid-cols-1 gap-3 xl:grid-cols-12">
        {/* Main Feature: Daily Streak Card - Most important, so it gets largest focus */}
        <Card className="col-span-1 overflow-hidden xl:col-span-5">
          {user?.id && (
            <DailyStreakCard
              username={username}
              userId={user.id}
              className="border-0 shadow-none"
            />
          )}
        </Card>

        {/* GitHub Recent Activity - At-a-glance view of user productivity */}
        <Card className="col-span-1 flex h-full flex-col xl:col-span-7">
          <GithubActivity
            githubData={githubData}
            isLoading={isGithubLoading}
            isError={isGithubError}
            className="h-full border-0 shadow-none"
          />
        </Card>
      </div>

      {/* GitHub Activity Calendar - Detailed view for users who want to dig deeper */}
      <Card className="w-full">
        <CardHeader className="px-6 pb-2">
          <CardTitle className="flex items-center text-lg">
            <Sparkles className="text-primary mr-2 h-5 w-5" />
            GitHub Activity Calendar
          </CardTitle>
        </CardHeader>
        <CardContent className="px-4 pt-2 pb-6">
          <div className="w-full">
            <GithubActivityCalendar githubContributionsData={githubData} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

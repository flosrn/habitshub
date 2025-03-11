'use client';

import { AlertCircle, BarChart } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@kit/ui/card';
import { cn } from '@kit/ui/utils';

import { GithubContributionsData } from '~/hub/_hooks/use-github-contributions';

interface GithubActivityProps {
  githubData: GithubContributionsData | undefined;
  isLoading: boolean;
  isError: boolean;
  className?: string;
}

export function GithubActivity({
  githubData,
  isLoading,
  isError,
  className,
}: GithubActivityProps) {
  // Get recent activity (last 7 days)
  const getRecentActivity = () => {
    if (!githubData?.contributions) return [];

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    return Array.from({ length: 7 }, (_, i) => {
      const date = new Date(today);
      date.setDate(date.getDate() - (6 - i)); // Last 7 days starting with earliest

      const dateString = date.toISOString().split('T')[0];
      const dayData = githubData.contributions.find(
        (day) => day.date === dateString,
      );

      return {
        date: dateString,
        formattedDate: date.toLocaleDateString('en-US', {
          weekday: 'short',
          month: 'short',
          day: 'numeric',
        }),
        count: dayData?.count || 0,
      };
    });
  };

  const recentActivity = !isLoading && !isError ? getRecentActivity() : [];

  return (
    <Card className={cn('flex h-full flex-col', className)}>
      <CardHeader className="flex-shrink-0 p-4 pb-2 sm:p-6">
        <CardTitle className="flex items-center text-base sm:text-lg">
          <BarChart className="text-primary mr-2 h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow overflow-y-auto px-4 pb-4 sm:px-6">
        {isLoading ? (
          <div className="flex h-full min-h-[10rem] items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        ) : isError ? (
          <div className="text-destructive flex h-full min-h-[10rem] flex-col items-center justify-center space-y-2 text-center">
            <AlertCircle className="h-8 w-8" />
            <p>Unable to load GitHub data</p>
          </div>
        ) : (
          <div className="flex h-full flex-col space-y-3">
            {recentActivity.length === 0 ? (
              <div className="text-muted-foreground flex flex-grow items-center justify-center py-8 text-center">
                No recent GitHub activity found
              </div>
            ) : (
              <>
                <div className="text-muted-foreground pb-2 text-xs font-medium tracking-wider uppercase">
                  Last 7 days
                </div>
                <div className="flex-grow space-y-3">
                  {recentActivity.map((day) => (
                    <div
                      key={day.date}
                      className="group hover:bg-accent/50 flex items-center rounded-md p-1 transition-colors"
                    >
                      <div className="text-muted-foreground w-24 text-sm">
                        {day.formattedDate}
                      </div>
                      <div className="ml-2 flex-1 sm:ml-4">
                        <div className="bg-muted h-2 w-full overflow-hidden rounded">
                          <div
                            className="bg-primary h-full transition-all duration-500 group-hover:opacity-90"
                            style={{
                              width:
                                day.count > 0
                                  ? `${Math.min(day.count * 10, 100)}%`
                                  : '0%',
                            }}
                          />
                        </div>
                      </div>
                      <div className="ml-2 w-12 text-right text-sm font-medium sm:ml-4">
                        {day.count} {day.count === 1 ? 'commit' : 'commits'}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

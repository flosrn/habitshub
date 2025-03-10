import React, { useCallback, useMemo } from 'react';

import { Sparkles } from 'lucide-react';
import type { Activity } from 'react-activity-calendar';
import { ActivityCalendar } from 'react-activity-calendar';

import { useUser } from '@kit/supabase/hooks/use-user';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from '@kit/ui/tooltip';
import { cn } from '@kit/ui/utils';

import { GithubContributionsData } from '../_hooks/use-github-contributions';

// Type definitions
interface GithubActivityCalendarProps {
  githubContributionsData?: GithubContributionsData;
}

// Simple component that displays only the last year of GitHub activity
export default function GithubActivityCalendar({
  githubContributionsData,
}: GithubActivityCalendarProps) {
  const { data: user } = useUser();
  const username = user?.user_metadata?.user_name;
  const userAccountCreatedAt = user?.created_at;

  // Format date string
  const formatDate = useCallback((dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  }, []);

  // Current date to limit display
  const today = useMemo(() => new Date(), []);

  // YYYY-MM-DD format to compare with contribution dates
  const todayStr = useMemo(() => {
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [today]);

  // Start date for filtering - always exactly 1 year ago
  const startDateStr = useMemo(() => {
    const date = new Date(today);
    date.setFullYear(date.getFullYear() - 1);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [today]);

  // Process data - just filter to last year, no other complex calculations
  const processedData = useMemo(() => {
    if (!githubContributionsData) return [];

    // Ensure we have a complete year of data by creating an array of all dates
    // in the past year, then mapping the contribution data to it
    const oneYearAgo = new Date(today);
    oneYearAgo.setFullYear(today.getFullYear() - 1);

    // Create a map for quick lookup of contributions by date
    const contributionsByDate = new Map<string, Activity>();

    // Filter and add valid contributions to the map
    githubContributionsData.contributions
      .filter(
        (contrib) => contrib.date >= startDateStr && contrib.date <= todayStr,
      )
      .forEach((contrib) => {
        contributionsByDate.set(contrib.date, {
          date: contrib.date,
          count: contrib.count,
          level: Math.min(Math.max(contrib.level, 0), 4) as 0 | 1 | 2 | 3 | 4,
        });
      });

    // Ensure we have an entry for every day in the past year, even if there's no contribution
    const result: Activity[] = [];
    const currentDate = new Date(oneYearAgo);

    // Helper to format date to YYYY-MM-DD
    const formatDateString = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    // Iterate through each day of the year and add it to the result
    while (currentDate <= today) {
      const dateStr = formatDateString(currentDate);

      if (contributionsByDate.has(dateStr)) {
        result.push(contributionsByDate.get(dateStr)!);
      } else {
        result.push({
          date: dateStr,
          count: 0,
          level: 0,
        });
      }

      // Move to the next day
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return result;
  }, [githubContributionsData, startDateStr, todayStr, today]);

  // Calculate total contributions - simple reduce operation
  const totalContributions = useMemo(() => {
    return processedData.reduce(
      (sum: number, activity: Activity) => sum + activity.count,
      0,
    );
  }, [processedData]);

  // Custom tooltip component
  const TooltipComponent = React.memo(
    ({
      date,
      count,
      level: _level,
      isUserAccountCreatedAt,
    }: Activity & { isUserAccountCreatedAt: boolean }) =>
      isUserAccountCreatedAt ? (
        <div className="relative overflow-hidden bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 p-0.5">
          <div className="relative rounded-md bg-white p-3 dark:bg-slate-950">
            <div className="flex flex-col items-center space-y-2 text-center">
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-purple-400 to-pink-500 text-white">
                <Sparkles className="h-4 w-4" />
              </div>
              <h3 className="bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 bg-clip-text font-semibold text-transparent">
                Your journey began here!
              </h3>
              <p className="text-md text-muted-foreground font-medium">
                {count} contribution{count > 1 ? 's' : ''}
              </p>
              <p className="text-muted-foreground text-xs">
                {formatDate(date)}
              </p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-1.5 text-center">
          <p className="font-medium">
            {count} contribution{count > 1 ? 's' : ''}
          </p>
          <p className="text-muted-foreground text-xs">{formatDate(date)}</p>
        </div>
      ),
  );
  TooltipComponent.displayName = 'TooltipComponent';

  // Handle the no data case
  if (!githubContributionsData) {
    return (
      <div className="rounded-md border p-4 text-center">
        <p className="text-muted-foreground">
          {username
            ? 'Loading or no contribution data available...'
            : 'No GitHub username configured'}
        </p>
      </div>
    );
  }

  // Handle empty contributions case
  if (processedData.length === 0) {
    return (
      <div className="rounded-md border p-4 text-center">
        <h2 className="mb-2 text-xl font-semibold">Code Activity</h2>
        <p className="text-muted-foreground">
          No activity data for the last year
        </p>
      </div>
    );
  }

  // Render the calendar with fixed size (1 year)
  return (
    <div className="w-full">
      <div className="mb-2 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {totalContributions} contributions in the last year
        </p>
      </div>

      <div className="w-full">
        <ActivityCalendar
          data={processedData}
          labels={{
            totalCount: `${totalContributions} total contributions`,
          }}
          blockMargin={2.5}
          renderBlock={(block, value) => {
            const isUserAccountCreatedAt =
              value.date.split('T')[0] === userAccountCreatedAt?.split('T')[0];

            // Check if the date is after the user account creation date
            const isAfterRegistration = userAccountCreatedAt
              ? new Date(value.date).setHours(0, 0, 0, 0) >=
                new Date(userAccountCreatedAt).setHours(0, 0, 0, 0)
              : false;

            return (
              <Tooltip>
                <TooltipTrigger asChild>
                  {React.cloneElement(block, {
                    style: {
                      ...((block.props.style as React.CSSProperties) || {}),
                      cursor: 'pointer',
                      ...(isAfterRegistration
                        ? {
                            stroke: '#ffd700',
                            strokeWidth: 0.5,
                          }
                        : { stroke: 'none', opacity: 0.5 }),
                      border: isUserAccountCreatedAt
                        ? '2px solid #ffd700'
                        : 'none',
                    },
                    className: cn(
                      block.props.className,
                      isUserAccountCreatedAt ? 'journey-start-block' : '',
                    ),
                  })}
                </TooltipTrigger>
                <TooltipPortal>
                  <TooltipContent side="top" sideOffset={5} className="p-0">
                    <TooltipComponent
                      date={value.date}
                      count={value.count}
                      level={value.level}
                      isUserAccountCreatedAt={isUserAccountCreatedAt}
                    />
                  </TooltipContent>
                </TooltipPortal>
              </Tooltip>
            );
          }}
          theme={{
            light: ['#f0f0f0', '#c4edde', '#7ac7c4', '#306873', '#0a4c6a'],
            dark: ['#1f2937', '#0e4429', '#006d32', '#26a641', '#39d353'],
          }}
        />
      </div>
    </div>
  );
}

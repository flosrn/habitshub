import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { ChevronLeftIcon, ChevronRightIcon, Sparkles } from 'lucide-react';
import type { Activity } from 'react-activity-calendar';
import { ActivityCalendar } from 'react-activity-calendar';

import { useUser } from '@kit/supabase/hooks/use-user';
import { Button } from '@kit/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kit/ui/select';
import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from '@kit/ui/tooltip';
import { cn } from '@kit/ui/utils';

import { GithubContributionsData } from '../_hooks/use-github-contributions';

interface GithubActivityCalendarProps {
  githubContributionsData?: GithubContributionsData;
  defaultPeriodMonths?: number | 'all';
}

// Period filter type
type Period = '3' | '6' | '12' | 'all';

// Number of weeks to display at once (adaptive)
const DEFAULT_WEEKS_PER_VIEW = 20;

export default function GithubActivityCalendar({
  githubContributionsData,
  defaultPeriodMonths = 'all',
}: GithubActivityCalendarProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [selectedPeriod, setSelectedPeriod] = useState<Period>(
    typeof defaultPeriodMonths === 'number'
      ? (defaultPeriodMonths.toString() as Period)
      : defaultPeriodMonths,
  );
  const [visibleWeeksOffset, setVisibleWeeksOffset] = useState(0);
  const [isLoadingData, setIsLoadingData] = useState(false);
  const [weeksPerView, setWeeksPerView] = useState(DEFAULT_WEEKS_PER_VIEW);

  const { data: user } = useUser();
  const username = user?.user_metadata?.user_name;
  const userAccountCreatedAt = user?.created_at;

  // Adjust the number of visible weeks based on screen width
  useEffect(() => {
    const updateVisibleWeeks = () => {
      // Calculate approximately how many weeks can fit in the current width
      const containerWidth = containerRef.current?.clientWidth || 0;

      // Base estimation - a cell is about 12px with 2px spacing
      // Total week width is therefore about 14px
      const cellWidth = 12;
      const spacing = 2;
      const weekWidth = cellWidth + spacing;

      // Calculate the optimal number of weeks
      // Slightly reduce the number of weeks to avoid right truncation
      const estimatedWeeks = Math.ceil((containerWidth / weekWidth) * 0.85);

      // Ensure a minimum number of weeks for small screens
      const visibleWeeks = Math.max(10, estimatedWeeks);

      setWeeksPerView(visibleWeeks);
    };

    // Update on initial load
    updateVisibleWeeks();

    // Update on window resize
    const handleResize = () => {
      updateVisibleWeeks();
      // Reset offset to avoid display issues
      setVisibleWeeksOffset(0);
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Handle scrolling to ensure the most recent data is visible
  useEffect(() => {
    // Wait for the component to render
    setTimeout(() => {
      if (calendarRef.current) {
        const calendarElement = calendarRef.current.querySelector(
          '.calendar-container',
        );

        // Ensure the element exists
        if (calendarElement) {
          // Scroll all the way to the right if we're displaying the most recent data
          if (visibleWeeksOffset === 0) {
            (calendarElement as HTMLElement).scrollLeft = (
              calendarElement as HTMLElement
            ).scrollWidth;
          }
        }
      }
    }, 100);
  }, [isLoadingData, visibleWeeksOffset, selectedPeriod, calendarRef]);

  useEffect(() => {
    if (calendarRef.current) {
      const calendarElement = calendarRef.current.querySelector(
        '.react-activity-calendar__scroll-container',
      );
      (calendarElement as HTMLElement).style.overflow = 'visible';
    }
  }, [calendarRef, isLoadingData]);

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

  // Start date for filtering by selected period
  const startDate = useMemo(() => {
    const date = new Date(today);
    if (selectedPeriod === 'all') {
      // Return a very old date to show everything
      return new Date(2015, 0, 1); // GitHub contributions generally start in 2015
    }

    // Go back X months
    date.setMonth(date.getMonth() - parseInt(selectedPeriod, 10));
    return date;
  }, [today, selectedPeriod]);

  // YYYY-MM-DD format for the start date
  const startDateStr = useMemo(() => {
    const year = startDate.getFullYear();
    const month = String(startDate.getMonth() + 1).padStart(2, '0');
    const day = String(startDate.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }, [startDate]);

  // Process data into a weekly structure
  const processedData = useMemo(() => {
    if (!githubContributionsData)
      return { weeklyData: [], totalContributions: 0, totalWeeks: 0 };

    const allData = githubContributionsData.contributions
      .map((contrib: { date: string; count: number; level: number }) => ({
        date: contrib.date,
        count: contrib.count,
        level: Math.min(Math.max(contrib.level, 0), 4) as 0 | 1 | 2 | 3 | 4,
      }))
      .filter(
        (activity: Activity) =>
          activity.date >= startDateStr && activity.date <= todayStr,
      )
      // Chronological sort from oldest to newest
      .sort(
        (a: Activity, b: Activity) =>
          new Date(a.date).getTime() - new Date(b.date).getTime(),
      );

    // Organize data by week (7 days)
    const weeks: Activity[][] = [];
    let currentWeek: Activity[] = [];
    let weekStartDate: Date | null = null;

    allData.forEach((activity: Activity) => {
      const activityDate = new Date(activity.date);

      // If it's the first activity or we're starting a new week
      if (!weekStartDate) {
        weekStartDate = activityDate;
        currentWeek.push(activity);
      } else {
        // Calculate if we're still in the same week
        const diffTime = activityDate.getTime() - weekStartDate.getTime();
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

        if (diffDays < 7) {
          // Same week
          currentWeek.push(activity);
        } else {
          // New week
          weeks.push([...currentWeek]);
          currentWeek = [activity];
          weekStartDate = activityDate;
        }
      }
    });

    // Add the last week if it exists
    if (currentWeek.length > 0) {
      weeks.push([...currentWeek]);
    }

    // Calculate total contributions
    const totalContributions = allData.reduce(
      (sum: number, activity: Activity) => sum + activity.count,
      0,
    );

    return {
      weeklyData: weeks,
      totalContributions,
      totalWeeks: weeks.length,
    };
  }, [githubContributionsData, startDateStr, todayStr]);

  // Determine which weeks to display, ensuring that the most recent are visible first
  const visibleData = useMemo(() => {
    const { weeklyData, totalWeeks } = processedData;

    if (totalWeeks === 0) return [];

    // By default, show the most recent weeks (from the end)
    let startIndex;

    if (visibleWeeksOffset === 0) {
      // When offset is 0, show the last weeks (most recent)
      startIndex = Math.max(0, totalWeeks - weeksPerView);
    } else {
      // Otherwise, calculate the start index based on the offset from the end
      startIndex = Math.max(0, totalWeeks - weeksPerView - visibleWeeksOffset);
    }

    // Extract the visible weeks
    const visibleWeeks = weeklyData.slice(
      startIndex,
      startIndex + weeksPerView,
    );

    // Flatten the data for display
    return visibleWeeks.flat();
  }, [processedData, visibleWeeksOffset, weeksPerView]);

  // Handle period change
  const handlePeriodChange = useCallback((value: string) => {
    setSelectedPeriod(value as Period);
    setVisibleWeeksOffset(0); // Reset position when changing periods
    setIsLoadingData(true);
  }, []);

  // Navigate between weeks
  const navigateWeeks = useCallback(
    (direction: 'next' | 'prev') => {
      setIsLoadingData(true);

      if (direction === 'next') {
        // Navigate to more recent weeks (less offset)
        setVisibleWeeksOffset((prev) =>
          Math.max(0, prev - Math.floor(weeksPerView / 2)),
        );
      } else {
        // Navigate to older weeks (more offset)
        setVisibleWeeksOffset((prev) => {
          const maxOffset = processedData.totalWeeks - weeksPerView;
          return Math.min(
            prev + Math.floor(weeksPerView / 2),
            Math.max(0, maxOffset),
          );
        });
      }
    },
    [processedData.totalWeeks, weeksPerView],
  );

  // Loading simulation
  useEffect(() => {
    if (isLoadingData) {
      const timer = setTimeout(() => {
        setIsLoadingData(false);
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [isLoadingData, visibleWeeksOffset, selectedPeriod]);

  // Custom tooltip component - memoized to avoid recalculations
  const TooltipComponent = React.memo(
    ({
      date,
      count,
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

  // Calculate visible dates for display in the interface
  const getVisibleDateRange = () => {
    if (visibleData.length === 0) return 'No data';

    const firstDate = formatDate(visibleData[0]?.date || '');
    const lastDate = formatDate(
      visibleData[visibleData.length - 1]?.date || '',
    );

    return `${firstDate} - ${lastDate}`;
  };

  // For navigation, we now define canNavigatePrev/Next based on offsets
  // and total number of weeks, knowing we navigate from newest to oldest
  const canNavigateNext = visibleWeeksOffset > 0;
  const canNavigatePrev =
    visibleWeeksOffset < processedData.totalWeeks - weeksPerView;

  if (visibleData.length === 0 && !isLoadingData) {
    return (
      <div className="rounded-md border p-4 text-center">
        <h2 className="mb-2 text-xl font-semibold">Code Activity</h2>
        <p className="text-muted-foreground">
          No activity data for the selected period
        </p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="w-full">
      {/* SVG Gradient definition for the stroke */}
      <svg width="0" height="0" className="absolute">
        <defs>
          <linearGradient
            id="journey-start-gradient"
            x1="0%"
            y1="0%"
            x2="100%"
            y2="100%"
          >
            <stop offset="0%" stopColor="#ffd700" />
            <stop offset="25%" stopColor="#d4af37" />
            <stop offset="50%" stopColor="#b8860b" />
            <stop offset="75%" stopColor="#d4af37" />
            <stop offset="100%" stopColor="#ffd700" />
          </linearGradient>
        </defs>
      </svg>

      <div className="mb-2 flex items-center justify-end">
        <Select value={selectedPeriod} onValueChange={handlePeriodChange}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Period" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="3">Last 3 months</SelectItem>
            <SelectItem value="6">Last 6 months</SelectItem>
            <SelectItem value="12">Last 12 months</SelectItem>
            <SelectItem value="all">All history</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="mb-4 flex items-center justify-between">
        <p className="text-muted-foreground text-sm">
          {isLoadingData ? 'Loading...' : getVisibleDateRange()}
        </p>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeeks('prev')}
            disabled={!canNavigatePrev || isLoadingData}
            aria-label="Show older contributions"
          >
            <ChevronLeftIcon className="h-4 w-4" />
            <span className="sr-only">Older</span>
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigateWeeks('next')}
            disabled={!canNavigateNext || isLoadingData}
            aria-label="Show more recent contributions"
          >
            <ChevronRightIcon className="h-4 w-4" />
            <span className="sr-only">Newer</span>
          </Button>
        </div>
      </div>

      <div
        className={`w-full transition-opacity duration-300 ${isLoadingData ? 'opacity-50' : 'opacity-100'}`}
      >
        {isLoadingData ? (
          <div className="h-[175px] animate-pulse rounded-md bg-gray-200 dark:bg-gray-800"></div>
        ) : (
          <div ref={calendarRef} className="w-full">
            <div className="calendar-container w-full">
              <ActivityCalendar
                data={visibleData}
                labels={{
                  totalCount: `${processedData.totalContributions} total contributions`,
                }}
                renderBlock={(block, value) => {
                  const isUserAccountCreatedAt =
                    value.date.split('T')[0] ===
                    userAccountCreatedAt?.split('T')[0];

                  // Check if the date is after the user account creation date
                  const isAfterRegistration = userAccountCreatedAt
                    ? new Date(value.date).setHours(0, 0, 0, 0) >
                      new Date(userAccountCreatedAt).setHours(0, 0, 0, 0)
                    : false;

                  return (
                    <Tooltip>
                      <TooltipTrigger asChild>
                        {React.cloneElement(block, {
                          style: {
                            ...((block.props.style as React.CSSProperties) ||
                              {}),
                            cursor: 'pointer',
                            ...(isAfterRegistration
                              ? {
                                  stroke: '#ffd700',
                                  strokeWidth: 0.5,
                                }
                              : { stroke: 'none' }),
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
                        <TooltipContent
                          side="top"
                          sideOffset={5}
                          className="p-0"
                        >
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
                  light: [
                    '#f0f0f0',
                    '#c4edde',
                    '#7ac7c4',
                    '#306873',
                    '#0a4c6a',
                  ],
                  dark: ['#1f2937', '#0e4429', '#006d32', '#26a641', '#39d353'],
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="text-muted-foreground mt-2 text-center text-xs">
        {!isLoadingData && (
          <p>Use the arrows to navigate or modify the display period</p>
        )}
      </div>
    </div>
  );
}

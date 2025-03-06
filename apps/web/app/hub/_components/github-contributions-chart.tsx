'use client';

import { useMemo } from 'react';

import { Bar, BarChart, CartesianGrid, XAxis } from 'recharts';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@kit/ui/chart';

import { GithubContributionsData } from '../_hooks/use-github-contributions';

// Type for the formatted GitHub contributions data
export type ContributionDataPoint = {
  date: string;
  contributions: number;
};

/**
 * Formats GitHub contributions data for use with the chart component
 * @param contributionsData The raw GitHub contributions data
 * @returns An array of data points formatted for the chart
 */
function formatGithubContributionsForChart(
  contributionsData: GithubContributionsData,
): ContributionDataPoint[] {
  if (!contributionsData?.contributions) {
    return [];
  }

  const { contributions } = contributionsData;

  // Get the last month
  const today = new Date();
  const oneMonthAgo = new Date();
  oneMonthAgo.setMonth(today.getMonth() - 1);
  oneMonthAgo.setHours(0, 0, 0, 0);

  // Filter contributions to only include those from exactly the last 3 months
  const recentContributions = contributions.filter((contribution) => {
    const date = new Date(contribution.date);
    return date >= oneMonthAgo && date <= today;
  });

  // Sort contributions by date (oldest to newest)
  const sortedContributions = [...recentContributions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  // Format the data for the chart
  return sortedContributions.map((contribution) => ({
    date: contribution.date,
    contributions: contribution.count,
  }));
}

interface GithubContributionsChartProps {
  githubData: GithubContributionsData | undefined;
  isLoading: boolean;
  isError: boolean;
  username?: string;
}

export function GithubContributionsChart({
  githubData,
  isLoading,
  isError,
  username = 'User',
}: GithubContributionsChartProps) {
  // Format the GitHub contributions data for the chart
  const chartData = useMemo(() => {
    if (!githubData) return [];
    return formatGithubContributionsForChart(githubData);
  }, [githubData]);

  // Calculate the total contributions
  const totalContributions = useMemo(() => {
    if (!chartData.length) return 0;
    return chartData.reduce(
      (total: number, item: ContributionDataPoint) =>
        total + item.contributions,
      0,
    );
  }, [chartData]);

  // Chart configuration
  const chartConfig = {
    contributions: {
      label: 'Contributions',
      color: 'var(--chart-1)',
    },
  } satisfies ChartConfig;

  if (isLoading) {
    return (
      <Card className="h-full">
        <CardHeader className="border-b p-6">
          <CardTitle>GitHub Contributions</CardTitle>
          <div className="flex h-48 items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        </CardHeader>
      </Card>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardHeader className="border-b p-6">
          <CardTitle>GitHub Contributions</CardTitle>
          <CardDescription>Error loading GitHub data</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-col items-stretch space-y-0 border-b p-0 sm:flex-row">
        <div className="flex flex-1 flex-col justify-center gap-1 px-6 py-5 sm:py-6">
          <CardTitle>GitHub Contributions</CardTitle>
          <CardDescription>
            Showing {username}&apos;s contributions for the last month
          </CardDescription>
        </div>

        <div className="flex">
          <div className="data-[active=true]:bg-muted/50 relative z-30 flex flex-1 flex-col justify-center gap-1 border-t px-6 py-4 text-left even:border-l sm:border-t-0 sm:border-l sm:px-8 sm:py-6">
            <span className="text-muted-foreground text-xs">Total</span>
            <span className="text-lg leading-none font-bold sm:text-3xl">
              {totalContributions.toLocaleString()}
            </span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-2 sm:p-6">
        <ChartContainer
          config={chartConfig}
          className="aspect-auto h-64 w-full"
        >
          <BarChart accessibilityLayer data={chartData}>
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="date"
              tickLine={false}
              axisLine={false}
              tickMargin={8}
              minTickGap={32}
              tickFormatter={(value) => {
                const date = new Date(value);
                return date.toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                });
              }}
            />
            <ChartTooltip
              content={
                <ChartTooltipContent
                  className="w-[150px]"
                  nameKey="contributions"
                  labelFormatter={(value) => {
                    return new Date(value).toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                    });
                  }}
                />
              }
            />
            <Bar dataKey="contributions" fill="var(--chart-1)" />
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  );
}

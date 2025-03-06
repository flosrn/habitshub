'use client';

import React from 'react';

import { Trophy } from 'lucide-react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';

import { GithubContributionsData } from '~/hub/_hooks/use-github-contributions';
import { calculateBestGithubStreak } from '~/hub/_lib/calculate-github-streak';

import { Trend } from './trend';

/**
 * Component that displays the user's best GitHub streak
 */
export function GithubBestStreak(props: {
  githubData: GithubContributionsData | undefined;
  isLoading: boolean;
  isError: boolean;
}): React.ReactNode {
  const { bestStreak, status } = calculateBestGithubStreak(props.githubData);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Best Streak</CardTitle>
        <CardDescription>
          Your longest consecutive days of GitHub activity
        </CardDescription>
      </CardHeader>

      <CardContent>
        {props.isLoading ? (
          <div className="flex h-48 items-center justify-center">
            <div className="border-primary h-8 w-8 animate-spin rounded-full border-b-2"></div>
          </div>
        ) : props.isError ? (
          <div className="text-destructive py-8 text-center">
            Unable to load GitHub data. Please verify your username.
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center space-y-4 py-4">
            <div className="text-6xl font-bold">{bestStreak}</div>
            <Trend trend={status}>
              <div className="flex items-center space-x-2">
                <span>
                  {status === 'up'
                    ? 'Your personal best! Can you beat it?'
                    : 'Start your coding journey today!'}
                </span>
              </div>
            </Trend>
            <div className="text-muted-foreground mt-4 flex items-center justify-center space-x-1">
              <Trophy className="h-6 w-6 text-yellow-500" />
              <span>Keep coding to set a new record!</span>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

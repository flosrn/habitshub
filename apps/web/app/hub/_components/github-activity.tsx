'use client';

import React from 'react';

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@kit/ui/card';

import { GithubContributionsData } from '~/hub/_hooks/use-github-contributions';

import GithubActivityCalendar from './github-activity-calendar';

export function GithubActivity(props: {
  githubData: GithubContributionsData | undefined;
  isLoading: boolean;
  isError: boolean;
}): React.ReactNode {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Code Activity</CardTitle>
        <CardDescription>
          Showing the last 12 months of activity
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
          <GithubActivityCalendar githubContributionsData={props.githubData} />
        )}
      </CardContent>
    </Card>
  );
}

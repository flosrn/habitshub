'use client';

import dynamic from 'next/dynamic';

import { LoadingOverlay } from '@kit/ui/loading-overlay';
import { Trans } from '@kit/ui/trans';

export const DashboardStreaks = dynamic(
  () => import('./dashboard-streaks-stats'),
  {
    ssr: false,
    loading: () => (
      <LoadingOverlay>
        <span className={'text-muted-foreground'}>
          <Trans i18nKey={'common:loading'} />
        </span>
      </LoadingOverlay>
    ),
  },
);

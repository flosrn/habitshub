'use client';

import React, { useMemo } from 'react';

import { ArrowDown, ArrowUp, Menu } from 'lucide-react';

import { Badge } from '@kit/ui/badge';

export function BadgeWithTrend(
  props: React.PropsWithChildren<{ trend: string }>,
) {
  const className = useMemo(() => {
    switch (props.trend) {
      case 'up':
        return 'text-green-500';
      case 'down':
        return 'text-destructive';
      case 'stale':
        return 'text-orange-500';
    }
  }, [props.trend]);

  return (
    <Badge
      variant={'outline'}
      className={'border-transparent px-1.5 font-normal'}
    >
      <span className={className}>{props.children}</span>
    </Badge>
  );
}

export function Trend(
  props: React.PropsWithChildren<{
    trend: 'up' | 'down' | 'stale';
  }>,
) {
  const Icon = useMemo(() => {
    switch (props.trend) {
      case 'up':
        return <ArrowUp className={'h-4 w-4 text-green-500'} />;
      case 'down':
        return <ArrowDown className={'text-destructive h-4 w-4'} />;
      case 'stale':
        return <Menu className={'h-4 w-4 text-orange-500'} />;
    }
  }, [props.trend]);

  return (
    <div>
      <BadgeWithTrend trend={props.trend}>
        <span className={'flex items-center space-x-1'}>
          {Icon}
          <span>{props.children}</span>
        </span>
      </BadgeWithTrend>
    </div>
  );
}

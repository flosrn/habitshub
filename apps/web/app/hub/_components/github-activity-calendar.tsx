import React from 'react';

import GitHubCalendar from 'react-github-calendar';

import {
  Tooltip,
  TooltipContent,
  TooltipPortal,
  TooltipTrigger,
} from '@kit/ui/tooltip';

export default function GithubActivityCalendar() {
  const formatDate = (dateStr: string): string => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  return (
    <GitHubCalendar
      username="flosrn"
      blockSize={12}
      blockMargin={4}
      renderBlock={(block, value) => {
        return (
          <Tooltip>
            <TooltipTrigger asChild>
              {React.cloneElement(block, {
                style: {
                  ...((block.props.style as React.CSSProperties) || {}),
                  cursor: 'pointer',
                },
              })}
            </TooltipTrigger>
            <TooltipPortal>
              <TooltipContent side="top" sideOffset={5}>
                <div className="text-center">
                  <p className="font-medium">
                    {value.count} contribution{value.count > 1 ? 's' : ''}
                  </p>
                  <p className="text-muted-foreground text-xs">
                    {formatDate(value.date)}
                  </p>
                </div>
              </TooltipContent>
            </TooltipPortal>
          </Tooltip>
        );
      }}
    />
  );
}

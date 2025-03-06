import { GithubContributionsData } from '~/hub/_hooks/use-github-contributions';

/**
 * Calculate the current GitHub streak (consecutive days with commits)
 * @param contributionsData The GitHub contributions data
 * @returns The current streak count and status
 */
export function calculateGithubStreak(
  contributionsData: GithubContributionsData | undefined,
) {
  if (!contributionsData || !contributionsData.contributions) {
    return { currentStreak: 0, status: 'stale' as const };
  }

  const contributions = contributionsData.contributions;
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  let currentStreak = 0;
  const dayToCheck = new Date(today);

  // Check if there was activity today first
  const todayFormatted = today.toISOString().split('T')[0];
  const hasTodayContribution = contributions.some(
    (day) => day.date === todayFormatted && day.count > 0,
  );

  if (!hasTodayContribution) {
    // If no contribution today, check if there was one yesterday before counting streak
    dayToCheck.setDate(dayToCheck.getDate() - 1);
    const yesterdayFormatted = dayToCheck.toISOString().split('T')[0];
    const hasYesterdayContribution = contributions.some(
      (day) => day.date === yesterdayFormatted && day.count > 0,
    );

    if (!hasYesterdayContribution) {
      return { currentStreak: 0, status: 'stale' as const };
    }
  }

  // Count the streak
  while (true) {
    const dateFormatted = dayToCheck.toISOString().split('T')[0];
    const dayContributions = contributions.find(
      (day) => day.date === dateFormatted,
    );

    if (!dayContributions || dayContributions.count === 0) {
      break;
    }

    currentStreak++;
    dayToCheck.setDate(dayToCheck.getDate() - 1);
  }

  return {
    currentStreak,
    status: currentStreak > 0 ? ('up' as const) : ('stale' as const),
  };
}

/**
 * Calculate the best GitHub streak (longest consecutive days with commits) in history
 * @param contributionsData The GitHub contributions data
 * @returns The best streak count and status
 */
export function calculateBestGithubStreak(
  contributionsData: GithubContributionsData | undefined,
) {
  if (!contributionsData || !contributionsData.contributions) {
    return { bestStreak: 0, status: 'stale' as const };
  }

  const contributions = contributionsData.contributions;

  // Sort contributions by date (oldest to newest)
  const sortedContributions = [...contributions].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime(),
  );

  let currentStreak = 0;
  let bestStreak = 0;
  let lastDate: Date | null = null;

  // Iterate through all contributions to find the best streak
  for (const day of sortedContributions) {
    const date = new Date(day.date);

    // If this is a valid contribution day
    if (day.count > 0) {
      // If this is the first day with contribution or follows the previous day
      if (!lastDate || areDatesConsecutive(lastDate, date)) {
        currentStreak++;
        bestStreak = Math.max(bestStreak, currentStreak);
      } else {
        // Reset streak if days are not consecutive
        currentStreak = 1;
      }
      lastDate = date;
    } else {
      // Reset streak on days with no contributions
      currentStreak = 0;
      lastDate = null;
    }
  }

  return {
    bestStreak,
    status: bestStreak > 0 ? ('up' as const) : ('stale' as const),
  };
}

/**
 * Check if two dates are consecutive days
 */
function areDatesConsecutive(date1: Date, date2: Date): boolean {
  const oneDayInMs = 24 * 60 * 60 * 1000;
  const diffTime = Math.abs(date2.getTime() - date1.getTime());
  return diffTime <= oneDayInMs;
}

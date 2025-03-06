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

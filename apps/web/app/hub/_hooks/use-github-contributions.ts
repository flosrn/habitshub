import { useQuery } from '@tanstack/react-query';

/**
 * Fetches GitHub contribution data for a specific user.
 * Uses React Query to manage data fetching and caching.
 *
 * @param username - The GitHub username to fetch contributions for
 * @returns A React Query object containing GitHub contribution data
 */
export function useGithubContributions(username: string | undefined) {
  return useQuery({
    queryKey: ['github-contributions', username],
    queryFn: async () => {
      if (!username) {
        throw new Error('GitHub username required');
      }

      const response = await fetch(
        `https://github-contributions-api.jogruber.de/v4/${username}`,
      );

      if (!response.ok) {
        throw new Error(
          `Error fetching GitHub contributions: ${response.statusText}`,
        );
      }

      return response.json();
    },
    enabled: !!username,
    staleTime: 1000 * 60 * 60, // 1 hour
    refetchOnWindowFocus: false,
  });
}

// Type definition for GitHub contributions API response
export type GithubContributionsData = {
  total: {
    [year: string]: number;
  };
  contributions: {
    date: string;
    count: number;
    level: number;
  }[];
};

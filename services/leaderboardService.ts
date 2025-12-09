import { LeaderboardEntry } from "../types";

const LEADERBOARD_PREFIX = 'lessonarcade_lite_leaderboard_';

export function getLeaderboard(lessonId: string): LeaderboardEntry[] {
  try {
    const raw = localStorage.getItem(`${LEADERBOARD_PREFIX}${lessonId}`);
    if (!raw) return [];
    return JSON.parse(raw) as LeaderboardEntry[];
  } catch (e) {
    console.error("Failed to parse leaderboard", e);
    return [];
  }
}

export function saveScore(lessonId: string, entry: LeaderboardEntry): LeaderboardEntry[] {
  const current = getLeaderboard(lessonId);
  
  // Add new entry
  const updated = [...current, entry];
  
  // Sort: Highest score first, then most recent
  updated.sort((a, b) => {
    if (b.score !== a.score) {
      return b.score - a.score;
    }
    return b.completedAt - a.completedAt;
  });
  
  // Keep top 5
  const top5 = updated.slice(0, 5);
  
  try {
    localStorage.setItem(`${LEADERBOARD_PREFIX}${lessonId}`, JSON.stringify(top5));
  } catch (e) {
    console.error("Failed to save leaderboard", e);
  }
  
  return top5;
}

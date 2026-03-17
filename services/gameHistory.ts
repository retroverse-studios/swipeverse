/**
 * SwipeVerse Game History, Statistics & Achievements
 *
 * Persists game records, tracks stats, and evaluates achievements.
 * All data stored in localStorage.
 */

import { Stats, StatName } from "../types";

// ─── Types ───────────────────────────────────────────────────────

export type Difficulty = 'easy' | 'standard' | 'hard';

export const DIFFICULTY_MODIFIERS: Record<Difficulty, number> = {
    easy: 0.7,
    standard: 1.0,
    hard: 1.3,
};

export interface GameRecord {
    id: string;
    date: string;           // ISO string
    realityId: string;
    realityName: string;
    turns: number;
    finalStats: Stats;
    difficulty: Difficulty;
    won: boolean;
    reason: string;
}

export interface GameStats {
    totalGames: number;
    wins: number;
    losses: number;
    winRate: number;        // 0-100
    avgTurns: number;
    bestStreak: number;
    currentStreak: number;
    bestStats: Stats;       // highest value achieved per stat
}

export interface Achievement {
    id: string;
    name: string;
    description: string;
    icon: string;
    unlocked: boolean;
    unlockedDate?: string;
}

// ─── Achievement Definitions ─────────────────────────────────────

function defineAchievements(): Achievement[] {
    return [
        {
            id: 'first_win',
            name: 'First Victory',
            description: 'Win your first game in any reality.',
            icon: '🏆',
            unlocked: false,
        },
        {
            id: 'balanced_ruler',
            name: 'Balanced Ruler',
            description: 'Win a game with all stats between 40 and 60.',
            icon: '⚖️',
            unlocked: false,
        },
        {
            id: 'speed_runner',
            name: 'Speed Runner',
            description: 'Win a game in 15 turns or fewer.',
            icon: '⚡',
            unlocked: false,
        },
        {
            id: 'survivalist',
            name: 'Survivalist',
            description: 'Survive for at least 20 turns (win or lose).',
            icon: '🛡️',
            unlocked: false,
        },
        {
            id: 'resource_master',
            name: 'Resource Master',
            description: 'Reach 90+ in any stat and still win.',
            icon: '💎',
            unlocked: false,
        },
        {
            id: 'on_the_edge',
            name: 'On The Edge',
            description: 'Win with any stat at 10 or below.',
            icon: '🔥',
            unlocked: false,
        },
        {
            id: 'five_timer',
            name: 'Five Timer',
            description: 'Win 5 games total.',
            icon: '⭐',
            unlocked: false,
        },
        {
            id: 'ten_timer',
            name: 'Veteran',
            description: 'Play 10 games total.',
            icon: '🎖️',
            unlocked: false,
        },
        {
            id: 'hard_mode',
            name: 'Hard Mode Hero',
            description: 'Win a game on hard difficulty.',
            icon: '💀',
            unlocked: false,
        },
        {
            id: 'multiverse_explorer',
            name: 'Multiverse Explorer',
            description: 'Play games in 3 different realities.',
            icon: '🌌',
            unlocked: false,
        },
        {
            id: 'win_streak_3',
            name: 'Hot Streak',
            description: 'Win 3 games in a row.',
            icon: '🔥',
            unlocked: false,
        },
    ];
}

// ─── Storage Keys ────────────────────────────────────────────────

const HISTORY_KEY = 'swipeverse-history';
const ACHIEVEMENTS_KEY = 'swipeverse-achievements';
const MAX_HISTORY = 100;

// ─── Core Functions ──────────────────────────────────────────────

export function loadHistory(): GameRecord[] {
    try {
        const data = localStorage.getItem(HISTORY_KEY);
        return data ? JSON.parse(data) : [];
    } catch { return []; }
}

function saveHistory(history: GameRecord[]): void {
    try {
        // Keep only the most recent records
        const trimmed = history.slice(-MAX_HISTORY);
        localStorage.setItem(HISTORY_KEY, JSON.stringify(trimmed));
    } catch (e) {
        console.error("Failed to save game history:", e);
    }
}

export function loadAchievements(): Achievement[] {
    try {
        const data = localStorage.getItem(ACHIEVEMENTS_KEY);
        if (data) {
            const saved: Achievement[] = JSON.parse(data);
            // Merge with definitions (in case new achievements were added)
            const definitions = defineAchievements();
            return definitions.map(def => {
                const existing = saved.find(a => a.id === def.id);
                return existing ? { ...def, unlocked: existing.unlocked, unlockedDate: existing.unlockedDate } : def;
            });
        }
    } catch { /* fall through */ }
    return defineAchievements();
}

function saveAchievements(achievements: Achievement[]): void {
    try {
        localStorage.setItem(ACHIEVEMENTS_KEY, JSON.stringify(achievements));
    } catch (e) {
        console.error("Failed to save achievements:", e);
    }
}

// ─── Record a Game ───────────────────────────────────────────────

export interface GameSummary {
    record: GameRecord;
    newAchievements: Achievement[];
    stats: GameStats;
}

export function recordGame(
    realityId: string,
    realityName: string,
    turns: number,
    finalStats: Stats,
    difficulty: Difficulty,
    won: boolean,
    reason: string,
): GameSummary {
    const record: GameRecord = {
        id: `game-${Date.now()}`,
        date: new Date().toISOString(),
        realityId,
        realityName,
        turns,
        finalStats,
        difficulty,
        won,
        reason,
    };

    const history = loadHistory();
    history.push(record);
    saveHistory(history);

    const newAchievements = checkAchievements(record, history);
    const stats = calculateStats(history);

    return { record, newAchievements, stats };
}

// ─── Achievement Evaluation ──────────────────────────────────────

function checkAchievements(record: GameRecord, history: GameRecord[]): Achievement[] {
    const achievements = loadAchievements();
    const newlyUnlocked: Achievement[] = [];
    const now = new Date().toISOString();
    const statValues = Object.values(record.finalStats);
    const totalWins = history.filter(g => g.won).length;
    const uniqueRealities = new Set(history.map(g => g.realityId)).size;

    // Calculate current win streak
    let streak = 0;
    for (let i = history.length - 1; i >= 0; i--) {
        if (history[i].won) streak++;
        else break;
    }

    const checks: Record<string, boolean> = {
        first_win: record.won,
        balanced_ruler: record.won && statValues.every(v => v >= 40 && v <= 60),
        speed_runner: record.won && record.turns <= 15,
        survivalist: record.turns >= 20,
        resource_master: record.won && statValues.some(v => v >= 90),
        on_the_edge: record.won && statValues.some(v => v <= 10),
        five_timer: totalWins >= 5,
        ten_timer: history.length >= 10,
        hard_mode: record.won && record.difficulty === 'hard',
        multiverse_explorer: uniqueRealities >= 3,
        win_streak_3: streak >= 3,
    };

    for (const achievement of achievements) {
        if (achievement.unlocked) continue;
        if (checks[achievement.id]) {
            achievement.unlocked = true;
            achievement.unlockedDate = now;
            newlyUnlocked.push(achievement);
        }
    }

    if (newlyUnlocked.length > 0) {
        saveAchievements(achievements);
    }

    return newlyUnlocked;
}

// ─── Statistics Calculation ──────────────────────────────────────

export function calculateStats(history?: GameRecord[]): GameStats {
    const records = history || loadHistory();

    if (records.length === 0) {
        return {
            totalGames: 0, wins: 0, losses: 0, winRate: 0,
            avgTurns: 0, bestStreak: 0, currentStreak: 0,
            bestStats: { Power: 0, Wealth: 0, People: 0, Knowledge: 0 },
        };
    }

    const wins = records.filter(g => g.won).length;
    const totalTurns = records.reduce((sum, g) => sum + g.turns, 0);

    // Best stats (highest value ever achieved per stat)
    const bestStats: Stats = { Power: 0, Wealth: 0, People: 0, Knowledge: 0 };
    for (const record of records) {
        for (const key of Object.keys(bestStats) as StatName[]) {
            if (record.finalStats[key] > bestStats[key]) {
                bestStats[key] = record.finalStats[key];
            }
        }
    }

    // Win streaks
    let bestStreak = 0;
    let currentStreak = 0;
    let tempStreak = 0;
    for (const record of records) {
        if (record.won) {
            tempStreak++;
            bestStreak = Math.max(bestStreak, tempStreak);
        } else {
            tempStreak = 0;
        }
    }
    // Current streak (from the end)
    for (let i = records.length - 1; i >= 0; i--) {
        if (records[i].won) currentStreak++;
        else break;
    }

    return {
        totalGames: records.length,
        wins,
        losses: records.length - wins,
        winRate: Math.round((wins / records.length) * 100),
        avgTurns: Math.round(totalTurns / records.length),
        bestStreak,
        currentStreak,
        bestStats,
    };
}

// ─── Apply Difficulty Modifier ───────────────────────────────────

export function applyDifficultyModifier(effectValue: number, difficulty: Difficulty): number {
    return Math.round(effectValue * DIFFICULTY_MODIFIERS[difficulty]);
}

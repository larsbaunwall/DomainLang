/**
 * First-run detection hook.
 * Checks if this is the first time the CLI has been run.
 * 
 * @module ui/hooks/useFirstRun
 */
import { useState, useEffect } from 'react';
import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';

/**
 * Path to the first-run marker file.
 */
const MARKER_DIR = join(homedir(), '.dlang');
const MARKER_FILE = join(MARKER_DIR, '.welcomed');

/**
 * Check if this is the first run (synchronous version for non-React usage).
 * @returns True if this is the first time the CLI has been run
 */
export function isFirstRun(): boolean {
    return !existsSync(MARKER_FILE);
}

/**
 * Mark the first run as complete (create marker file).
 */
export function markFirstRunComplete(): void {
    try {
        if (!existsSync(MARKER_DIR)) {
            mkdirSync(MARKER_DIR, { recursive: true });
        }
        writeFileSync(MARKER_FILE, new Date().toISOString(), 'utf-8');
    } catch {
        // Silently ignore errors (e.g., permission issues)
    }
}

/**
 * Hook to detect and track first-run status.
 * @returns Object with isFirstRun state and markComplete function
 */
export function useFirstRun(): {
    isFirstRun: boolean;
    markComplete: () => void;
} {
    const [firstRun, setFirstRun] = useState(() => isFirstRun());

    const markComplete = (): void => {
        markFirstRunComplete();
        setFirstRun(false);
    };

    return {
        isFirstRun: firstRun,
        markComplete,
    };
}

/**
 * Hook to get elapsed time since mount.
 * Useful for loading timers.
 * @param interval - Update interval in ms (default: 100)
 * @returns Elapsed time in seconds
 */
export function useElapsedTime(interval = 100): number {
    const [elapsed, setElapsed] = useState(0);
    const [startTime] = useState(() => Date.now());

    useEffect(() => {
        const timer = setInterval(() => {
            setElapsed((Date.now() - startTime) / 1000);
        }, interval);

        return () => clearInterval(timer);
    }, [startTime, interval]);

    return elapsed;
}

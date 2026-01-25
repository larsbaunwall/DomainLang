/**
 * Emoji constants for consistent visual feedback.
 * All emoji used in CLI output MUST come from this module.
 * All emoji include proper trailing space for consistent formatting.
 * 
 * @module ui/themes/emoji
 */

/**
 * Standard emoji for CLI feedback.
 * Organized by category for easy reference.
 * Each emoji includes a trailing space for consistent inline usage.
 */
export const EMOJI = {
    // Status indicators
    success: '✅ ',
    error: '❌ ',
    warning: '⚠️ ',
    info: 'ℹ️ ',

    // Progress
    loading: '⏳ ',
    rocket: '🚀 ',

    // Files and folders
    file: '📄 ',
    folder: '📁 ',
    package: '📦 ',

    // Actions
    search: '🔍 ',
    link: '🔗 ',
    tip: '💡 ',

    // Data
    chart: '📊 ',
    list: '📋 ',
    tree: '🌳 ',

    // Editing
    pencil: '📝 ',
    check: '✅ ',
    cross: '❌ ',

    // Domain concepts (DDD)
    domain: '🏛️ ',
    context: '🔲 ',
    aggregate: '📦 ',

    // Misc
    sparkles: '✨ ',
    fire: '🔥 ',
    gear: '⚙️ ',
    book: '📖 ',
    tools: '🔨 ',
} as const;

/**
 * Type-safe emoji key accessor.
 */
export type EmojiKey = keyof typeof EMOJI;

/**
 * Get emoji with fallback for text-only modes.
 * @param key - The emoji key
 * @param textFallback - Optional text fallback for --no-emoji mode
 * @returns The emoji or text fallback
 */
export function getEmoji(key: EmojiKey, textFallback?: string): string {
    return EMOJI[key] || textFallback || '';
}

/**
 * Text equivalents for emoji (used in JSON/quiet modes).
 * Useful for CI/CD environments that don't render emoji well.
 */
export const EMOJI_TEXT: Record<EmojiKey, string> = {
    success: '[OK]',
    error: '[ERROR]',
    warning: '[WARN]',
    info: '[INFO]',
    loading: '[...]',
    rocket: '[DONE]',
    file: '[FILE]',
    folder: '[DIR]',
    package: '[PKG]',
    search: '[FIND]',
    link: '[LINK]',
    tip: '[TIP]',
    chart: '[STATS]',
    list: '[LIST]',
    tree: '[TREE]',
    pencil: '[EDIT]',
    check: '[v]',
    cross: '[x]',
    domain: '[DOM]',
    context: '[BC]',
    aggregate: '[AGG]',
    sparkles: '[*]',
    fire: '[!]',
    gear: '[CFG]',
    book: '[DOC]',
    tools: '[TOOL]',
};

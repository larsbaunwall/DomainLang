/**
 * Semantic Versioning Utilities
 * 
 * Centralized SemVer parsing, comparison, and validation for the dependency system.
 * All version-related logic should use these utilities to ensure consistency.
 * 
 * Supported formats:
 * - "1.0.0" or "v1.0.0" (tags)
 * - "1.0.0-alpha.1" (pre-release)
 * - "main", "develop" (branches)
 * - "abc123def" (commit SHAs, 7-40 hex chars)
 */

import type { SemVer, RefType, ParsedRef } from './types.js';

// ============================================================================
// Parsing
// ============================================================================

/**
 * Parses a version string into SemVer components.
 * Returns undefined if not a valid SemVer.
 * 
 * @example
 * parseSemVer("v1.2.3")       // { major: 1, minor: 2, patch: 3, original: "v1.2.3" }
 * parseSemVer("1.0.0-alpha")  // { major: 1, minor: 0, patch: 0, prerelease: "alpha", ... }
 * parseSemVer("main")         // undefined (not SemVer)
 */
export function parseSemVer(version: string): SemVer | undefined {
    // Strip leading 'v' if present
    const normalized = version.startsWith('v') ? version.slice(1) : version;
    
    // Match semver pattern: major.minor.patch[-prerelease]
    const match = normalized.match(/^(\d+)\.(\d+)\.(\d+)(?:-(.+))?$/);
    if (!match) return undefined;
    
    return {
        major: parseInt(match[1], 10),
        minor: parseInt(match[2], 10),
        patch: parseInt(match[3], 10),
        preRelease: match[4],
        original: version,
    };
}

/**
 * Detects the type of a git ref based on its format.
 * 
 * @example
 * detectRefType("v1.0.0")    // 'tag'
 * detectRefType("1.2.3")     // 'tag'
 * detectRefType("main")      // 'branch'
 * detectRefType("abc123def") // 'commit'
 */
export function detectRefType(ref: string): RefType {
    // Commit SHA: 7-40 hex characters
    if (/^[0-9a-f]{7,40}$/i.test(ref)) {
        return 'commit';
    }
    // Tags typically start with 'v' followed by semver
    if (/^v?\d+\.\d+\.\d+/.test(ref)) {
        return 'tag';
    }
    // Everything else is treated as a branch
    return 'branch';
}

/**
 * Parses a ref string into a structured ParsedRef with type and optional SemVer.
 */
export function parseRef(ref: string): ParsedRef {
    const type = detectRefType(ref);
    const semver = type === 'tag' ? parseSemVer(ref) : undefined;
    
    return { original: ref, type, semver };
}

// ============================================================================
// Comparison
// ============================================================================

/**
 * Compares two SemVer versions.
 * Returns: negative if a < b, positive if a > b, zero if equal.
 * 
 * @example
 * compareSemVer(parse("1.0.0"), parse("2.0.0")) // negative (a < b)
 * compareSemVer(parse("1.5.0"), parse("1.2.0")) // positive (a > b)
 * compareSemVer(parse("1.0.0-alpha"), parse("1.0.0")) // negative (prerelease < release)
 */
export function compareSemVer(a: SemVer, b: SemVer): number {
    if (a.major !== b.major) return a.major - b.major;
    if (a.minor !== b.minor) return a.minor - b.minor;
    if (a.patch !== b.patch) return a.patch - b.patch;
    
    // Pre-release versions are lower than release versions
    if (a.preRelease && !b.preRelease) return -1;
    if (!a.preRelease && b.preRelease) return 1;
    if (a.preRelease && b.preRelease) {
        return a.preRelease.localeCompare(b.preRelease);
    }
    
    return 0;
}

/**
 * Picks the latest from a list of SemVer refs.
 * Returns the ref string (with original 'v' prefix if present).
 * 
 * @example
 * pickLatestSemVer(["v1.0.0", "v1.5.0", "v1.2.0"]) // "v1.5.0"
 */
export function pickLatestSemVer(refs: string[]): string | undefined {
    const parsed = refs
        .map(ref => ({ ref, semver: parseSemVer(ref) }))
        .filter((item): item is { ref: string; semver: SemVer } => item.semver !== undefined);
    
    if (parsed.length === 0) return undefined;
    
    parsed.sort((a, b) => compareSemVer(b.semver, a.semver)); // Descending
    return parsed[0].ref;
}

/**
 * Sorts version strings in descending order (newest first).
 * Non-SemVer refs are sorted lexicographically at the end.
 * 
 * @example
 * sortVersionsDescending(["v1.0.0", "v2.0.0", "v1.5.0"]) // ["v2.0.0", "v1.5.0", "v1.0.0"]
 */
export function sortVersionsDescending(versions: string[]): string[] {
    return [...versions].sort((a, b) => {
        const semverA = parseSemVer(a);
        const semverB = parseSemVer(b);
        
        // Both are SemVer - compare semantically
        if (semverA && semverB) {
            return compareSemVer(semverB, semverA); // Descending
        }
        
        // SemVer comes before non-SemVer
        if (semverA && !semverB) return -1;
        if (!semverA && semverB) return 1;
        
        // Both non-SemVer - lexicographic
        return b.localeCompare(a);
    });
}

// ============================================================================
// Validation
// ============================================================================

/**
 * Checks if a version/ref is a pre-release.
 * 
 * Pre-release identifiers: alpha, beta, rc, pre, dev, snapshot
 * 
 * @example
 * isPreRelease("v1.0.0")       // false
 * isPreRelease("v1.0.0-alpha") // true
 * isPreRelease("v1.0.0-rc.1")  // true
 */
export function isPreRelease(ref: string): boolean {
    const semver = parseSemVer(ref);
    if (semver?.preRelease) {
        return true;
    }
    
    // Also check for common pre-release patterns without proper SemVer
    const clean = ref.replace(/^v/, '');
    return /-(alpha|beta|rc|pre|dev|snapshot)/i.test(clean);
}

/**
 * Checks if two SemVer versions are compatible (same major version).
 * 
 * @example
 * areSameMajor(parse("1.0.0"), parse("1.5.0")) // true
 * areSameMajor(parse("1.0.0"), parse("2.0.0")) // false
 */
export function areSameMajor(a: SemVer, b: SemVer): boolean {
    return a.major === b.major;
}

/**
 * Gets the major version number from a ref string.
 * Returns undefined if not a valid SemVer.
 */
export function getMajorVersion(ref: string): number | undefined {
    return parseSemVer(ref)?.major;
}

// ============================================================================
// Filtering
// ============================================================================

/**
 * Filters refs to only stable versions (excludes pre-releases).
 * 
 * @example
 * filterStableVersions(["v1.0.0", "v1.1.0-alpha", "v1.2.0"]) // ["v1.0.0", "v1.2.0"]
 */
export function filterStableVersions(refs: string[]): string[] {
    return refs.filter(ref => !isPreRelease(ref));
}

/**
 * Filters refs to only SemVer tags (excludes branches and commits).
 */
export function filterSemVerTags(refs: string[]): string[] {
    return refs.filter(ref => detectRefType(ref) === 'tag' && parseSemVer(ref) !== undefined);
}

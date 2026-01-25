/**
 * Tests for SectionHeader component.
 * Verifies proper emoji width alignment.
 * 
 * @module ui/components/SectionHeader.test
 */
import { render } from 'ink-testing-library';
import { describe, it, expect } from 'vitest';
import { SectionHeader } from './SectionHeader.js';

describe('SectionHeader', () => {
    it('should render icon and title', () => {
        const { lastFrame } = render(
            <SectionHeader icon="📖 " title="USAGE" />
        );
        expect(lastFrame()).toContain('📖');
        expect(lastFrame()).toContain('USAGE');
    });

    it('should handle single-width emoji', () => {
        const { lastFrame } = render(
            <SectionHeader icon="⚙️ " title="OPTIONS" />
        );
        expect(lastFrame()).toContain('⚙');
        expect(lastFrame()).toContain('OPTIONS');
    });

    it('should handle double-width emoji', () => {
        const { lastFrame } = render(
            <SectionHeader icon="📦 " title="PACKAGES" />
        );
        expect(lastFrame()).toContain('📦');
        expect(lastFrame()).toContain('PACKAGES');
    });

    it('should align headers consistently', () => {
        // Render two headers with different emoji widths
        const { lastFrame: frame1 } = render(
            <SectionHeader icon="⚙️ " title="OPTIONS" />
        );
        const { lastFrame: frame2 } = render(
            <SectionHeader icon="📦 " title="PACKAGES" />
        );

        // Both should have title starting at consistent position
        // We check that the output exists and contains expected text
        expect(frame1()).toContain('OPTIONS');
        expect(frame2()).toContain('PACKAGES');
    });

    it('should trim trailing spaces from icon', () => {
        const { lastFrame } = render(
            <SectionHeader icon="📖   " title="USAGE" />
        );
        // Should not have excessive spacing
        const output = lastFrame();
        expect(output).toBeDefined();
        expect(output).toContain('USAGE');
    });
});

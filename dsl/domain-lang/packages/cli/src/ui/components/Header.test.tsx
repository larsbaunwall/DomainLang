/**
 * Tests for the Header component.
 */
import { describe, it, expect } from 'vitest';
import { render } from '../../test-utils/render.js';
import { Header } from './Header.js';

describe('Header', () => {
    it('renders responsive header for wide terminal', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <Header version="1.0.0" />,
            120,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders responsive header for narrow terminal', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <Header version="1.0.0" />,
            60,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders with first-run context', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <Header version="1.0.0" context="first-run" />,
            80,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('returns null for none context', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <Header version="1.0.0" context="none" />,
            80,
        );

        // Assert
        expect(lastFrame()).toBe('');
    });
});

/**
 * Tests for the StatusMessage component.
 */
import { describe, it, expect } from 'vitest';
import { render } from '../../test-utils/render.js';
import { 
    StatusMessage, 
    SuccessMessage, 
    ErrorMessage, 
    WarningMessage, 
    InfoMessage,
} from './StatusMessage.js';

describe('StatusMessage', () => {
    it.each([
        ['success', 'Operation completed'],
        ['error', 'Something failed'],
        ['warning', 'Proceed with caution'],
        ['info', 'For your information'],
    ] as const)('renders %s type', (type, message) => {
        // Arrange & Act
        const { lastFrame } = render(
            <StatusMessage type={type} message={message} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });
});

describe('Shorthand status components', () => {
    it('renders SuccessMessage', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <SuccessMessage message="All tests passed!" />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders ErrorMessage', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <ErrorMessage message="File not found" />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders WarningMessage', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <WarningMessage message="Deprecated syntax detected" />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders InfoMessage', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <InfoMessage message="Press Ctrl+C to exit" />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });
});

/**
 * Tests for the Banner component.
 * Uses snapshot testing following Gemini CLI patterns.
 */
import { describe, it, expect } from 'vitest';
import { Text } from 'ink';
import { render } from '../../test-utils/render.js';
import { Banner, InfoBox, SuccessBanner, ErrorBanner, WarningBanner } from './Banner.js';

describe('Banner', () => {
    it.each([
        ['warning mode', true, 'Warning Message'],
        ['info mode', false, 'Info Message'],
    ])('renders in %s', (_description, isWarning, text) => {
        // Arrange
        const props = { bannerText: text, isWarning, width: 80 };

        // Act
        const { lastFrame } = render(<Banner {...props} />);

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('handles newlines in text', () => {
        // Arrange
        const text = 'Line 1\\nLine 2';

        // Act
        const { lastFrame } = render(
            <Banner bannerText={text} isWarning={false} width={80} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders success variant', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <Banner bannerText="Success!" variant="success" width={60} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders error variant', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <Banner bannerText="Error occurred" variant="error" width={60} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });
});

describe('InfoBox', () => {
    it('renders children with border', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <InfoBox width={40}>
                <Text>Some content here</Text>
            </InfoBox>,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });
});

describe('Banner shorthand components', () => {
    it('renders SuccessBanner', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <SuccessBanner message="Operation completed" width={50} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders ErrorBanner', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <ErrorBanner message="Something went wrong" width={50} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders WarningBanner', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <WarningBanner message="Proceed with caution" width={50} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });
});

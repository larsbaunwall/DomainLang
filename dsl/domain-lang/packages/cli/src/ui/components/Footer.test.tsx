/**
 * Tests for the Footer component.
 */
import { describe, it, expect } from 'vitest';
import { render } from '../../test-utils/render.js';
import { Footer, MinimalFooter } from './Footer.js';

describe('Footer', () => {
    it('renders with version only', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <Footer version="1.0.0" width={80} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders with working directory', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <Footer version="1.0.0" workingDir="/Users/test/project" width={80} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders with command indicator', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <Footer version="1.0.0" command="validate" width={80} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders with all props', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <Footer 
                version="2.1.0" 
                workingDir="/path/to/project" 
                command="generate"
                width={100} 
            />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });
});

describe('MinimalFooter', () => {
    it('renders version only', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <MinimalFooter version="1.0.0" />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });
});

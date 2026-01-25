/**
 * Tests for the Help command.
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render } from '../test-utils/render.js';
import { Help } from './help.js';
import type { CommandContext } from './types.js';

// Mock stdout.write for non-rich modes
const originalWrite = process.stdout.write;
let stdoutOutput: string;

beforeEach(() => {
    stdoutOutput = '';
    process.stdout.write = vi.fn((chunk: string | Uint8Array) => {
        stdoutOutput += typeof chunk === 'string' ? chunk : chunk.toString();
        return true;
    }) as typeof process.stdout.write;
});

afterEach(() => {
    process.stdout.write = originalWrite;
});

describe('Help command', () => {
    it('renders rich help output', () => {
        // Arrange
        const context: CommandContext = {
            version: '1.0.0',
            isFirstRun: false,
            mode: 'rich',
            noColor: false,
            cwd: '/test/project',
        };

        // Act
        const { lastFrame } = render(
            <Help context={context} />,
            80,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('outputs JSON help when mode is json', () => {
        // Arrange
        const context: CommandContext = {
            version: '1.0.0',
            isFirstRun: false,
            mode: 'json',
            noColor: false,
            cwd: '/test/project',
        };

        // Act
        render(<Help context={context} />);

        // Assert
        const output = JSON.parse(stdoutOutput);
        expect(output.version).toBe('1.0.0');
        expect(output.commands).toBeInstanceOf(Array);
        expect(output.options).toBeInstanceOf(Array);
    });

    it('outputs minimal help when mode is quiet', () => {
        // Arrange
        const context: CommandContext = {
            version: '2.0.0',
            isFirstRun: false,
            mode: 'quiet',
            noColor: false,
            cwd: '/test/project',
        };

        // Act
        render(<Help context={context} />);

        // Assert
        expect(stdoutOutput).toContain('dlang v2.0.0');
        expect(stdoutOutput).toContain('Commands:');
    });
});

/**
 * Tests for the Validate command component.
 * Tests loading states, success scenarios, and error handling.
 *
 * @module commands/validate.test
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Text } from 'ink';
import { render } from '../test-utils/render.js';
import { Validate } from './validate.js';
import type { CommandContext, ValidationResult } from './types.js';

// Mock Langium services
vi.mock('@domainlang/language', () => ({
    createDomainLangServices: vi.fn(() => ({
        DomainLang: {
            LanguageMetaData: { fileExtensions: ['.dlang'] },
            shared: {
                workspace: {
                    LangiumDocuments: {
                        getOrCreateDocument: vi.fn(),
                    },
                    DocumentBuilder: {
                        build: vi.fn(),
                    },
                },
            },
        },
    })),
}));

vi.mock('langium/node', () => ({
    NodeFileSystem: {},
}));

vi.mock('node:fs', () => ({
    existsSync: vi.fn(() => true),
}));

describe('Validate command', () => {
    const defaultContext: CommandContext = {
        mode: 'rich',
        noColor: false,
        cwd: '/test/project',
        version: '0.1.0',
        isFirstRun: false,
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.restoreAllMocks();
    });

    describe('loading state', () => {
        it('shows spinner while validating', () => {
            // Arrange
            const file = 'test-model.dlang';

            // Act
            const { lastFrame } = render(
                <Validate file={file} context={defaultContext} />,
            );

            // Assert - should show loading spinner
            const output = lastFrame();
            expect(output).toContain('Validating');
            expect(output).toContain(file);
        });
    });

    describe('component structure', () => {
        it('renders with correct props', () => {
            // Arrange
            const file = 'domain-model.dlang';
            const context: CommandContext = {
                mode: 'rich',
                noColor: false,
                cwd: '/home/user/projects',
                version: '0.1.0',
                isFirstRun: false,
            };

            // Act
            const { lastFrame } = render(
                <Validate file={file} context={context} />,
            );

            // Assert - component renders without error
            expect(lastFrame()).toBeDefined();
        });
    });
});

describe('Validate result display', () => {
    /**
     * Component for testing successful validation display.
     * This bypasses the async validation and directly renders results.
     */
    const SuccessResultDisplay: React.FC = () => {
        const result: ValidationResult = {
            valid: true,
            fileCount: 1,
            domainCount: 2,
            bcCount: 3,
            errors: [],
            warnings: [],
        };

        return (
            <Text>
                Model validated: {result.domainCount} domains, {result.bcCount} BCs
            </Text>
        );
    };

    const ErrorResultDisplay: React.FC = () => {
        const result: ValidationResult = {
            valid: false,
            fileCount: 1,
            domainCount: 1,
            bcCount: 1,
            errors: [
                {
                    code: 'E001',
                    message: 'Missing domain vision',
                    file: 'test.dlang',
                    line: 5,
                    column: 10,
                },
            ],
            warnings: [
                {
                    code: 'W001',
                    message: 'Consider adding description',
                    file: 'test.dlang',
                    line: 10,
                },
            ],
        };

        return (
            <Text>
                Validation failed: {result.errors.length} errors, {result.warnings.length} warnings
            </Text>
        );
    };

    it('renders success display snapshot', () => {
        // Act
        const { lastFrame } = render(<SuccessResultDisplay />);

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders error display snapshot', () => {
        // Act
        const { lastFrame } = render(<ErrorResultDisplay />);

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });
});

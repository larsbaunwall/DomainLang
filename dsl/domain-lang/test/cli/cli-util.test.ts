import { describe, it, expect } from 'vitest';
import path from 'node:path';
import { extractDestinationAndName } from '../../src/cli/cli-util.js';

describe('extractDestinationAndName', () => {
    it('derives default destination from source directory', () => {
        const filePath = path.join('/workspace/models', 'customer-facing.dlang');
        const result = extractDestinationAndName(filePath, undefined);

        expect(result.destination).toBe(path.join('/workspace/models', 'generated'));
        expect(result.name).toBe('customerfacing');
    });

    it('respects explicit destination option', () => {
        const filePath = 'domain-model.dlang';
        const result = extractDestinationAndName(filePath, '/tmp/output');

        expect(result.destination).toBe('/tmp/output');
        expect(result.name).toBe('domainmodel');
    });
});

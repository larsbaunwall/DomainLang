/**
 * Table component for data display.
 * Uses consistent styling with rounded borders.
 * 
 * @module ui/components/Table
 */
import React from 'react';
import { Box, Text } from 'ink';
import { tokens } from '../tokens.js';
import { colors } from '../themes/colors.js';

/**
 * Props for Table component.
 */
export interface TableProps {
    /** Column headers */
    headers: string[];
    /** Row data (array of arrays) */
    rows: string[][];
    /** Column widths (optional, auto-calculated if not provided) */
    columnWidths?: number[];
    /** Use compact mode (less padding) */
    compact?: boolean;
}

/**
 * Calculate column widths based on content.
 */
function calculateColumnWidths(headers: string[], rows: string[][]): number[] {
    const widths = headers.map(h => h.length);

    for (const row of rows) {
        for (let i = 0; i < row.length; i++) {
            const cellLength = row[i]?.length || 0;
            if (cellLength > (widths[i] || 0)) {
                widths[i] = cellLength;
            }
        }
    }

    // Add padding
    return widths.map(w => w + 2);
}

/**
 * Table component.
 * Displays tabular data with styled headers and rows.
 * 
 * @example
 * ```tsx
 * <Table 
 *   headers={['Name', 'Type', 'Team']}
 *   rows={[
 *     ['OrderContext', 'Core', 'Sales Team'],
 *     ['BillingContext', 'Supporting', 'Finance Team'],
 *   ]}
 * />
 * ```
 */
export const Table: React.FC<TableProps> = ({
    headers,
    rows,
    columnWidths,
    compact = false,
}) => {
    const widths = columnWidths || calculateColumnWidths(headers, rows);
    const padding = compact ? tokens.spacing.xs : tokens.spacing.sm;

    return (
        <Box
            flexDirection="column"
            borderStyle={tokens.borders.style}
            borderColor={colors.border.default}
            paddingX={1}
        >
            {/* Header row */}
            <Box>
                {headers.map((header, i) => (
                    <Box key={i} width={widths[i]} paddingRight={padding}>
                        <Text bold color={colors.primary}>
                            {header}
                        </Text>
                    </Box>
                ))}
            </Box>

            {/* Separator */}
            <Box marginY={compact ? 0 : 1}>
                <Text color={colors.muted}>
                    {widths.map(w => '─'.repeat(w)).join('─')}
                </Text>
            </Box>

            {/* Data rows */}
            {rows.map((row, rowIndex) => (
                <Box key={rowIndex}>
                    {row.map((cell, cellIndex) => (
                        <Box key={cellIndex} width={widths[cellIndex]} paddingRight={padding}>
                            <Text color={colors.secondary}>
                                {cell}
                            </Text>
                        </Box>
                    ))}
                </Box>
            ))}
        </Box>
    );
};

/**
 * Props for KeyValue component.
 */
export interface KeyValueProps {
    /** Key-value pairs to display */
    data: Record<string, string | number>;
    /** Label width (optional) */
    labelWidth?: number;
}

/**
 * KeyValue component.
 * Displays key-value pairs in a clean format.
 * 
 * @example
 * ```tsx
 * <KeyValue data={{ 'Files': 3, 'Domains': 5, 'Bounded Contexts': 12 }} />
 * ```
 */
export const KeyValue: React.FC<KeyValueProps> = ({ data, labelWidth = 20 }) => {
    return (
        <Box flexDirection="column">
            {Object.entries(data).map(([key, value]) => (
                <Box key={key}>
                    <Box width={labelWidth}>
                        <Text color={colors.secondary}>{key}:</Text>
                    </Box>
                    <Text color={colors.primary}>{String(value)}</Text>
                </Box>
            ))}
        </Box>
    );
};

/**
 * Props for List component.
 */
export interface ListProps {
    /** Items to display */
    items: string[];
    /** Bullet character (default: •) */
    bullet?: string;
    /** Whether items are ordered (numbered) */
    ordered?: boolean;
}

/**
 * List component.
 * Displays a bulleted or numbered list.
 * 
 * @example
 * ```tsx
 * <List items={['First item', 'Second item', 'Third item']} />
 * <List items={['Step one', 'Step two']} ordered />
 * ```
 */
export const List: React.FC<ListProps> = ({
    items,
    bullet = '•',
    ordered = false,
}) => {
    return (
        <Box flexDirection="column" marginLeft={tokens.indent.item}>
            {items.map((item, index) => (
                <Box key={index}>
                    <Text color={colors.muted}>
                        {ordered ? `${index + 1}.` : bullet}
                    </Text>
                    <Text color={colors.secondary}> {item}</Text>
                </Box>
            ))}
        </Box>
    );
};

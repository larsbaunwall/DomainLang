/**
 * Tests for the Table component.
 */
import { describe, it, expect } from 'vitest';
import { render } from '../../test-utils/render.js';
import { Table, KeyValue, List } from './Table.js';

describe('Table', () => {
    it('renders table with headers and rows', () => {
        // Arrange
        const headers = ['Name', 'Type'];
        const rows = [
            ['Sales', 'Domain'],
            ['Billing', 'Bounded Context'],
        ];

        // Act
        const { lastFrame } = render(
            <Table headers={headers} rows={rows} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders empty table', () => {
        // Arrange
        const headers = ['Name'];
        const rows: string[][] = [];

        // Act
        const { lastFrame } = render(
            <Table headers={headers} rows={rows} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });
});

describe('KeyValue', () => {
    it('renders key-value pairs from data object', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <KeyValue data={{ Version: '1.0.0', Status: 'Active' }} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders with custom label width', () => {
        // Arrange & Act
        const { lastFrame } = render(
            <KeyValue data={{ Name: 'Test', Type: 'Core' }} labelWidth={30} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });
});

describe('List', () => {
    it('renders ordered list', () => {
        // Arrange
        const items = ['First item', 'Second item', 'Third item'];

        // Act
        const { lastFrame } = render(
            <List items={items} ordered />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders unordered list', () => {
        // Arrange
        const items = ['Apple', 'Banana', 'Cherry'];

        // Act
        const { lastFrame } = render(
            <List items={items} />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });

    it('renders with custom bullet', () => {
        // Arrange
        const items = ['Item 1', 'Item 2'];

        // Act
        const { lastFrame } = render(
            <List items={items} bullet="→" />,
        );

        // Assert
        expect(lastFrame()).toMatchSnapshot();
    });
});

export * from './domain-lang-module.js';
export * from './generated/ast.js';
export * from './generated/grammar.js';
export * from './generated/module.js';
// Note: main.js is intentionally NOT exported here - it's the LSP entry point
// and creates a connection when imported, which breaks CLI/SDK standalone usage
export * from './ast-augmentation.js';

// Export services
export * from './services/workspace-manager.js';
export * from './services/dependency-resolver.js';
export * from './services/dependency-analyzer.js';
export * from './services/governance-validator.js';
export * from './services/import-resolver.js';
export * from './services/relationship-inference.js';
export * from './services/git-url-resolver.js';
export * from './services/performance-optimizer.js';

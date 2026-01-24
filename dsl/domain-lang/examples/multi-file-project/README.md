# Multi-file Project Example

This example demonstrates a real-world DomainLang project structure with:

- Shared vocabularies in a separate file
- Project manifest (`model.yaml`)
- External package dependencies
- Path aliases for clean imports

## Project Structure

```text
multi-file-project/
├── model.yaml              # Project manifest
├── index.dlang             # Main model (entry point)
├── shared/
│   └── vocabulary.dlang    # Shared classifications and teams
└── domains/
    └── sales.dlang         # Sales domain model
```

## Files

### model.yaml

The manifest declares package identity, path aliases, and dependencies.

### shared/vocabulary.dlang

Common vocabulary used across the project.

### domains/sales.dlang

Domain-specific model that imports shared vocabulary.

### index.dlang

Entry point that ties everything together.

## Running

This example demonstrates structure only. To use it in a real project:

1. Copy the files to your project
2. Run `dlang install` to fetch dependencies
3. Open in VS Code with the DomainLang extension

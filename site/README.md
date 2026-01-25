# DomainLang Documentation Site

This folder contains the VitePress-powered documentation site for DomainLang.

## Development

```bash
# Install dependencies
npm install

# Start dev server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Structure

```
site/
├── .vitepress/
│   ├── config.mts       # VitePress configuration
│   └── theme/           # Custom theme overrides
├── public/              # Static assets (logo, favicon)
├── guide/               # Getting started and core concepts
├── reference/           # Language and quick reference
├── examples/            # Example models
└── index.md             # Home page
```

## Deployment

The site is automatically deployed to GitHub Pages when changes are pushed to the `main` branch via the `.github/workflows/deploy-docs.yml` workflow.

The live site is available at: https://larsbaunwall.github.io/DomainLang/

## Adding Content

1. Create or edit `.md` files in the appropriate directory
2. Update the sidebar in `.vitepress/config.mts` if adding new pages
3. Use `dlang` for code blocks with DomainLang syntax:

   ````markdown
   ```dlang
   Domain Sales {
       description: "Sales domain"
   }
   ```
   ````

## Custom Theme

The site uses a customized default VitePress theme with:

- Brand colors matching DomainLang
- Custom syntax highlighting for `.dlang` code blocks
- DomainLang logo and favicon

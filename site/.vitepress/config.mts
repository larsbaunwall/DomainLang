import { defineConfig } from 'vitepress'
import type { LanguageRegistration } from 'shiki'

// Custom DomainLang syntax highlighting grammar
const domainLangGrammar: LanguageRegistration = {
  name: 'dlang',
  scopeName: 'source.domain-lang',
  aliases: ['domain-lang', 'domainlang'],
  patterns: [
    { include: '#comments' },
    {
      name: 'keyword.control.domain-lang',
      match: '\\b(ACL|AntiCorruptionLayer|BBoM|BigBallOfMud|BoundedContext|CF|Classification|Conformist|ContextMap|CustomerSupplier|Decision|Domain|DomainMap|Import|Metadata|Namespace|OHS|OpenHostService|P|PL|Partnership|Policy|PublishedLanguage|Rule|SK|SeparateWays|SharedKernel|Team|Term|UpstreamDownstream|aka|archetype|as|bc|businessModel|by|classification|cmap|contains|decision|decisions|description|dmap|dom|evolution|examples|for|glossary|import|in|integrations|is|meta|metadata|ns|policy|relationships|rule|rules|synonyms|team|term|terminology|this|type|vision)\\b'
    },
    {
      name: 'string.quoted.double.domain-lang',
      begin: '"',
      end: '"',
      patterns: [{ include: '#string-character-escape' }]
    },
    {
      name: 'string.quoted.single.domain-lang',
      begin: "'",
      end: "'",
      patterns: [{ include: '#string-character-escape' }]
    }
  ],
  repository: {
    comments: {
      patterns: [
        {
          name: 'comment.block.domain-lang',
          begin: '/\\*',
          end: '\\*/'
        },
        {
          name: 'comment.line.domain-lang',
          begin: '//',
          end: '(?=$)'
        }
      ]
    },
    'string-character-escape': {
      name: 'constant.character.escape.domain-lang',
      match: '\\\\.'
    }
  }
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  title: 'DomainLang',
  description: 'A DSL for Domain-Driven Design modeling',
  
  // Base URL - use '/' for custom domain (domainlang.net)
  // Change to '/DomainLang/' if deploying to GitHub Pages project site
  base: '/',
  
  // Clean URLs without .html extension
  cleanUrls: true,
  
  // Last updated timestamps
  lastUpdated: true,
  
  // Head tags for metadata
  head: [
    ['link', { rel: 'icon', href: '/favicon.ico' }],
    ['meta', { name: 'theme-color', content: '#027fff' }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:title', content: 'DomainLang' }],
    ['meta', { property: 'og:description', content: 'A DSL for Domain-Driven Design modeling' }],
    ['meta', { property: 'og:url', content: 'https://domainlang.net/' }],
  ],
  
  // Theme configuration
  themeConfig: {
    // Logo
    logo: '/logo.svg',
    
    // Site title in nav
    siteTitle: 'DomainLang',
    
    // Navigation bar
    nav: [
      { text: 'Home', link: '/' },
      { text: 'Guide', link: '/guide/getting-started' },
      { text: 'Reference', link: '/reference/language' },
      {
        text: 'Resources',
        items: [
          { text: 'Examples', link: '/examples/' },
          { text: 'Roadmap', link: '/roadmap' },
          { text: 'VS Code Extension', link: 'https://marketplace.visualstudio.com/items?itemName=thinkability.domain-lang' },
          {
            text: 'npm Packages',
            items: [
              { text: '@domainlang/cli', link: 'https://www.npmjs.com/package/@domainlang/cli' },
              { text: '@domainlang/language', link: 'https://www.npmjs.com/package/@domainlang/language' },
            ]
          }
        ]
      }
    ],
    
    // Sidebar navigation
    sidebar: {
      '/guide/': [
        {
          text: 'Introduction',
          items: [
            { text: 'What is DomainLang?', link: '/guide/what-is-domainlang' },
            { text: 'Getting Started', link: '/guide/getting-started' },
          ]
        },
        {
          text: 'Core Concepts',
          items: [
            { text: 'Domains', link: '/guide/domains' },
            { text: 'Bounded Contexts', link: '/guide/bounded-contexts' },
            { text: 'Context Maps', link: '/guide/context-maps' },
            { text: 'Teams & Classifications', link: '/guide/teams-classifications' },
          ]
        },
        {
          text: 'Advanced',
          items: [
            { text: 'Namespaces', link: '/guide/namespaces' },
            { text: 'Import System', link: '/guide/imports' },
          ]
        }
      ],
      '/reference/': [
        {
          text: 'Reference',
          items: [
            { text: 'Language Reference', link: '/reference/language' },
            { text: 'Quick Reference', link: '/reference/quick-reference' },
          ]
        }
      ],
      '/examples/': [
        {
          text: 'Examples',
          items: [
            { text: 'Overview', link: '/examples/' },
            { text: 'Banking System', link: '/examples/banking-system' },
            { text: 'Healthcare System', link: '/examples/healthcare-system' },
          ]
        }
      ]
    },
    
    // Social links
    socialLinks: [
      { icon: 'github', link: 'https://github.com/DomainLang/DomainLang' }
    ],
    
    // Footer
    footer: {
      message: 'Released under the Apache 2.0 License.',
      copyright: 'Copyright © 2024-present <a href="https://github.com/larsbaunwall">Lars Baunwall</a>. Built with ❤️ in Denmark.'
    },
    
    // Edit link
    editLink: {
      pattern: 'https://github.com/DomainLang/DomainLang/edit/main/site/:path',
      text: 'Edit this page on GitHub'
    },
    
    // Search
    search: {
      provider: 'local'
    },
    
    // Outline configuration
    outline: {
      level: [2, 3]
    }
  },
  
  // Markdown configuration
  markdown: {
    lineNumbers: true,
    theme: {
      light: 'github-light',
      dark: 'github-dark'
    },
    languages: [domainLangGrammar]
  }
})

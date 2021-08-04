# The DomainLang idea

Inspired by the [ContextMapper DSL](https://github.com/ContextMapper/context-mapper-dsl), I wanted to try crafting a more complete DDD specification language, one that can be used for diagrams-as-code for DDD and at the same time serve as an explorable, *compilable*, model of a domain-driven architecture.

# Goals

I want to provide a great IDE experience with code-completion and everything else you might be used to from coding. Preferably, this is going to work quite easy with VSCode.

On top of this, I plan to provide diagramming-support through GraphViz or similar, and an exploration UI to inspect your model, probably through a browser.

# Status so far

I am currently exploring three paths:
- `/xtext` is the original DSL platform and the one used by ContextMapper. This seems quite entangled in [Eclipse/Java](https://www.eclipse.org/Xtext/), which I don't like, but I'll keep an open mind
- `/dsl/langium` is based on the recently started [langium project](https://github.com/langium/langium) by the great folks @ TypeFox and looks really interesting. It's purely TypeScript-based and seems very modern, however still in it's infancy
- `/typescript` is a different approach, inspired by [Pulumi](https://github.com/pulumi), based on a TypeScript-based type system and plain-old-typescript

I am new to designing DSLs, the Language Server Protocol in VSCode, and GraphViz, so this is probably going to be a fun ride :)

# Get in touch

I would love to hear from you! Please submit an issue here, and I will try to get back to you as soon as possible.

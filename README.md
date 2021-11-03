# The DomainLang idea

Inspired by the [ContextMapper DSL](https://github.com/ContextMapper/context-mapper-dsl), I wanted to try crafting a more complete DDD specification language, one that can be used for diagrams-as-code for DDD and at the same time serve as a semantic and *compilable*, model of a domain-driven architecture.

## The language

Go directly to the language implementation [here](/dsl/dlang).

## Goals

I want to provide a great IDE experience with code-completion and everything else you might be used to from coding. Preferably, this is going to work quite easy with VSCode.

On top of this, I plan to provide diagramming-support through GraphViz or similar, and an exploration UI to inspect your model, probably through a browser.

## Status so far

This project is still in it's infancy. Feedback is much appreciated 🤩

I am currently exploring three paths:
- `/dsl/dlang` is based on the recently started [langium project](https://github.com/langium/langium) by the great folks @ TypeFox and looks really interesting. It's purely TypeScript-based and seems very modern, however still in it's infancy
- ~~`/xtext` is the original DSL platform and the one used by ContextMapper. This seems quite entangled in [Eclipse/Java](https://www.eclipse.org/Xtext/), which I don't like, but I'll keep an open mind~~
- ~~`/typescript` is a different approach, inspired by [Pulumi](https://github.com/pulumi), based on a type system and just plain-old-typescript~~

I am new to designing DSLs, the Language Server Protocol in VSCode, and GraphViz, so this is probably going to be a fun ride :)

### Discarded ideas

- The xtext-based approach is heavily entangled in the Eclipse/java ecosystem. I am aiming at providing a modern and integrated experience with simpler IDEs (e.g. VSCode), why this approach has been discarded
- A pure typescript approach, though attractive at first, is discarded due to complexity in package management and dependency management. This idea might be revisited in the future

## Get in touch

I would love to hear from you! Please submit an issue here, and I will try to get back to you as soon as possible.

Feedback is very welcomed - especially if you have experience from language design or domain-driven design.

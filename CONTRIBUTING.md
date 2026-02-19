# Contributing to UI8Kit

## A Note on Open Source Responsibility

This codebase is open to the world. There is no NDA to hide behind, no "it works, don't touch it" legacy excuses, no spaghetti code protected by corporate secrecy.

Open source is built for professionals—engineers who value their time and expect quality in return.

When you clone this repository, you should never ask yourself: *"Why did I waste my time on this?"*

That is the standard we hold ourselves to.

---

## Current State

We are not yet ready to accept contributions.

This document exists as a declaration of intent, not a set of guidelines. The framework is under active development, and our patterns are still evolving through real-world usage.

### What We're Building Toward

Before we can responsibly accept contributions, we need to:

- [ ] Battle-test the framework across 50+ brand implementations
- [ ] Stabilize the plugin architecture (6 engines × 3 modes = 18 production lines)
- [ ] Establish comprehensive snapshot tests for all output formats
- [ ] Document the DSL patterns that actually work at scale
- [ ] Identify and eliminate remaining sources of truth duplication

### Why We Wait

Contributing guidelines written in a vacuum are worthless. Real guidelines emerge from:

- Patterns that survived production
- Mistakes that taught us better approaches
- Refactors that consolidated three sources of truth into one
- Edge cases that broke our assumptions

We refuse to write theoretical guidelines. When this document is complete, every rule will be earned through practical experience.

---

## In the Meantime

**Watch**: Star the repository to follow our progress.

**Explore**: Read the code. The architecture speaks for itself.

**Feedback**: Open issues for bugs or questions. We read everything.

**Patience**: When we're ready for contributions, this document will reflect that—with battle-tested guidelines, not aspirational placeholders.

### Internal Maintainer Checklist (Navigation)

Until public contribution flow is enabled, use this checklist for internal changes:

- Keep internal routes declared in `fixtures/shared/page.json`.
- Build navigation lists from data context (`navItems`, `sidebarLinks`, domain sidebars).
- Use `DomainNavButton` for internal links in UI blocks/partials.
- For custom widgets, use `context.resolveNavigation(href)` and keep soft UX:
  - unavailable route -> `disabled` + tooltip `Not available in this domain build`.
- After changes, run domain sync and validate data contract:
  - `bun run validate:data-bundle -- --target <app>`

---

## Our Commitment

When contribution guidelines appear here, they will be:

- **Specific**: No generic "follow best practices" statements
- **Tested**: Every pattern will have proven its value
- **Honest**: We'll document what doesn't work, not just what does
- **Respectful**: Of your time, expertise, and trust

Until then, thank you for your interest. The best contribution right now is patience while we earn the right to ask for your code.

---

*This notice will be replaced with full contribution guidelines when the framework reaches production maturity.*

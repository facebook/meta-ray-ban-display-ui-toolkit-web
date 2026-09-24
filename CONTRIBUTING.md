# Contributing

Thanks for your interest in UI Toolkit for Meta Ray-Ban Display. This project is
actively maintained, and we welcome bug reports and bug fixes.

## Our development process

UI Toolkit for Meta Ray-Ban Display is developed in Meta's internal repository
and exported to GitHub. We review and land accepted contributions internally, and
they appear here on the next sync. Your pull request will close as merged at that
point, so you will not see it merged directly on GitHub.

## What we accept

We accept:

- Bug fixes
- Documentation corrections
- Fixes to the examples
- Accessibility fixes

We do not accept new components, new public APIs, or changes to the API or
visual design of existing components. This is a design system: its component set
is intentionally scoped to what the Meta design team creates and supports, so
that what you build stays consistent with what ships on device. Additions and
API changes come from that design process rather than from pull requests.

## Requesting a component or a change

Open an issue describing what you are building and what you need. Include the
compositions you tried with the existing components and where they fell short —
that context is what we take to the design team.

We review requests against the design roadmap. Most requests do not result in a
new component, because the system is deliberately small. When we decline a
request we will explain why, and we will point to a supported composition or to
the application-layer approach we recommend instead.

## Issues

We use GitHub issues to track public bugs. Please ensure your description is
clear and has sufficient instructions to be able to reproduce the issue. Include
the toolkit version and the device or emulator you are running. A minimal
reproduction that uses only public components is the fastest path to a fix.

Meta has a [bounty program](https://www.facebook.com/whitehat/) for the safe
disclosure of security bugs. In those cases, please go through the process
outlined on that page and do not file a public issue. See
[SECURITY.md](SECURITY.md) for details.

## Pull Requests

We welcome pull requests that fix bugs, correct documentation, or repair
examples. For anything that adds or changes a component or a public API, please
open an issue first — see [What we accept](#what-we-accept).

1. Fork the repo and create your branch from `main`.
2. If you've added code that should be tested, add tests.
3. If you've changed APIs, update the documentation.
4. Ensure the test suite passes.
5. Make sure your code lints.
6. If you haven't already, complete the Contributor License Agreement ("CLA").

## Contributor License Agreement ("CLA")

In order to accept your pull request, we need you to submit a CLA. You only need
to do this once to work on any of Meta's open source projects.

Complete your CLA here: <https://code.facebook.com/cla>

## Code of Conduct

Please read our [Code of Conduct](CODE_OF_CONDUCT.md), which applies to all
interactions in this project.

## License

By contributing to this project, you agree that your contributions will be licensed
under the LICENSE file in the root directory of this source tree.

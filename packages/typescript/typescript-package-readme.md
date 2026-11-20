# TypeScript

[![CI](https://github.com/microsoft/TypeScript/actions/workflows/ci.yml/badge.svg)](https://github.com/microsoft/TypeScript/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/typescript.svg)](https://www.npmjs.com/package/typescript)
[![Downloads](https://img.shields.io/npm/dm/typescript.svg)](https://www.npmjs.com/package/typescript)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/microsoft/TypeScript/badge)](https://securityscorecards.dev/viewer/?uri=github.com/microsoft/TypeScript)

[TypeScript](https://www.typescriptlang.org/) is a language for application-scale JavaScript. TypeScript adds optional types to JavaScript that support tools for large-scale JavaScript applications for any browser, for any host, on any OS. TypeScript compiles to readable, standards-based JavaScript. Try it out at the [playground](https://www.typescriptlang.org/play/), and stay up to date via [our blog](https://devblogs.microsoft.com/typescript/) and [Bluesky](https://bsky.app/profile/typescriptlang.org).

Find others who are using TypeScript at [our community page](https://www.typescriptlang.org/community/).

## Installing

For the latest stable version:

```bash
npm install -D typescript
```

For our nightly builds:

```bash
npm install -D typescript@next
```

## Custom lint rules

ESLint-compatible JavaScript plugins can be declared directly in `tsconfig.json`:

```json
{
    "lint": {
        "plugins": { "local": "./lint-plugin.mjs" },
        "rules": { "local/example": "error" },
        "ignores": ["generated/**"],
        "overrides": [
            { "files": ["tests/**/*.ts"], "rules": { "local/example": "off" } }
        ]
    }
}
```

Run `tsc --lintOnly --runExternalCode`; add `--fix` to apply automatic fixes.
The lint worker requires Node.js 20.19+, 22.13+, or 24+. The lint authoring type
dependencies are optional so they do not raise the runtime requirement of the
other JavaScript API entry points.
Plugin code is trusted external code, not sandboxed. The authorization flag
cannot be enabled by the configuration file. Lint configuration is
inherited through `extends`, including plugins declared by configurations in
dependency packages. Authorizing external code authorizes those inherited
plugins too; review the complete configuration chain before enabling it.
Lint configuration remains
JSON data; executable ESLint/Oxlint configuration must be evaluated and migrated
into the `lint` section rather than loaded during linting.
Inline rule configuration comments are disabled; use JSON rules and overrides.
ESLint disable directives remain supported for suppressing reports.

The native compiler schedules reusable worker threads in one Node process.
Workers use the existing TypeScript API connection for source files and checker
queries against the program being linted. The ESTree adapter supplies node maps
and parser services; native-AST rule execution is not yet a public rule format.
Typed plugins must support the installed TypeScript API version; parser services
expose its native program and checker rather than a separate compatibility API.
Plugin authoring types are exported by `typescript/lint-plugin`, with a test
helper at `typescript/lint-plugin/testing`.
The language server shares successful lint results between diagnostics and code
actions for an unchanged program; failed plugin runs are retried on the next
request. Recursive watches are limited to declared plugin package roots,
including their nested dependencies, rather than entire `node_modules` trees.
Overlapping package watches are deduplicated without scanning their contents.
Local plugin entries do not expand their watch to an enclosing project package;
entries in the project root use exact file watches and existing workspace events.
Relevant file notifications invalidate lint results and restart the native-owned
Node host; plugins are not hot-reloaded inside an existing process.
Plugin compatibility is experimental. Full-repository conformance and
performance parity with other lint engines have not yet been established.

## Contribute

There are many ways to [contribute](https://github.com/microsoft/TypeScript/blob/main/CONTRIBUTING.md) to TypeScript.

* [Submit bugs](https://github.com/microsoft/TypeScript/issues) and help us verify fixes as they are checked in.
* Review the [source code changes](https://github.com/microsoft/TypeScript/pulls).
* Engage with other TypeScript users and developers on [Stack Overflow](https://stackoverflow.com/questions/tagged/typescript).
* Help each other in the [TypeScript Community Discord](https://discord.gg/typescript).
* Join the [#typescript](https://bsky.app/search?q=%23typescript) discussion on Bluesky.
* [Contribute bug fixes](https://github.com/microsoft/TypeScript/blob/main/CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see
the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com)
with any additional questions or comments.

## Documentation

* [TypeScript in 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
* [Programming handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
* [Homepage](https://www.typescriptlang.org/)

## Roadmap

For details on our planned features and future direction, please refer to our [roadmap](https://github.com/microsoft/TypeScript/wiki/Roadmap).


# TypeScript

[![CI](https://github.com/microsoft/TypeScript/actions/workflows/ci.yml/badge.svg)](https://github.com/microsoft/TypeScript/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/typescript.svg)](https://www.npmjs.com/package/typescript)
[![Downloads](https://img.shields.io/npm/dm/typescript.svg)](https://www.npmjs.com/package/typescript)
[![OpenSSF Scorecard](https://api.securityscorecards.dev/projects/github.com/microsoft/TypeScript/badge)](https://securityscorecards.dev/viewer/?uri=github.com/microsoft/TypeScript)


[TypeScript](https://www.typescriptlang.org/) is a language for application-scale JavaScript. TypeScript adds optional types to JavaScript that support tools for large-scale JavaScript applications for any browser, for any host, on any OS. TypeScript compiles to readable, standards-based JavaScript. Try it out at the [playground](https://www.typescriptlang.org/play/), and stay up to date via [our blog](https://devblogs.microsoft.com/typescript/) and [Twitter account](https://twitter.com/typescript).

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

## Formatting

Run `tsc --format` to format project input files in place before checking and emitting them.
Use `tsc --formatOnly` to format without type checking or emitting JavaScript or declarations.
Both flags also work with `tsc -b`.

To check formatting without changing source files, add `--formatDiagnostics` to either mode:

```sh
tsc --formatOnly --formatDiagnostics
```

With `--format`, formatting diagnostics are included in the reported errors but do not
block checking or JavaScript/declaration emit, even with `--noEmitOnError`. Ordinary
compiler errors still follow the usual emit rules.

Set project formatting preferences in the top-level `formattingOptions` member of your config:

```json
{
    "formattingOptions": {
        "indentSize": 4,
        "tabSize": 4,
        "convertTabsToSpaces": true,
        "insertSpaceAfterCommaDelimiter": true
    }
}
```

These settings inherit per property through `extends` and take priority over editor formatting
preferences. Incremental projects keep formatting state separately from compilation state in
their `.tsbuildinfo`, so formatting-only runs do not mark compilation outputs as current.
Changing formatting preferences causes all project input files to be formatted again.

Parsing and formatting run in parallel unless `--singleThreaded` is set. Composite projects
use their complete config-generated root file set directly. Non-composite projects discover
additional input files through imports and references; default libraries and dependencies in
`node_modules` (including linked packages) are not formatted.

With `--formatOnly`, append inclusive, one-based line ranges to individual input file names.
Files without ranges are formatted in full:

```sh
tsc --formatOnly ./src/compiler/checker.ts:120-500,1001-2100 ./src/compiler/core.ts
```

Explicit formatting-only input files also use formatting preferences from a discovered config,
or from a config selected with `--project`.

The JavaScript API exposes the same formatting checks through
`program.getFormattingDiagnostics(file?, spans?)`. It reads `formattingOptions` without
writing source files or incremental state. Pass a source file, a file name/URI, or a list of
files; omit the first argument to check all project formatting inputs. Optional spans use
half-open `{ pos, end }` UTF-16 offsets, and an empty span list checks nothing.

## Contribute

There are many ways to [contribute](CONTRIBUTING.md) to TypeScript.
* [Submit bugs](https://github.com/microsoft/TypeScript/issues) and help us verify fixes as they are checked in.
* Review the [source code changes](https://github.com/microsoft/TypeScript/pulls).
* Engage with other TypeScript users and developers on [StackOverflow](https://stackoverflow.com/questions/tagged/typescript).
* Help each other in the [TypeScript Community Discord](https://discord.gg/typescript).
* Join the [#typescript](https://twitter.com/search?q=%23TypeScript) discussion on Twitter.
* [Contribute bug fixes](CONTRIBUTING.md).

This project has adopted the [Microsoft Open Source Code of Conduct](https://opensource.microsoft.com/codeofconduct/). For more information see
the [Code of Conduct FAQ](https://opensource.microsoft.com/codeofconduct/faq/) or contact [opencode@microsoft.com](mailto:opencode@microsoft.com)
with any additional questions or comments.

## Documentation

*  [TypeScript in 5 minutes](https://www.typescriptlang.org/docs/handbook/typescript-in-5-minutes.html)
*  [Programming handbook](https://www.typescriptlang.org/docs/handbook/intro.html)
*  [Homepage](https://www.typescriptlang.org/)

## Roadmap

For details on our planned features and future direction, please refer to our [roadmap](https://github.com/microsoft/TypeScript/wiki/Roadmap).

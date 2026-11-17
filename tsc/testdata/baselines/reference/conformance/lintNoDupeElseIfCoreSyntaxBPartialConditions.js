//// [tests/cases/conformance/lint/rules/no-dupe-else-if/lintNoDupeElseIfCoreSyntaxBPartialConditions.ts] ////

//// [input.ts]
if (a && b) {} else if (b && a) {} if (a === 1) {} else if (a === (1)) {}

//// [input.ts]
if (a && b) {} else if (b && a) {} if (a === 1) {} else if (a === (1)) {}

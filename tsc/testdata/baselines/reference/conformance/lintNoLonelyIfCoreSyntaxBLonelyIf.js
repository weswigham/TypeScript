//// [tests/cases/conformance/lint/rules/no-lonely-if/lintNoLonelyIfCoreSyntaxBLonelyIf.ts] ////

//// [input.ts]
if (first) {} else { if (second) {} } if (first) if (second) {} else { if (third) {} } else {}

//// [input.ts]
if (first) {} else if (second) { } if (first) if (second) {} else { if (third) {} } else {}

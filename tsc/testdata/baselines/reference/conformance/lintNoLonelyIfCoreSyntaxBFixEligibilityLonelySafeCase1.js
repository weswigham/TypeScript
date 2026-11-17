//// [tests/cases/conformance/lint/rules/no-lonely-if/lintNoLonelyIfCoreSyntaxBFixEligibilityLonelySafeCase1.ts] ////

//// [input.ts]
if (first) {} else { if (second) {} }

//// [input.ts]
if (first) {} else if (second) { }

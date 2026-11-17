//// [tests/cases/conformance/lint/rules/no-extra-label/lintNoExtraLabelCoreSyntaxBFixEligibilityLabelSafeCase1.ts] ////

//// [input.ts]
outer: while (true) { break outer; }

//// [input.ts]
outer: while (true) { break; }

//// [tests/cases/conformance/lint/rules/no-extra-label/lintNoExtraLabelCoreSyntaxBFixEligibilityLabelComments.ts] ////

//// [input.ts]
outer: while (true) { break /*keep*/ outer; }

//// [input.ts]
outer: while (true) { break /*keep*/ outer; }

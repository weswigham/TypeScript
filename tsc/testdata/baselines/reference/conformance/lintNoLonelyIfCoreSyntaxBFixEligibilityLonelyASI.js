//// [tests/cases/conformance/lint/rules/no-lonely-if/lintNoLonelyIfCoreSyntaxBFixEligibilityLonelyASI.ts] ////

//// [input.ts]
if (first) {} else { if (second) call() }
[1].forEach(work);

//// [input.ts]
if (first) {} else { if (second) call() }
[1].forEach(work);

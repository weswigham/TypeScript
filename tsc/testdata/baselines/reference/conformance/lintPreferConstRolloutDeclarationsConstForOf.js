//// [tests/cases/conformance/lint/rules/prefer-const/lintPreferConstRolloutDeclarationsConstForOf.ts] ////

//// [input.ts]
for (let x of values) consume(x);

//// [input.ts]
for (const x of values) consume(x);

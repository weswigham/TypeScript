//// [tests/cases/conformance/lint/rules/yoda/lintYodaRolloutExpressionsWork0ValueIndexOfItem.ts] ////

//// [input.ts]
work()
0 === [value].indexOf(item);

//// [input.ts]
work();
[value].indexOf(item) === 0;

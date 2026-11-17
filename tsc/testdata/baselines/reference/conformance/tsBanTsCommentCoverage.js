//// [tests/cases/conformance/lint/rules/ban-ts-comment/tsBanTsCommentCoverage.ts] ////

//// [input.ts]
// @ts-ignore
const ignored: string = 1;
// @ts-expect-error
const unexplained: string = 2;
// @ts-expect-error: numeric input intentionally tests the string boundary
const explained: string = 3;
// @ts-check
const checked = 4;
const directiveLiteral = "// @ts-ignore";
export {};

//// [input.ts]
// @ts-ignore
const ignored: string = 1;
// @ts-expect-error
const unexplained: string = 2;
// @ts-expect-error: numeric input intentionally tests the string boundary
const explained: string = 3;
// @ts-check
const checked = 4;
const directiveLiteral = "// @ts-ignore";
export {};

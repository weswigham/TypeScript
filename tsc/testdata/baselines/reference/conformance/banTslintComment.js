//// [tests/cases/conformance/lint/rules/ban-tslint-comment/banTslintComment.ts] ////

//// [input.ts]
// tslint:disable-next-line:old-rule
const first = 1; // tslint:disable-line
/* tslint:enable */
const text = "// tslint:disable";
const template = `/* tslint:disable */ ${first}`;
const expression = /\/\/ tslint:disable/;
// mentions tslint:disable but is not a directive
// tslint:disable-next-line-extra
/* tslint:disable:old-rule */
const last = 2;
// tslint:enable

//// [input.ts]
const first = 1;const text = "// tslint:disable";
const template = `/* tslint:disable */ ${first}`;
const expression = /\/\/ tslint:disable/;
// mentions tslint:disable but is not a directive
// tslint:disable-next-line-extra
const last = 2;

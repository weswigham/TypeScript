//// [tests/cases/conformance/lint/rules/ban-tslint-comment/lintTypescriptBanTslintCommentTypeScriptSyntaxBanRegexBoundaries.ts] ////

//// [input.ts]
const pattern = /* tslint:disable */ /[/*]tslint:disable/; // tslint:enable
const escaped = /\/\/ tslint:disable/; /* tslint:disable-line */
const ratio = 4 / /* tslint:enable-line */ 2;

//// [input.ts]
const pattern =/[/*]tslint:disable/;const escaped = /\/\/ tslint:disable/;const ratio = 4 /2;

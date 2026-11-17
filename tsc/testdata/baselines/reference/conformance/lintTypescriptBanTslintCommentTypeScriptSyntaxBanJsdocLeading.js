//// [tests/cases/conformance/lint/rules/ban-tslint-comment/lintTypescriptBanTslintCommentTypeScriptSyntaxBanJsdocLeading.ts] ////

//// [input.ts]
/** Documentation. */
// tslint:disable-next-line
const value = 1;

//// [input.ts]
/** Documentation. */
const value = 1;

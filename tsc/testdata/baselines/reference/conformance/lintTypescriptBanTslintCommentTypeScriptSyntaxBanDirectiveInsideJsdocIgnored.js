//// [tests/cases/conformance/lint/rules/ban-tslint-comment/lintTypescriptBanTslintCommentTypeScriptSyntaxBanDirectiveInsideJsdocIgnored.ts] ////

//// [input.ts]
/**
 * // tslint:disable
 */
const value = 1;
/** tslint:enable */

//// [input.ts]
/**
 * // tslint:disable
 */
const value = 1;
/** tslint:enable */

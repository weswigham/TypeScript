//// [tests/cases/conformance/lint/rules/ban-ts-comment/lintTypescriptBanTsCommentTypeScriptSyntaxBannedDirectives.ts] ////

//// [input.ts]
// @ts-ignore
const value = 1;
// @ts-expect-error
work();

//// [input.ts]
// @ts-ignore
const value = 1;
// @ts-expect-error
work();

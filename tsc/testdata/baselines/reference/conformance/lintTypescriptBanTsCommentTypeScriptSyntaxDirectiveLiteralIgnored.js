//// [tests/cases/conformance/lint/rules/ban-ts-comment/lintTypescriptBanTsCommentTypeScriptSyntaxDirectiveLiteralIgnored.ts] ////

//// [input.ts]
const text = '// @ts-ignore'; // @ts-expect-error: valid explanation
work();

//// [input.ts]
const text = '// @ts-ignore'; // @ts-expect-error: valid explanation
work();

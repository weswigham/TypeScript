//// [tests/cases/conformance/lint/rules/ban-tslint-comment/lintTypescriptBanTslintCommentTypeScriptSyntaxBanBetweenTokens.ts] ////

//// [input.ts]
const /* tslint:disable */ value /* tslint:enable */ = 1;

//// [input.ts]
constvalue= 1;

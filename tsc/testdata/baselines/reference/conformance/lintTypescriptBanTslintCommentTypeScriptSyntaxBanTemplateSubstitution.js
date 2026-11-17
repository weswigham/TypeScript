//// [tests/cases/conformance/lint/rules/ban-tslint-comment/lintTypescriptBanTslintCommentTypeScriptSyntaxBanTemplateSubstitution.ts] ////

//// [input.ts]
const value = `text ${ /* tslint:disable */ 1 } more`;

//// [input.ts]
const value = `text ${1 } more`;

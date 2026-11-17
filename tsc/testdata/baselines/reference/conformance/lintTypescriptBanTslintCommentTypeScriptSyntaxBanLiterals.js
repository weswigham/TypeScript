//// [tests/cases/conformance/lint/rules/ban-tslint-comment/lintTypescriptBanTslintCommentTypeScriptSyntaxBanLiterals.ts] ////

//// [input.ts]
const text = '// tslint:disable'; const template = `/* tslint:enable */`; const pattern = /tslint:disable/; // mentions tslint:disable
// tslint:disable-line-extra

//// [input.ts]
const text = '// tslint:disable'; const template = `/* tslint:enable */`; const pattern = /tslint:disable/; // mentions tslint:disable
// tslint:disable-line-extra

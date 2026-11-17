//// [tests/cases/conformance/lint/rules/ban-tslint-comment/lintTypescriptBanTslintCommentTypeScriptSyntaxBanTemplateBoundaries.ts] ////

//// [input.ts]
const value = /* tslint:disable */ `raw
// tslint:enable
${ /* tslint:disable-line */ `nested ${1 /* tslint:enable-line */ }
/* tslint:disable */` }
// tslint:disable
`; // tslint:enable-next-line

//// [input.ts]
const value =`raw
// tslint:enable
${`nested ${1}
/* tslint:disable */` }
// tslint:disable
`;

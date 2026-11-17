//// [tests/cases/conformance/lint/rules/dot-notation/lintTypescriptDotNotationFinalOwnershipRulesKeywords.ts] ////

//// [input.ts]
declare const object: any; object.default; object['default']; object[true];

//// [input.ts]
declare const object: any; object["default"]; object['default']; object[true];

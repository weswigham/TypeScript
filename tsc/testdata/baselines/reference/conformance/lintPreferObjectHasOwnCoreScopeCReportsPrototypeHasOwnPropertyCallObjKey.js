//// [tests/cases/conformance/lint/rules/prefer-object-has-own/lintPreferObjectHasOwnCoreScopeCReportsPrototypeHasOwnPropertyCallObjKey.ts] ////

//// [input.ts]
({}).prototype.hasOwnProperty.call(obj, key);

//// [input.ts]
({}).prototype.hasOwnProperty.call(obj, key);

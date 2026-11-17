//// [tests/cases/conformance/lint/rules/prefer-object-has-own/lintPreferObjectHasOwnCoreScopeCReportsObjectPrototypeHasOwnPropertyCallObjKey.ts] ////

//// [input.ts]
Object?.prototype.hasOwnProperty.call(obj, key);

//// [input.ts]
Object.hasOwn(obj, key);

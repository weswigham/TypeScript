//// [tests/cases/conformance/lint/rules/prefer-object-has-own/lintPreferObjectHasOwnCoreScopeCReportsObjectPrototypeHasOwnPropertyCallObjKeyObjectPrototypeHasOwnPropertyCall.ts] ////

//// [input.ts]
(Object?.prototype.hasOwnProperty).call(obj, key); (Object.prototype.hasOwnProperty?.call)(obj, key);

//// [input.ts]
(Object?.prototype.hasOwnProperty).call(obj, key); (Object.prototype.hasOwnProperty?.call)(obj, key);

//// [tests/cases/conformance/lint/rules/prefer-object-has-own/lintPreferObjectHasOwnCoreScopeCReportsObjectPrototypeHasOwnPropertyCallObjKeyHasOwnPropertyCallObjKeyObjectHas.ts] ////

//// [input.ts]
Object.prototype.hasOwnProperty.call(obj, key); ({}).hasOwnProperty.call(obj, key); Object.hasOwnProperty.call(obj, key);

//// [input.ts]
Object.hasOwn(obj, key); Object.hasOwn(obj, key); Object.hasOwn(obj, key);

//// [tests/cases/conformance/lint/rules/prefer-object-has-own/lintPreferObjectHasOwnCoreScopeCFixesObjectKeepPrototypeHasOwnPropertyCallObjKey.ts] ////

//// [input.ts]
Object./* keep */prototype.hasOwnProperty.call(obj, key);

//// [input.ts]
Object./* keep */prototype.hasOwnProperty.call(obj, key);

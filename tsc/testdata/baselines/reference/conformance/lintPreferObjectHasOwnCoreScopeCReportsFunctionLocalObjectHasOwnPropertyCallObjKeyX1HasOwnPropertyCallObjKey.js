//// [tests/cases/conformance/lint/rules/prefer-object-has-own/lintPreferObjectHasOwnCoreScopeCReportsFunctionLocalObjectHasOwnPropertyCallObjKeyX1HasOwnPropertyCallObjKey.ts] ////

//// [input.ts]
function local(Object) { ({}).hasOwnProperty.call(obj, key); } ({ x: 1 }).hasOwnProperty.call(obj, key);

//// [input.ts]
function local(Object) { ({}).hasOwnProperty.call(obj, key); } ({ x: 1 }).hasOwnProperty.call(obj, key);

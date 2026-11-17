//// [tests/cases/conformance/lint/rules/no-unsafe-optional-chaining/lintNoUnsafeOptionalChainingCoreDObjMethodObjKeyPropNewObjCtor.ts] ////

//// [input.ts]
(obj?.method)(); (obj?.key).prop; new (obj?.ctor)();

//// [input.ts]
(obj?.method)(); (obj?.key).prop; new (obj?.ctor)();

//// [tests/cases/conformance/lint/rules/no-unsafe-optional-chaining/lintNoUnsafeOptionalChainingCoreDObjMethodObjMethodObjKeyFallbackPropObjKey.ts] ////

//// [input.ts]
obj?.method(); obj?.method?.(); (obj?.key ?? fallback).prop; ({ ...obj?.key });

//// [input.ts]
obj?.method(); obj?.method?.(); (obj?.key ?? fallback).prop; ({ ...obj?.key });

//// [tests/cases/conformance/lint/rules/no-use-before-define/lintTypescriptNoUseBeforeDefineTypeScriptScopeDefaultsFFunctionFLetAATypeTLaterTypeLaterNumber.ts] ////

//// [input.ts]
f(); function f() {} let a = a; type T = Later; type Later = number;

//// [input.ts]
f(); function f() {} let a = a; type T = Later; type Later = number;

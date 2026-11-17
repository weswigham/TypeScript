//// [tests/cases/conformance/lint/rules/no-shadow/lintTypescriptNoShadowTypeScriptScopeDefaultsConstA1FunctionFATypeTNumberFunctionGConstT1.ts] ////

//// [input.ts]
const a = 1; function f(a) {} type T = number; function g() { const T = 1; }

//// [input.ts]
const a = 1; function f(a) {} type T = number; function g() { const T = 1; }

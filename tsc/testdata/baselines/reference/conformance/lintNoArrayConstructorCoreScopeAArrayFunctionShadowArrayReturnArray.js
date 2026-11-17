//// [tests/cases/conformance/lint/rules/no-array-constructor/lintNoArrayConstructorCoreScopeAArrayFunctionShadowArrayReturnArray.ts] ////

//// [input.ts]
function shadow(Array) { return Array(); }

//// [input.ts]
function shadow(Array) { return Array(); }

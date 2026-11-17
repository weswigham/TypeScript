//// [tests/cases/conformance/lint/rules/no-shadow-restricted-names/noShadowRestrictedNamesScopeBOptions.ts] ////

//// [input.ts]
function allowed(globalThis) {}
function disallowed(Infinity) {}

//// [input.ts]
function allowed(globalThis) {}
function disallowed(Infinity) {}

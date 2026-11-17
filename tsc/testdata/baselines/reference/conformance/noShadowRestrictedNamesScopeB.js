//// [tests/cases/conformance/lint/rules/no-shadow-restricted-names/noShadowRestrictedNamesScopeB.ts] ////

//// [input.ts]
function run(undefined, NaN, { eval: arguments }) {}
function safe() { var undefined; use(undefined); }
function assigned() { var undefined; undefined = 1; }
try { work(); } catch (undefined) {}
function shadow(globalThis) {}

//// [input.ts]
function run(undefined, NaN, { eval: arguments }) {}
function safe() { var undefined; use(undefined); }
function assigned() { var undefined; undefined = 1; }
try { work(); } catch (undefined) {}
function shadow(globalThis) {}

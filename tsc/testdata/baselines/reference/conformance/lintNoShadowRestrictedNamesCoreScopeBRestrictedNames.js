//// [tests/cases/conformance/lint/rules/no-shadow-restricted-names/lintNoShadowRestrictedNamesCoreScopeBRestrictedNames.ts] ////

//// [input.ts]
function run(undefined, NaN, {eval: arguments}) {} function other() { var undefined; }

//// [input.ts]
function run(undefined, NaN, {eval: arguments}) {} function other() { var undefined; }

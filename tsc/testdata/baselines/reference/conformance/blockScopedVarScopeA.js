//// [tests/cases/conformance/lint/rules/block-scoped-var/blockScopedVarScopeA.ts] ////

//// [input.ts]
function outside() { { var value; } use(value); }
function branches(condition: boolean) {
    if (condition) { var value = 1; } else { var value = 2; }
}
for (var index = 0; index < 3; index++) {}
use(index);
class Example { static { if (condition) { var local; } use(local); } }

//// [input.ts]
function outside() { { var value; } use(value); }
function branches(condition: boolean) {
    if (condition) { var value = 1; } else { var value = 2; }
}
for (var index = 0; index < 3; index++) {}
use(index);
class Example { static { if (condition) { var local; } use(local); } }

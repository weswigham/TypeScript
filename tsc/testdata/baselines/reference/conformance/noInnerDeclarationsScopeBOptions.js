//// [tests/cases/conformance/lint/rules/no-inner-declarations/noInnerDeclarationsScopeBOptions.ts] ////

//// [input.ts]
export {};
if (ready) { function nested() {} var hoisted; let allowed; }
class Item {
    static { if (ready) { var nested; } }
    method() { for (var index = 0; index < 3; index++) {} }
}

//// [input.ts]
export {};
if (ready) { function nested() {} var hoisted; let allowed; }
class Item {
    static { if (ready) { var nested; } }
    method() { for (var index = 0; index < 3; index++) {} }
}

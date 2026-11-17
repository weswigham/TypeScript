//// [tests/cases/conformance/lint/rules/no-lone-blocks/noLoneBlocksScopeB.ts] ////

//// [input.ts]
{}
{ var hoisted; }
{ let scoped; }
{ using resource = acquire(); }
function run() { { const only = 1; } }
switch (value) {
    case 1: { work(); }
    case 2: {} work();
}
class Item {
    static { { let only; } }
    method() { work(); { class Local {} } }
}

//// [input.ts]
{}
{ var hoisted; }
{ let scoped; }
{ using resource = acquire(); }
function run() { { const only = 1; } }
switch (value) {
    case 1: { work(); }
    case 2: {} work();
}
class Item {
    static { { let only; } }
    method() { work(); { class Local {} } }
}

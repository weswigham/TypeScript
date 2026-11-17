//// [tests/cases/conformance/lint/rules/no-inner-declarations/noInnerDeclarationsScopeB.ts] ////

//// [input.ts]
if (ready) { function nested() {} var allowed; }
function root() {
    function nestedRoot() {}
    if (ready) { function inner() {} }
}
function strict() {
    "use strict";
    if (ready) { function allowed() {} }
}

//// [input.ts]
if (ready) { function nested() {} var allowed; }
function root() {
    function nestedRoot() {}
    if (ready) { function inner() {} }
}
function strict() {
    "use strict";
    if (ready) { function allowed() {} }
}

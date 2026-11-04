//// [tests/cases/conformance/lint/rules/no-debugger/noDebuggerBoundaries.ts] ////

//// [input.ts]
function first(): void {}
function second(): void {}
{
    first()
    debugger;
    (second());
}
{
    const values = [1];
    values[0]
    debugger;
    [1][0];
}
function inspect(value = 0) {
    debugger;
    "use strict";
    return value;
}
function consecutive(value = 0) {
    debugger;
    debugger;
    "use strict";
    return value;
}
{
    first()
    debugger;
    debugger;
    (second());
}

//// [input.ts]
function first(): void {}
function second(): void {}
{
    first();
    (second());
}
{
    const values = [1];
    values[0];
    [1][0];
}
function inspect(value = 0) {
    ;
    "use strict";
    return value;
}
function consecutive(value = 0) {
    ;
    "use strict";
    return value;
}
{
    first()
    ;
    (second());
}

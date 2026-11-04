//// [tests/cases/conformance/lint/rules/no-debugger/noDebuggerStatements.ts] ////

//// [input.ts]
debugger;
debugger
{
    debugger;
}

function inspect() {
    debugger;
    return 1;
}

//// [input.ts]
;
;
{
}

function inspect() {
    return 1;
}

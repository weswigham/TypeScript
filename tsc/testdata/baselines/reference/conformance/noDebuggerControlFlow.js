//// [tests/cases/conformance/lint/rules/no-debugger/noDebuggerControlFlow.ts] ////

//// [input.ts]
if (true) debugger
if (true) debugger; else void 0;
while (false) debugger;
do debugger; while (false);
for (; false;) debugger;
label: debugger;
switch (1) {
    case 1:
        debugger;
        break;
    default:
        debugger;
}
if (true) {
    debugger;
}

//// [input.ts]
if (true) ;
if (true) ; else void 0;
while (false) ;
do ; while (false);
for (; false;) ;
label: ;
switch (1) {
    case 1:
        ;
        break;
    default:
        ;
}
if (true) {
}

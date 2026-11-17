//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2243.ts] ////

//// [input.ts]

switch (foo) {
    case 0:
        a();
        break;
        /* falls through */
}
switch (bar) {
    case 1:
        b();
}
            

//// [input.ts]

switch (foo) {
    case 0:
        a();
        break;
        /* falls through */
}
switch (bar) {
    case 1:
        b();
}
            

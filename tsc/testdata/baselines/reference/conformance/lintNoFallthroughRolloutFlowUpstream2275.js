//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2275.ts] ////

//// [input.ts]

switch(foo){
    case 1:
        doSomething();
        break;
    // falls through
    case 2: doSomething();
}

//// [input.ts]

switch(foo){
    case 1:
        doSomething();
        break;
    // falls through
    case 2: doSomething();
}

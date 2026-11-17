//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2244.ts] ////

//// [input.ts]

switch(foo){
    case 1:
        doSomething();
        break;
    // just a comment
    case 2: doSomething();
}
          

//// [input.ts]

switch(foo){
    case 1:
        doSomething();
        break;
    // just a comment
    case 2: doSomething();
}
          

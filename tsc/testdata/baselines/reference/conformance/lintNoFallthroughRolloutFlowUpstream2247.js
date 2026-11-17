//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2247.ts] ////

//// [input.ts]

switch(foo){
    case 1:
        doSomething();
        // falls through
    case 2: doSomething();
}
          

//// [input.ts]

switch(foo){
    case 1:
        doSomething();
        // falls through
    case 2: doSomething();
}
          

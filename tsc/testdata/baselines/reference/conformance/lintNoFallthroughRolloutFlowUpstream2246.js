//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2246.ts] ////

//// [input.ts]

switch(foo){
    case 1:
        doSomething();
        break;
}

function f() {
    switch(foo){
        /* falls through comment should not false positive */
        case 1:
            if (a) {
                throw new Error();
            } else if (b) {
                break;
            } else {
                return;
            }
        case 2:
            break;
    }
}
            

//// [input.ts]

switch(foo){
    case 1:
        doSomething();
        break;
}

function f() {
    switch(foo){
        /* falls through comment should not false positive */
        case 1:
            if (a) {
                throw new Error();
            } else if (b) {
                break;
            } else {
                return;
            }
        case 2:
            break;
    }
}
            

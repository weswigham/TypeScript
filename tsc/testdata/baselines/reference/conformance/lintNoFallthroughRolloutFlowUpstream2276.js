//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2276.ts] ////

//// [input.ts]

function f() {
    switch(foo){
        case 1:
            if (a) {
                throw new Error();
            } else if (b) {
                break;
            } else {
                return;
            }
        // falls through
        case 2:
            break;
    }
}

//// [input.ts]

function f() {
    switch(foo){
        case 1:
            if (a) {
                throw new Error();
            } else if (b) {
                break;
            } else {
                return;
            }
        // falls through
        case 2:
            break;
    }
}

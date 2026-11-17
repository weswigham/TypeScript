//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2277.ts] ////

//// [input.ts]

switch (foo) {
    case 0: {
        a();
        break;
        // falls through
    }
    case 1:
        b();
}

//// [input.ts]

switch (foo) {
    case 0: {
        a();
        break;
        // falls through
    }
    case 1:
        b();
}

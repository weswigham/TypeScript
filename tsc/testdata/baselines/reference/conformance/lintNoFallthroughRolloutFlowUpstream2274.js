//// [tests/cases/conformance/lint/rules/no-fallthrough/lintNoFallthroughRolloutFlowUpstream2274.ts] ////

//// [input.ts]

switch (foo) {
    default:
        a();
        break;
    /* falls through */
    case 1:
        b();
}

//// [input.ts]

switch (foo) {
    default:
        a();
        break;
    /* falls through */
    case 1:
        b();
}

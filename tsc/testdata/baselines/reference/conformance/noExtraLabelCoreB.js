//// [tests/cases/conformance/lint/rules/no-extra-label/noExtraLabelCoreB.ts] ////

//// [input.ts]
outer: while (ready) {
    if (skip) continue outer;
    switch (value) { default: continue outer; }
    break outer;
}
commented: while (ready) { break /* keep */ commented; }
required: { break required; }

//// [input.ts]
outer: while (ready) {
    if (skip) continue;
    switch (value) { default: continue outer; }
    break;
}
commented: while (ready) { break /* keep */ commented; }
required: { break required; }

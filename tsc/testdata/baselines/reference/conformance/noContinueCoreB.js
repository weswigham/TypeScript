//// [tests/cases/conformance/lint/rules/no-continue/noContinueCoreB.ts] ////

//// [input.ts]
outer: while (ready) {
    if (skip) continue;
    continue outer;
}
while (ready) { break; }

//// [input.ts]
outer: while (ready) {
    if (skip) continue;
    continue outer;
}
while (ready) { break; }

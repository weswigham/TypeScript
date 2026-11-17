//// [tests/cases/conformance/lint/rules/no-labels/noLabelsCoreB.ts] ////

//// [input.ts]
outer: while (ready) { continue outer; break outer; }
block: { break block; }
selection: switch (value) { default: break selection; }
while (ready) { continue; break; }

//// [input.ts]
outer: while (ready) { continue outer; break outer; }
block: { break block; }
selection: switch (value) { default: break selection; }
while (ready) { continue; break; }

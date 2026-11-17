//// [tests/cases/conformance/lint/rules/no-labels/noLabelsCoreBOptions.ts] ////

//// [input.ts]
outer: while (ready) { continue outer; break outer; }
selection: switch (value) { default: break selection; }
block: { break block; }

//// [input.ts]
outer: while (ready) { continue outer; break outer; }
selection: switch (value) { default: break selection; }
block: { break block; }

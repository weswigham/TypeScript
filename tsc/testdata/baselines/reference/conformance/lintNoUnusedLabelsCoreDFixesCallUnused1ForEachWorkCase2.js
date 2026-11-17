//// [tests/cases/conformance/lint/rules/no-unused-labels/lintNoUnusedLabelsCoreDFixesCallUnused1ForEachWorkCase2.ts] ////

//// [input.tsx]
call();
unused: [1].forEach(work);

//// [input.tsx]
call();
[1].forEach(work);

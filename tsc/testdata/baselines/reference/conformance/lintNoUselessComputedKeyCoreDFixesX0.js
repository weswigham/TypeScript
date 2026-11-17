//// [tests/cases/conformance/lint/rules/no-useless-computed-key/lintNoUselessComputedKeyCoreDFixesX0.ts] ////

//// [input.tsx]
({ [('x')]: 0 });

//// [input.tsx]
({ 'x': 0 });

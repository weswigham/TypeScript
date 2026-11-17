//// [tests/cases/conformance/lint/rules/no-useless-rename/lintNoUselessRenameCoreDFixesFooFooObject.ts] ////

//// [input.tsx]
({ foo: (foo) } = object);

//// [input.tsx]
({ foo } = object);

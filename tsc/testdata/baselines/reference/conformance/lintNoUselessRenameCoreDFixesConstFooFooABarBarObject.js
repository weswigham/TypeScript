//// [tests/cases/conformance/lint/rules/no-useless-rename/lintNoUselessRenameCoreDFixesConstFooFooABarBarObject.ts] ////

//// [input.tsx]
const { foo: foo = (a), 'bar': bar } = object;

//// [input.tsx]
const { foo = (a), bar } = object;

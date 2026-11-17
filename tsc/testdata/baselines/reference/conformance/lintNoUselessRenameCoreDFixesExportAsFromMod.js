//// [tests/cases/conformance/lint/rules/no-useless-rename/lintNoUselessRenameCoreDFixesExportAsFromMod.ts] ////

//// [input.tsx]
export { '' as '' } from 'mod';

//// [input.tsx]
export { '' } from 'mod';

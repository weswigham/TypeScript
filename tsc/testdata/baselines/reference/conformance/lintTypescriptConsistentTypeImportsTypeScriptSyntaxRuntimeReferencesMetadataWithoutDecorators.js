//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesMetadataWithoutDecorators.ts] ////

//// [input.tsx]
import A from 'x'; type T = A;

//// [input.tsx]
import type A from 'x'; type T = A;

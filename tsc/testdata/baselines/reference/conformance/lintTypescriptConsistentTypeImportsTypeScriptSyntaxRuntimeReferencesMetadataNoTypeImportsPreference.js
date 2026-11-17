//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesMetadataNoTypeImportsPreference.ts] ////

//// [input.tsx]
import type A from 'x'; type T = A; @decorate class C {}

//// [input.tsx]
import A from 'x'; type T = A; @decorate class C {}

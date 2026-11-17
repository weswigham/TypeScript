//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesMetadataStillForbidsImportAnnotations.ts] ////

//// [input.tsx]
type T = import('x').A; @decorate class C {}

//// [input.tsx]
type T = import('x').A; @decorate class C {}

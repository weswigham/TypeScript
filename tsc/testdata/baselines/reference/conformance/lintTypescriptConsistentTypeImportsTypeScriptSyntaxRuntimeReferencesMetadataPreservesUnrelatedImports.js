//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxRuntimeReferencesMetadataPreservesUnrelatedImports.ts] ////

//// [input.tsx]
import A from 'x'; type T = A; @decorate class C {}

//// [input.tsx]
import A from 'x'; type T = A; @decorate class C {}

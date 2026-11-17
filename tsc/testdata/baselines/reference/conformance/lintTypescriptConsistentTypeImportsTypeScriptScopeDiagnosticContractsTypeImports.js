//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptScopeDiagnosticContractsTypeImports.ts] ////

//// [input.ts]
import { A } from 'x'; let value: A;

//// [input.ts]
import type { A } from 'x'; let value: A;

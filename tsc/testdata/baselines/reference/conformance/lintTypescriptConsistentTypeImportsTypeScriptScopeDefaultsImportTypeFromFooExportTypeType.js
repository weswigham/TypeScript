//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptScopeDefaultsImportTypeFromFooExportTypeType.ts] ////

//// [input.ts]
import { Type } from 'foo'; export type { Type };

//// [input.ts]
import type { Type } from 'foo'; export type { Type };

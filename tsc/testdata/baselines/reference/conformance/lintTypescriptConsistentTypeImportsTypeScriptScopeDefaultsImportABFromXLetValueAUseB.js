//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptScopeDefaultsImportABFromXLetValueAUseB.ts] ////

//// [input.ts]
import { A, B } from 'x'; let value: A; use(B);

//// [input.ts]
import type { A} from 'x';
import { B } from 'x'; let value: A; use(B);

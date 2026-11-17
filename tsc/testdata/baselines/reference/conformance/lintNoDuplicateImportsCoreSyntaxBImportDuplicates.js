//// [tests/cases/conformance/lint/rules/no-duplicate-imports/lintNoDuplicateImportsCoreSyntaxBImportDuplicates.ts] ////

//// [input.ts]
import * as space from 'pkg'; import {first} from 'pkg'; import {second} from 'pkg';

//// [input.ts]
import * as space from 'pkg'; import {first} from 'pkg'; import {second} from 'pkg';

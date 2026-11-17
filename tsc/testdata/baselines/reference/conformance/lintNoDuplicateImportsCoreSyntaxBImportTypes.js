//// [tests/cases/conformance/lint/rules/no-duplicate-imports/lintNoDuplicateImportsCoreSyntaxBImportTypes.ts] ////

//// [input.ts]
import type Item from 'pkg'; import type {Other} from 'pkg'; import {value} from 'pkg';

//// [input.ts]
import type Item from 'pkg'; import type {Other} from 'pkg'; import {value} from 'pkg';

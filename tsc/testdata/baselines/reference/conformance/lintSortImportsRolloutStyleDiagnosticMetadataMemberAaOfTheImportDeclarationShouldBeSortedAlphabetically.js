//// [tests/cases/conformance/lint/rules/sort-imports/lintSortImportsRolloutStyleDiagnosticMetadataMemberAaOfTheImportDeclarationShouldBeSortedAlphabetically.ts] ////

//// [input.ts]
import { b, a as aa } from 'a';

//// [input.ts]
import { a as aa, b } from 'a';

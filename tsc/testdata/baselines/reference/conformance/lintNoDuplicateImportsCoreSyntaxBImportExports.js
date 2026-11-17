//// [tests/cases/conformance/lint/rules/no-duplicate-imports/lintNoDuplicateImportsCoreSyntaxBImportExports.ts] ////

//// [input.ts]
import value from 'pkg'; export {first} from 'pkg'; export {second} from 'pkg';

//// [input.ts]
import value from 'pkg'; export {first} from 'pkg'; export {second} from 'pkg';

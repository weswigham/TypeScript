//// [tests/cases/conformance/lint/rules/no-import-assign/lintNoImportAssignCoreScopeBImportShadowing.ts] ////

//// [input.ts]
import * as space from 'pkg'; function run(space, Object) { space.key++; Object.assign(space, {}); }

//// [input.ts]
import * as space from 'pkg'; function run(space, Object) { space.key++; Object.assign(space, {}); }

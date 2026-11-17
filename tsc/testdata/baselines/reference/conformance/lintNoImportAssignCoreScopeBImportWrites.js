//// [tests/cases/conformance/lint/rules/no-import-assign/lintNoImportAssignCoreScopeBImportWrites.ts] ////

//// [input.ts]
import value, * as space from 'pkg'; value = 1; space.key++; delete space.key; Object.assign(space, {}); space.key.deep = 1; value.key = 1;

//// [input.ts]
import value, * as space from 'pkg'; value = 1; space.key++; delete space.key; Object.assign(space, {}); space.key.deep = 1; value.key = 1;

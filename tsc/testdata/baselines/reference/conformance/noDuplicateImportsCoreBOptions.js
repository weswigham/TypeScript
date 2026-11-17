//// [tests/cases/conformance/lint/rules/no-duplicate-imports/noDuplicateImportsCoreBOptions.ts] ////

//// [input.ts]
import type Item from 'pkg';
import { value } from 'pkg';
export { other } from 'pkg';
export { third } from 'pkg';
import type { Other } from 'pkg';
export * as space from 'pkg';
export * from 'pkg';

//// [input.ts]
import type Item from 'pkg';
import { value } from 'pkg';
export { other } from 'pkg';
export { third } from 'pkg';
import type { Other } from 'pkg';
export * as space from 'pkg';
export * from 'pkg';

//// [tests/cases/conformance/lint/rules/no-duplicate-imports/noDuplicateImportsCoreB.ts] ////

//// [input.ts]
import * as space from 'pkg';
import { first } from 'pkg';
import { second } from 'pkg';
import 'side';
import 'side';
import type Default from 'types';
import type { Other } from 'types';
export { first } from 'pkg';

//// [input.ts]
import * as space from 'pkg';
import { first } from 'pkg';
import { second } from 'pkg';
import 'side';
import 'side';
import type Default from 'types';
import type { Other } from 'types';
export { first } from 'pkg';

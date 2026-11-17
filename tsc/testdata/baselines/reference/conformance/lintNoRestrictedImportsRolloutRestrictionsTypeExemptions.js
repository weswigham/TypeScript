//// [tests/cases/conformance/lint/rules/no-restricted-imports/lintNoRestrictedImportsRolloutRestrictionsTypeExemptions.ts] ////

//// [input.tsx]
import type {bad} from 'pkg'; import {type bad, bad as other} from 'pkg';

//// [input.tsx]
import type {bad} from 'pkg'; import {type bad, bad as other} from 'pkg';

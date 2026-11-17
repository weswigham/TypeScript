//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290231.ts] ////

//// [input.ts]

import { Value1, Type1 } from 'named_import';
import Type2, { Value2 } from 'default_import';
import Value3, { Type3 } from 'default_import2';
import Type4, { Type5, Value4 } from 'default_and_named_import';
type T = Type1 | Type2 | Type3 | Type4 | Type5;
          

//// [input.ts]

import type { Type1 } from 'named_import';
import { Value1 } from 'named_import';
import type Type2 from 'default_import';
import { Value2 } from 'default_import';
import type { Type3 } from 'default_import2';
import Value3 from 'default_import2';
import type { Type5} from 'default_and_named_import';
import type Type4 from 'default_and_named_import';
import { Value4 } from 'default_and_named_import';
type T = Type1 | Type2 | Type3 | Type4 | Type5;
          

//// [tests/cases/conformance/lint/rules/consistent-type-imports/lintTypescriptConsistentTypeImportsTypeScriptSyntaxUpstreamInvalid8290221.ts] ////

//// [input.ts]

import { Type1, Type2 } from 'named_types';
import Type from 'default_type';
import * as Types from 'namespace_type';
import Default, { Named } from 'default_and_named_type';
type T = Type1 | Type2 | Type | Types.A | Default | Named;
          

//// [input.ts]

import type { Type1, Type2 } from 'named_types';
import type Type from 'default_type';
import type * as Types from 'namespace_type';
import type { Named } from 'default_and_named_type';
import type Default from 'default_and_named_type';
type T = Type1 | Type2 | Type | Types.A | Default | Named;
          

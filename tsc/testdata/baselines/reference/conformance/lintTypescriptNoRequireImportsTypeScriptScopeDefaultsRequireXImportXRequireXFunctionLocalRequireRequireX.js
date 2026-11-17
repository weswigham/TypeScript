//// [tests/cases/conformance/lint/rules/no-require-imports/lintTypescriptNoRequireImportsTypeScriptScopeDefaultsRequireXImportXRequireXFunctionLocalRequireRequireX.ts] ////

//// [input.ts]
require('x'); import x = require('x'); function local(require) { require('x'); }

//// [input.ts]
require('x'); import x = require('x'); function local(require) { require('x'); }

//// [tests/cases/conformance/lint/rules/no-unused-expressions/lintNoUnusedExpressionsCoreDNamespaceFooUseStrictClassCStaticNotDirective.ts] ////

//// [input.ts]
namespace Foo { 'use strict'; } class C { static { 'not directive'; } }

//// [input.ts]
namespace Foo { 'use strict'; } class C { static { 'not directive'; } }

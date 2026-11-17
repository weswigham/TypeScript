//// [tests/cases/conformance/lint/rules/camelcase/lintCamelcaseRolloutBindingsRulesCamelProperties.ts] ////

//// [input.ts]
obj.snake_case = 1; obj.snake_case++; const value = {snake_case: 1}; class C { #snake_case; snake_method() {} }

//// [input.ts]
obj.snake_case = 1; obj.snake_case++; const value = {snake_case: 1}; class C { #snake_case; snake_method() {} }

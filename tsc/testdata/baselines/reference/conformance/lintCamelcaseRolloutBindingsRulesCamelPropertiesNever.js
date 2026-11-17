//// [tests/cases/conformance/lint/rules/camelcase/lintCamelcaseRolloutBindingsRulesCamelPropertiesNever.ts] ////

//// [input.ts]
obj.snake_case = 1; const value = {snake_case: 1}; class C { #snake_case; snake_method() {} }

//// [input.ts]
obj.snake_case = 1; const value = {snake_case: 1}; class C { #snake_case; snake_method() {} }

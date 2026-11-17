//// [tests/cases/conformance/lint/rules/id-match/lintIdMatchRolloutBindingsRulesMatchClassFieldsDefault.ts] ////

//// [input.ts]
class good { bad_name; #bad_name; bad_method() {} #bad_method() {} }

//// [input.ts]
class good { bad_name; #bad_name; bad_method() {} #bad_method() {} }

//// [tests/cases/conformance/lint/rules/no-param-reassign/lintNoParamReassignRolloutBindingsRulesParamDestructure.ts] ////

//// [input.ts]
function task({value}, [other]) { ({key: value = 0} = source); for (other of values) {} }

//// [input.ts]
function task({value}, [other]) { ({key: value = 0} = source); for (other of values) {} }

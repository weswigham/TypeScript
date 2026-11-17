//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstArrayObjConstAFooArrayConsoleLogFoo.ts] ////

//// [globals.d.ts]

//// [input.ts]
const array = [obj]; const [{_a, foo}] = array; console.log(foo);

//// [input.ts]
const array = [obj]; const [{_a, foo}] = array; console.log(foo);

//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamConstXObjYConsoleLog.ts] ////

//// [globals.d.ts]

//// [input.ts]
const { x } = obj,
      y = () => {}
(console.log)()

//// [input.ts]
const { x } = obj,
      y = () => {}
(console.log)()

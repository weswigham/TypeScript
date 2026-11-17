//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarWhoPaulModuleExportsHelloWho.ts] ////

//// [globals.d.ts]

//// [input.ts]
var who = "Paul";
module.exports = `Hello ${who}!`;

//// [input.ts]
var who = "Paul";
module.exports = `Hello ${who}!`;

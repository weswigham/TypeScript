//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarFoo5WhileTrueConsoleLogFooBreak.ts] ////

//// [globals.d.ts]

//// [input.ts]
var foo = 5;

while (true) {
  console.log(foo);
  break;
}

//// [input.ts]
var foo = 5;

while (true) {
  console.log(foo);
  break;
}

//// [tests/cases/conformance/lint/rules/no-unused-vars/lintNoUnusedVarsRolloutUsageUpstreamVarFoo5LabelWhileTrueConsoleLogFooBreakLabel.ts] ////

//// [globals.d.ts]

//// [input.ts]
var foo = 5;

label: while (true) {
  console.log(foo);
  break label;
}

//// [input.ts]
var foo = 5;

label: while (true) {
  console.log(foo);
  break label;
}

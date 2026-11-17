//// [tests/cases/conformance/lint/rules/no-redeclare/rolloutNoRedeclare.ts] ////

//// [input.ts]
var repeated;
var repeated;
var Object;
function parameters(parameter) { var parameter; }
function defaultParameter(parameter = 1) { var parameter; }
const named = function expression(expression) { var expression; };
{ let repeated; }

//// [input.ts]
var repeated;
var repeated;
var Object;
function parameters(parameter) { var parameter; }
function defaultParameter(parameter = 1) { var parameter; }
const named = function expression(expression) { var expression; };
{ let repeated; }

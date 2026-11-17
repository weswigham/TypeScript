//// [tests/cases/conformance/lint/rules/no-delete-var/noDeleteVarOperands.ts] ////

//// [input.ts]
var value;
delete value;
delete (value);
delete ((value));
delete missing;
delete value.property;
delete value["property"];
delete value?.property;
delete (0, value);
delete this;

//// [input.ts]
var value;
delete value;
delete (value);
delete ((value));
delete missing;
delete value.property;
delete value["property"];
delete value?.property;
delete (0, value);
delete this;

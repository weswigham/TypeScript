//// [tests/cases/conformance/lint/rules/dot-notation/dotNotationCore.ts] ////

//// [input.ts]
object["name"];
object[`value`];
object?.["optional"];
object[/* Keep */ "commented"];
object["allowed"];
object["with space"];
object[true];
object[null];

//// [input.ts]
object.name;
object.value;
object?.optional;
object[/* Keep */ "commented"];
object["allowed"];
object["with space"];
object.true;
object.null;

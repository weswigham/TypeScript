//// [tests/cases/conformance/lint/rules/no-with/noWithCore.ts] ////

//// [input.ts]
with (object) { work(); }
with /* keep */ (object) work();
object.work();

//// [input.ts]
with (object) { work(); }
with /* keep */ (object) work();
object.work();

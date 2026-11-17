//// [tests/cases/conformance/lint/rules/no-duplicate-case/lintNoDuplicateCaseDefaultCase3.ts] ////

//// [input.ts]
switch (value) { case object.property: break; case object /* keep */ . property: break; }

//// [input.ts]
switch (value) { case object.property: break; case object /* keep */ . property: break; }

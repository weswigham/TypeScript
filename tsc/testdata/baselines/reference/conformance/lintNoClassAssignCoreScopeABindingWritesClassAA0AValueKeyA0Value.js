//// [tests/cases/conformance/lint/rules/no-class-assign/lintNoClassAssignCoreScopeABindingWritesClassAA0AValueKeyA0Value.ts] ////

//// [input.ts]
class A {} A = 0; ({ A } = value); ({ key: A = 0 } = value);

//// [input.ts]
class A {} A = 0; ({ A } = value); ({ key: A = 0 } = value);

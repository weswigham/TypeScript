//// [tests/cases/conformance/lint/rules/no-unsafe-enum-assignment/lintTypescriptNoUnsafeEnumAssignmentRolloutUnsafeFlowEnumBitwiseUnsafe.ts] ////

//// [input.ts]
enum Flags { Read = 1, Write = 2 } const flags: Flags = Flags.Read | 4;

//// [input.ts]
enum Flags { Read = 1, Write = 2 } const flags: Flags = Flags.Read | 4;

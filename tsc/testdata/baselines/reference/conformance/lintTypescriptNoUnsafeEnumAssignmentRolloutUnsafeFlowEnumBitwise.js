//// [tests/cases/conformance/lint/rules/no-unsafe-enum-assignment/lintTypescriptNoUnsafeEnumAssignmentRolloutUnsafeFlowEnumBitwise.ts] ////

//// [input.ts]
enum Flags { Read = 1, Write = 2 } const flags: Flags = Flags.Read | Flags.Write;

//// [input.ts]
enum Flags { Read = 1, Write = 2 } const flags: Flags = Flags.Read | Flags.Write;

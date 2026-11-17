//// [tests/cases/conformance/lint/rules/no-new-native-nonconstructor/lintNoNewNativeNonconstructorCoreScopeBNativeConstructors.ts] ////

//// [input.ts]
new Symbol(); new BigInt(1); function run(Symbol) { new Symbol(); }

//// [input.ts]
new Symbol(); new BigInt(1); function run(Symbol) { new Symbol(); }

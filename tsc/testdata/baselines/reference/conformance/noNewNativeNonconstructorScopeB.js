//// [tests/cases/conformance/lint/rules/no-new-native-nonconstructor/noNewNativeNonconstructorScopeB.ts] ////

//// [input.ts]
new Symbol("key");
new BigInt(1);
Symbol("key");
BigInt(1);
new object.Symbol();
function shadow(Symbol, BigInt) {
    new Symbol();
    new BigInt(1);
}

//// [input.ts]
new Symbol("key");
new BigInt(1);
Symbol("key");
BigInt(1);
new object.Symbol();
function shadow(Symbol, BigInt) {
    new Symbol();
    new BigInt(1);
}

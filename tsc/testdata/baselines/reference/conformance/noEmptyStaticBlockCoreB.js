//// [tests/cases/conformance/lint/rules/no-empty-static-block/noEmptyStaticBlockCoreB.ts] ////

//// [input.ts]
class Item {
    static {}
    static { /* intentional */ }
    static { work(); }
}

//// [input.ts]
class Item {
    static {}
    static { /* intentional */ }
    static { work(); }
}

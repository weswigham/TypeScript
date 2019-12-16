namespace ts {
    describe("unittests:: assert", () => {
        it("deepEqual", () => {
            assert.throws(() => assert.deepEqual(ts.createNodeArray([ts.createIdentifier("A")]), ts.createNodeArray([ts.createIdentifier("B")])));
            assert.throws(() => assert.deepEqual(ts.createNodeArray([], /*hasTrailingComma*/ true), ts.createNodeArray([], /*hasTrailingComma*/ false)));
            assert.deepEqual(ts.createNodeArray([ts.createIdentifier("A")], /*hasTrailingComma*/ true), ts.createNodeArray([ts.createIdentifier("A")], /*hasTrailingComma*/ true));
        });
        it("assertNever on string has correct error", () => {
            assert.throws(() => ts.Debug.assertNever(("hi" as never)), "Debug Failure. Illegal value: \"hi\"");
        });
    });
}

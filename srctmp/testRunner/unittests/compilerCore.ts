import * as ts from "../ts";
describe("unittests:: compilerCore", () => {
    describe("equalOwnProperties", () => {
        it("correctly equates objects", () => {
            assert.isTrue(ts.equalOwnProperties({}, {}));
            assert.isTrue(ts.equalOwnProperties({ a: 1 }, { a: 1 }));
            assert.isTrue(ts.equalOwnProperties({ a: 1, b: 2 }, { b: 2, a: 1 }));
        });
        it("correctly identifies unmatched objects", () => {
            assert.isFalse(ts.equalOwnProperties({}, { a: 1 }), "missing left property");
            assert.isFalse(ts.equalOwnProperties({ a: 1 }, {}), "missing right property");
            assert.isFalse(ts.equalOwnProperties({ a: 1 }, { a: 2 }), "differing property");
        });
        it("correctly identifies undefined vs hasOwnProperty", () => {
            assert.isFalse(ts.equalOwnProperties({}, { a: undefined }), "missing left property");
            assert.isFalse(ts.equalOwnProperties({ a: undefined }, {}), "missing right property");
        });
        it("truthiness", () => {
            const trythyTest = (l: any, r: any) => !!l === !!r;
            assert.isFalse(ts.equalOwnProperties({}, { a: 1 }, trythyTest), "missing left truthy property");
            assert.isFalse(ts.equalOwnProperties({}, { a: 0 }, trythyTest), "missing left falsey property");
            assert.isFalse(ts.equalOwnProperties({ a: 1 }, {}, trythyTest), "missing right truthy property");
            assert.isFalse(ts.equalOwnProperties({ a: 0 }, {}, trythyTest), "missing right falsey property");
            assert.isTrue(ts.equalOwnProperties({ a: 1 }, { a: "foo" }, trythyTest), "valid equality");
        });
        it("all equal", () => {
            assert.isFalse(ts.equalOwnProperties({}, { a: 1 }, () => true), "missing left property");
            assert.isFalse(ts.equalOwnProperties({ a: 1 }, {}, () => true), "missing right property");
            assert.isTrue(ts.equalOwnProperties({ a: 1 }, { a: 2 }, () => true), "valid equality");
        });
    });
});

/// <reference path="..\..\..\src\harness\harness.ts" />

namespace ts {
    describe("typeBuilder", () => {

        it("can be retrieved from a type checker instance", () => {
            const program = createProgram([], {});
            const checker = program.getTypeChecker();
            const builder = checker.getTypeBuilder();
            assert(builder);
        });

        describe("internal type access", () => {
            const program = createProgram([], {});
            const checker = program.getTypeChecker();
            const builder = checker.getTypeBuilder();

            forEach(["Any", "Boolean", "ESSymbol", "Never", "Null", "Number", "String", "Undefined", "Void"], (typename) => {
                it(`can access the builtin primitive ${typename} type`, () => {
                    const type: Type = (builder as any)[`get${typename}Type`]();
                    assert(type.flags & (ts as any).TypeFlags[typename]);
                });
            });

            it("can access string literal types", () => {
                const type = builder.getStringLiteralType("foo");
                assert(type.text === "foo");
            });

            it("can get references to global types", () => {
                const type1 = builder.lookupGlobalType("Array");
                assert(type1);
                const type2 = builder.lookupGlobalType("Function");
                assert(type2);
                const type3 = builder.lookupGlobalType("RegExp");
                assert(type3);
                assert(type1 !== type2);
                assert(type2 !== type3);
                assert(type1 !== type3);
            });

            it("returns the unknown type when a global type is not present", () => {
                const unknownType = builder.getUnknownType();
                const type = builder.lookupGlobalType("--can't exist--");
                assert(type === unknownType);
            });
        });

        describe("fluent type creation", () => {
            const program = createProgram([], {});
            const checker = program.getTypeChecker();
            const builder = checker.getTypeBuilder();

            it("can build namespaces", () => {
                const ns1 = builder.startNamespace()
                    .setName("A")
                    .addExport("foo", builder.getStringType())
                    .finish();
                assert(ns1.getName() === "A", "Namespace name did not match");
                assert(ns1.exports["foo"], "Namespace export foo did not exist");
                assert(checker.getTypeOfSymbol(ns1.exports["foo"]) === builder.getStringType(), "Namespace member foo was not of type string");

                const outterNamespace = builder.startNamespace()
                    .setName("Out")
                    .addExport(ns1)
                    .addExport("staticName", builder.getStringLiteralType("a-name"))
                    .buildExport("Nested", TypeBuilderKind.Namespace)
                        .addExport("staticVersion", builder.getNumberType())
                        .finish()
                    .finish();

                assert(outterNamespace.getName() === "Out", "Namespace was named incorrectly");
                assert(outterNamespace.exports["A"], "Subnamespace A did not exist");
                assert(outterNamespace.exports["A"].exports["foo"], "Subnamespace member foo did not exist");
                assert(checker.getTypeOfSymbol(outterNamespace.exports["A"].exports["foo"]) === builder.getStringType(), "Subnamespace member foo did not exist");
                assert(checker.getTypeOfSymbol(outterNamespace.exports["staticName"]) === builder.getStringLiteralType("a-name"), "Static member did not exist");
                assert(outterNamespace.exports["Nested"], "Subnamespace Nested did not exist");
                assert(checker.getTypeOfSymbol(outterNamespace.exports["Nested"].exports["staticVersion"]) === builder.getNumberType(), "Static submember did not exist");
            });
            it("can build signatures", () => {
                const p1 = builder.createTypeParameter("T");
                const p2 = builder.createTypeParameter("U", p1);
                const point = builder.startAnonymousType()
                    .addMember("x", builder.getNumberType())
                    .addMember("y", builder.getNumberType())
                    .finish();

                const sig = builder.startSignature()
                    .addTypeParameter(p1)
                    .addTypeParameter(p2)
                    .addParameter("base", p1)
                    .addParameter("extended", p2)
                    .setReturnType(point)
                    .finish();

                const guardSig = builder.startSignature()
                    .addParameter("obj", builder.getAnyType())
                    .setReturnType(builder.getBooleanType())
                    .setPredicateType("obj", point)
                    .finish();

                assert(sig, "Signature was not present");
                assert(sig.getTypeParameters().length === 2, "Not enough type parameters");
                assert(sig.getTypeParameters()[0] === p1, "Type parameter 1 mismatch");
                assert(sig.getTypeParameters()[1] === p2, "Type parameter 2 mismatch");
                assert(sig.getParameters().length === 2, "Not enough parameters");
                assert(sig.getParameters()[0].getName() === "base", "Parameter 1 name mismatch");
                assert(checker.getTypeOfSymbol(sig.getParameters()[0]) === p1, "Parameter 1 type mismatch");
                assert(sig.getParameters()[1].getName() === "extended", "Parameter 2 name mismatch");
                assert(checker.getTypeOfSymbol(sig.getParameters()[1]) === p2, "Parameter 2 type mismatch");
                assert(sig.getReturnType() === point, "Return type mismatch");
                assert(guardSig, "Type guard signature was not present");
                assert(guardSig.getParameters().length === 1, "Parameter count mismatch");
                assert(guardSig.getParameters()[0].getName() === "obj", "Parameter name mismatch");
                assert(checker.getTypeOfSymbol(guardSig.getParameters()[0]) === builder.getAnyType(), "Parameter type mismatch");
                assert(guardSig.getReturnType() === builder.getBooleanType(), "Return type mismatch");
                assert(guardSig.typePredicate, "Type predicate not present");
                assert(guardSig.typePredicate.type === point, "Predicate type mismatch");
                assert((guardSig.typePredicate as IdentifierTypePredicate).parameterName === "obj", "Predicate argument name mismatch");
            });
            it("can build anonymous types", () => {
                const midpoint = builder.startAnonymousType()
                    .buildCallSignature()
                        .buildParameter("data", TypeBuilderKind.Anonymous)
                            .addMember("zip", builder.getNumberType())
                            .addMember("name", builder.getStringType());
                const midpoint2 = midpoint.finish();
                const type = midpoint2
                        .addParameter("shouldProcess", builder.getBooleanType())
                        .buildReturnType(TypeBuilderKind.Anonymous)
                            .addStringIndexType("index", BuilderMemberModifierFlags.None, builder.getNumberType())
                            .finish()
                        .finish()
                    .buildConstructSignature()
                        .addParameter("zip", builder.getNumberType())
                        .addParameter("name", builder.getStringType())
                        .finish()
                    .finish();

                const [call] = type.getCallSignatures();
                const callRet = call.getReturnType();
                assert(callRet.getStringIndexType() === builder.getNumberType(), "Return type index type didn't match");
                assert(callRet.getProperties().length === 0, "Too many return object properties");
                const params = call.getParameters();
                assert(params && params.length === 2, "Not enough call params");
                const [p1, p2] = params;
                const t1 = checker.getTypeOfSymbol(p1);
                assert(t1.flags & TypeFlags.Anonymous, "First parameter not an anonymous object type");
                const [zip, name] = t1.getProperties();
                assert(checker.getTypeOfSymbol(zip) === builder.getNumberType(), "data.zip type did not match");
                assert(checker.getTypeOfSymbol(name) === builder.getStringType(), "data.name type did not match");
                const t2 = checker.getTypeOfSymbol(p2);
                assert(t2 === builder.getBooleanType(), "shouldProcess type did not match");

                const [construct] = type.getConstructSignatures();
                assert(construct, "construct signature did not exist");
                const [c1, c2] = construct.getParameters();
                assert(c1 && c2, "paramaters did not exist");
                assert(checker.getTypeOfSymbol(c1) === builder.getNumberType());
                assert(checker.getTypeOfSymbol(c2) === builder.getStringType());
            });
            it("can build class types", () => {
                const c1 = builder.startClassType()
                    .addMember("x", BuilderMemberModifierFlags.Readonly, builder.getNumberType())
                    .addMember("y", BuilderMemberModifierFlags.Readonly, builder.getNumberType())
                    .buildConstructSignature()
                        .addParameter("x", builder.getNumberType())
                        .addParameter("y", builder.getNumberType())
                        .setReturnType(getc1)
                        .finish()
                    .buildImplementsType(TypeBuilderKind.Interface)
                        .addMember("x", BuilderMemberModifierFlags.Readonly, builder.getAnyType())
                        .addMember("y", BuilderMemberModifierFlags.Readonly, builder.getAnyType())
                        .setName("PointLike")
                        .finish()
                    .buildStatic("from", BuilderMemberModifierFlags.Public, TypeBuilderKind.Signature)
                        .buildParameter("point", TypeBuilderKind.Anonymous)
                            .addMember("x", builder.getNumberType())
                            .addMember("y", builder.getNumberType())
                            .finish()
                        .setReturnType(getc1)
                        .finish()
                    .finish();

                assert(c1, "c1 did not exist");
                assert(checker.getTypeOfSymbol(c1.getProperty("x")) === builder.getNumberType(), "Type c1 had no member x of type number");
                assert(checker.getTypeOfSymbol(c1.getProperty("y")) === builder.getNumberType(), "Type c1 had no member y of type number");
                const [base] = c1.getBaseTypes();
                assert(base, "base type did not exist");
                assert(base.getSymbol().getName() === "PointLike", "Base was not named PointLike")
                assert(checker.getTypeOfSymbol(base.getProperty("x")) === builder.getAnyType(), "Type base had no member x of type number");
                assert(checker.getTypeOfSymbol(base.getProperty("y")) === builder.getAnyType(), "Type base had no member y of type number");
                const statics = c1.getSymbol().exports;
                const from = statics["from"];
                assert(from, "Class had no static member named `from`");
                const [fromSig] = checker.getTypeOfSymbol(from).getCallSignatures();
                assert(fromSig, "From sig did not exist");
                assert(fromSig.getReturnType() === c1, "Return type mismatch");
                assert(fromSig.getParameters()[0].getName() === "point", "Argument was not an anonymous type");
                assert(checker.getTypeOfSymbol(fromSig.getParameters()[0]).flags & TypeFlags.Anonymous, "Argument was not an anonymous type");

                function getc1(): Type {
                    return c1;
                }
            });
            it("can build interface types", () => {
                const c1 = builder.startInterfaceType()
                    .addMember("x", BuilderMemberModifierFlags.Readonly, builder.getNumberType())
                    .addMember("y", BuilderMemberModifierFlags.Readonly, builder.getNumberType())
                    .buildConstructSignature()
                        .addParameter("x", builder.getNumberType())
                        .addParameter("y", builder.getNumberType())
                        .setReturnType(() => c1)
                        .finish()
                    .buildBaseType(TypeBuilderKind.Interface)
                        .addMember("x", BuilderMemberModifierFlags.Readonly, builder.getAnyType())
                        .addMember("y", BuilderMemberModifierFlags.Readonly, builder.getAnyType())
                        .setName("PointLike")
                        .finish()
                    .finish();
            });
            it("can build tuple types", () => {
                const type = builder.startTupleType()
                    .addType(builder.getStringLiteralType("foo"))
                    .addType(builder.getNumberType())
                    .finish();
                assert((type as TupleType).elementTypes[0] === builder.getStringLiteralType("foo"), "First type mismatch");
                assert((type as TupleType).elementTypes[1] === builder.getNumberType(), "Second type mismatch");
            });
            it("can build union types", () => {
                const type = builder.startUnionType()
                    .addType(builder.getStringLiteralType("foo"))
                    .addType(builder.getNumberType())
                    .finish();
                assert((type as UnionType).types[0] === builder.getStringLiteralType("foo"), "First type mismatch");
                assert((type as UnionType).types[1] === builder.getNumberType(), "Second type mismatch");
            });
            it("can build intersection types", () => {
                const type = builder.startIntersectionType()
                    .addType(builder.getStringLiteralType("foo"))
                    .addType(builder.getNumberType())
                    .finish();
                assert((type as IntersectionType).types[0] === builder.getStringLiteralType("foo"), "First type mismatch");
                assert((type as IntersectionType).types[1] === builder.getNumberType(), "Second type mismatch");
            });
            it("can build enum types", () => {
                const enumType = builder.startEnumType()
                    .setName("Animals")
                    .addMember("Cat")
                    .addMember("Dog")
                    .addMember("Giraffe", 20)
                    .addMember("Zebra")
                    .isConst(/*flag*/ true)
                    .finish();
            });
            it("throws if you attempt to finish a type twice", () => {
                const unfinished = builder.startIntersectionType()
                    .addType(builder.getStringLiteralType("foo"))
                    .addType(builder.getNumberType());
                const type = unfinished.finish();
                assert((type as IntersectionType).types[0] === builder.getStringLiteralType("foo"), "First type mismatch");
                assert((type as IntersectionType).types[1] === builder.getNumberType(), "Second type mismatch");
                assert.throws(() => unfinished.finish(), "Cannot `finish` the same type twice");
            });
        });

        describe("type manipulation & instantiation", () => {
            const program = createProgram([], {});
            const checker = program.getTypeChecker();
            const builder = checker.getTypeBuilder();

            it("can create type parameters", () => {
                const param = builder.createTypeParameter("T", builder.getStringType());
                assert(param, "Type parameter did not exist");
                assert(param.constraint === builder.getStringType(), "Type parammeter constrant did not match");
            });
            it("can create aliases to arbitrary types", () => {
                const strOrNumber = builder.startUnionType()
                    .addType(builder.getStringType())
                    .addType(builder.getNumberType())
                    .finish();
                const myType = builder.startAnonymousType()
                    .addMember("x", strOrNumber)
                    .addMember("y", strOrNumber)
                    .finish();
                const ref = builder.createTypeAlias("Point", [], myType);
                assert(ref.flags & SymbolFlags.TypeAlias, "Type alias symbol did not have type alias symbol flag");
                assert(checker.getDeclaredTypeOfSymbol(ref) === myType, "Type alias did not have declared type of the aliased type");
            });
            it("can create references for generic types", () => {
                const array = builder.lookupGlobalType("Array") as GenericType;
                const arrayRef = builder.getTypeReferenceFor(array, builder.getStringType());
                assert(arrayRef.getNumberIndexType() === builder.getStringType(), "Array type reference did not match instantiated type");

                const myParam = builder.createTypeParameter("T");
                const myType = builder.startInterfaceType()
                    .setName("MyInterface")
                    .addTypeParameter(myParam)
                    .addMember("value", BuilderMemberModifierFlags.Readonly, myParam)
                    .finish();
                const myRef = builder.getTypeReferenceFor(myType as GenericType, builder.getNumberType());
                assert(checker.getTypeOfSymbol(myRef.getProperty("value")) === builder.getNumberType(), "Type reference did not match instantiated type");
            });
            it("can instantiate generic types", () => {
                const array = builder.lookupGlobalType("Array") as GenericType;
                const arrayOfString = builder.instantiateType(array, array.typeParameters, [builder.getStringType()]);
                assert(arrayOfString.getNumberIndexType() === builder.getStringType(), "Instantiated type member type did not match");
            });
            it("can merge symbols", () => {
                const ns1 = builder.startNamespace()
                    .setName("A")
                    .addExport("foo", builder.getStringType())
                    .finish();
                const ns2 = builder.startNamespace()
                    .setName("A")
                    .addExport("bar", builder.getNumberType())
                    .finish();
                builder.mergeSymbols(ns1, ns2);

                assert(ns1.getName() === "A", "Namespace name did not match");
                assert(ns1.exports["foo"], "Namespace export foo did not exist");
                assert(checker.getTypeOfSymbol(ns1.exports["foo"]) === builder.getStringType(), "Namespace member foo was not of type string");
                assert(ns1.exports["bar"], "Namespace member bar did not exist");
                assert(checker.getTypeOfSymbol(ns1.exports["bar"]) === builder.getNumberType(), "Namespace member bar was not of type number");
            });
        });
    });
}
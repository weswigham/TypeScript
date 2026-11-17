//// [tests/cases/conformance/lint/rules/no-useless-computed-key/noUselessComputedKeyCore.ts] ////

//// [input.ts]
({ [("x")]: 0 });
({ [/* keep */ "x"]: 0 });
({ ["__proto__"]: 0 });
({ ["__proto__"]: value } = source);
const { ["key"]: renamed } = source;
({ get[2]() {} });
class Example {
    ["x"]() {}
    ["constructor"]() {}
    static ["prototype"]() {}
    static[0];
}

//// [input.ts]
({ "x": 0 });
({ [/* keep */ "x"]: 0 });
({ ["__proto__"]: 0 });
({ "__proto__": value } = source);
const { "key": renamed } = source;
({ get 2() {} });
class Example {
    "x"() {}
    ["constructor"]() {}
    static ["prototype"]() {}
    static 0;
}

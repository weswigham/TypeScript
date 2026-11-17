//// [tests/cases/conformance/lint/rules/no-useless-computed-key/lintNoUselessComputedKeyCoreDFixesClassCXConstructorStaticPrototype.ts] ////

//// [input.tsx]
class C { ['x']() {} ['constructor']() {} static ['prototype']() {} }

//// [input.tsx]
class C { 'x'() {} ['constructor']() {} static ['prototype']() {} }

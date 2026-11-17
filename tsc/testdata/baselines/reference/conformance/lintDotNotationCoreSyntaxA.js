//// [tests/cases/conformance/lint/rules/dot-notation/lintDotNotationCoreSyntaxA.ts] ////

//// [input.ts]
object['name']; object[`other`]; object['with space'];

//// [input.ts]
object.name; object.other; object['with space'];

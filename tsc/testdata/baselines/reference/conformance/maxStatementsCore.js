//// [tests/cases/conformance/lint/rules/max-statements/maxStatementsCore.ts] ////

//// [input.ts]
function excessive() { first(); second(); third(); }
function nested() { if (value) { first(); second(); } }
function separate() { function inner() { first(); second(); } last(); }
class Example { static { first(); second(); third(); } }

//// [input.ts]
function excessive() { first(); second(); third(); }
function nested() { if (value) { first(); second(); } }
function separate() { function inner() { first(); second(); } last(); }
class Example { static { first(); second(); third(); } }

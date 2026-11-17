//// [tests/cases/conformance/lint/rules/no-extra-bind/lintNoExtraBindCoreSyntaxBBindNestedBoundaries.ts] ////

//// [input.ts]
const first = function() { class Item { field = this; static { this; } } function nested() { this; } }.bind(value);

//// [input.ts]
const first = (function() {
    class Item {
        field = this; static { this; }
    } function nested() { this; }
});

//// [capturesLexicalArguments.ts]
(function () {
    const foo = () => {
        void arguments;
    };
}());

//// [capturesLexicalArguments.js]
(function () {
    var _arguments = arguments;
    var foo = function () {
        void arguments;
    };
}());

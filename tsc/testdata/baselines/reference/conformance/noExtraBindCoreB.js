//// [tests/cases/conformance/lint/rules/no-extra-bind/noExtraBindCoreB.ts] ////

//// [input.ts]
const first = function() { return 1; }.bind(value);
const arrow = (() => this).bind(value);
const required = function() { return () => this; }.bind(value);
const effects = function() {}.bind(work());
const comments = function() {}.bind(/* keep */ value);
const fields = function() { class Item { field = this; } }.bind(value);
const keys = function() { class Item { [this.key] = 1; } }.bind(value);

//// [input.ts]
const first = (function() { return 1; });
const arrow = ((() => this));
const required = function() { return () => this; }.bind(value);
const effects = function() {}.bind(work());
const comments = function() {}.bind(/* keep */ value);
const fields = (function() {
    class Item {
        field = this;
    }
});
const keys = function() { class Item { [this.key] = 1; } }.bind(value);

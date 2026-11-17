//// [tests/cases/conformance/lint/rules/prefer-arrow-callback/rolloutPreferArrowCallback.ts] ////

//// [input.ts]
export {};
consume(function(value: number): number { return value; });
consume(function named() {});
consume(function /* preserve */ () {});
consume(function() { return this.value; }.bind(this));
consume(function recursive() { recursive(); });
consume(function() { return arguments; });
consume(function() { return this; });

//// [input.ts]
export {};
consume((value: number): number => { return value; });
consume(() => {});
consume( /* preserve */ () => {});
consume(() => { return this.value; });
consume(function recursive() { recursive(); });
consume(function() { return arguments; });
consume(function() { return this; });

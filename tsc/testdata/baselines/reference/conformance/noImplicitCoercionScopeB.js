//// [tests/cases/conformance/lint/rules/no-implicit-coercion/noImplicitCoercionScopeB.ts] ////

//// [input.ts]
const boolean = !!value;
const sequence = !!(first, second);
typeof!!value;
+value;
- -value;
value * 1;
value - 0;
"" + value;
value += "";
~items.indexOf(value);
~items?.lastIndexOf(value);
`${value}`;
function shadow(Boolean) { return !!value; }
const comment = !!(/* keep */value);
value * 1 / 4;
(value * 1) / 4;

//// [input.ts]
const boolean = Boolean(value);
const sequence = Boolean((first, second));
typeof Boolean(value);
+value;
- -value;
value * 1;
value - 0;
"" + value;
value += "";
~items.indexOf(value);
~items?.lastIndexOf(value);
`${value}`;
function shadow(Boolean) { return !!value; }
const comment = !!(/* keep */value);
value * 1 / 4;
(value * 1) / 4;

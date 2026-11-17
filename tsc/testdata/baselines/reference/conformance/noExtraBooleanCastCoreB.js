//// [tests/cases/conformance/lint/rules/no-extra-boolean-cast/noExtraBooleanCastCoreB.ts] ////

//// [input.ts]
if (!!value) {}
while (Boolean(value)) {}
Boolean(!!value);
if (!Boolean()) {}
if (Boolean(/* keep */ value)) {}
if (Boolean(value, sideEffect())) {}
const keep = !!value;
function shadow(Boolean) { if (Boolean(value)) {} }

//// [input.ts]
if ((value)) {}
while ((value)) {}
Boolean((value));
if ((true)) {}
if (Boolean(/* keep */ value)) {}
if (Boolean(value, sideEffect())) {}
const keep = !!value;
function shadow(Boolean) { if (Boolean(value)) {} }

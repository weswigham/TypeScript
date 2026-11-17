//// [tests/cases/conformance/lint/rules/no-extra-boolean-cast/noExtraBooleanCastCoreBOptions.ts] ////

//// [input.ts]
if (value && Boolean(other)) {}
if (value ?? Boolean(other)) {}
if ((value, Boolean(other))) {}
if (value ? Boolean(other) : !!third) {}
const keep = value || Boolean(other);

//// [input.ts]
if (value && (other)) {}
if (value ?? (other)) {}
if ((value, (other))) {}
if (value ? (other) : (third)) {}
const keep = value || Boolean(other);

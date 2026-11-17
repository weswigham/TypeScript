//// [tests/cases/conformance/lint/rules/no-underscore-dangle/lintNoUnderscoreDangleCoreScopeCReportsConstAllowedNestedValueSourceObjectAllowed.ts] ////

//// [input.ts]
const { _allowed, nested: _value } = source; object._allowed;

//// [input.ts]
const { _allowed, nested: _value } = source; object._allowed;

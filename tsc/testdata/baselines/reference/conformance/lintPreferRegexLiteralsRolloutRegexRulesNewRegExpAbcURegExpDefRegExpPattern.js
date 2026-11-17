//// [tests/cases/conformance/lint/rules/prefer-regex-literals/lintPreferRegexLiteralsRolloutRegexRulesNewRegExpAbcURegExpDefRegExpPattern.ts] ////

//// [input.ts]
new RegExp('abc', 'u'); RegExp(`def`); RegExp(pattern);

//// [input.ts]
new RegExp('abc', 'u'); RegExp(`def`); RegExp(pattern);

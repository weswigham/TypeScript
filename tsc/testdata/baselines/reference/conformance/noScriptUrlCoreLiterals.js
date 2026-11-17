//// [tests/cases/conformance/lint/rules/no-script-url/noScriptUrlCoreLiterals.ts] ////

//// [input.ts]
'javascript:void(0);';
'JavaScript:';
`javascript:`;
'\x6aavascript:';
tag`javascript:`;
`javascript:${foo}`;
'xjavascript:';

//// [input.ts]
'javascript:void(0);';
'JavaScript:';
`javascript:`;
'\x6aavascript:';
tag`javascript:`;
`javascript:${foo}`;
'xjavascript:';

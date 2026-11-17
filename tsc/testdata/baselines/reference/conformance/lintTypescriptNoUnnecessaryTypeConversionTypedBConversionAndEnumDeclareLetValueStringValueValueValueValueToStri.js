//// [tests/cases/conformance/lint/rules/no-unnecessary-type-conversion/lintTypescriptNoUnnecessaryTypeConversionTypedBConversionAndEnumDeclareLetValueStringValueValueValueValueToStri.ts] ////

//// [input.ts]
declare let value: string; value + ''; '' + value; value += ''; value.toString();

//// [input.ts]
declare let value: string; value + ''; '' + value; value += ''; value.toString();

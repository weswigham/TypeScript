//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamValid34.ts] ////

//// [input.tsx]

type BrandedString = string & { __brand: 'safe' };

declare const brandedString: BrandedString;

const spreadBrandedString = [...brandedString];
      

//// [input.tsx]

type BrandedString = string & { __brand: 'safe' };

declare const brandedString: BrandedString;

const spreadBrandedString = [...brandedString];
      

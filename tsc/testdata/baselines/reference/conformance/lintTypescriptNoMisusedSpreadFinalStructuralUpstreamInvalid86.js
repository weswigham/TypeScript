//// [tests/cases/conformance/lint/rules/no-misused-spread/lintTypescriptNoMisusedSpreadFinalStructuralUpstreamInvalid86.ts] ////

//// [input.tsx]

        const a = { ...new (class A { static value = 1; })() };
      

//// [input.tsx]

        const a = { ...new (class A { static value = 1; })() };
      

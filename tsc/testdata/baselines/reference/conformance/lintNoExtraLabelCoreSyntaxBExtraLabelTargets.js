//// [tests/cases/conformance/lint/rules/no-extra-label/lintNoExtraLabelCoreSyntaxBExtraLabelTargets.ts] ////

//// [input.ts]
outer: while (true) { continue outer; switch (value) { default: continue outer; } inner: { break inner; } }

//// [input.ts]
outer: while (true) { continue; switch (value) { default: continue outer; } inner: { break inner; } }

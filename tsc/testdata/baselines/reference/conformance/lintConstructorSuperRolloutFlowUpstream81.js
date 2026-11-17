//// [tests/cases/conformance/lint/rules/constructor-super/lintConstructorSuperRolloutFlowUpstream81.ts] ////

//// [input.ts]
class C extends D {

                constructor() {
                    while (foo) {
                        if (bar) {
                            super();
                            break;
                        }
                    }
                }

            }

//// [input.ts]
class C extends D {

                constructor() {
                    while (foo) {
                        if (bar) {
                            super();
                            break;
                        }
                    }
                }

            }

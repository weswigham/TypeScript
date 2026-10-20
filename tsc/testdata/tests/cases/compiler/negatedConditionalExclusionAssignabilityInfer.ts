// @strict: true
// @noEmit: true

type InferValue<T> = T extends { value: infer U } ? U : never;
type InferIndependent<T> = T extends { value: infer U } ? T | U : T;
type InferConsumer<T> = T extends { value: infer U } ? (value: U) => void : never;
type InferConstrained<T> = T extends { value: infer U extends string } ? U : never;

function unresolvedInference<T>(value: T): InferValue<T> {
    return value;
}

function unrelatedInferredValue<T, V>(value: T & { value: V }): InferValue<T> {
    return value;
}

function independentInference<T>(value: T): InferIndependent<T> {
    return value;
}

function inferredWrite<T, V>(value: T & ((arg: V) => void)): InferConsumer<T> {
    return value;
}

function constrainedInference<T>(value: string): InferConstrained<T> {
    return value;
}

const inferredValue: InferValue<{ value: string }> = "value";
const incorrectInferredValue: InferValue<{ value: string }> = 123;
const inferredNever: InferValue<{}> = "value";
const inferredConstraint: InferConstrained<{ value: number }> = 123;

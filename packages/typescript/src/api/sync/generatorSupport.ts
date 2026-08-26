import type {
    APIMethodInfo,
    APIRequest,
    APIResponse,
} from "../proto.ts";
import type { API } from "./api.ts";

export function cacheGeneratorMethod<Sync extends (...args: any[]) => any, Gen extends (...args: any[]) => APIRequestGenerator>(
    owner: object,
    name: PropertyKey,
    sync: Sync,
    gen: Gen,
): Sync & { readonly gen: Gen; } {
    const method = Object.assign(sync, { gen });
    Object.defineProperty(owner, name, { configurable: true, value: method });
    return method;
}

export function apiRequest<Method extends keyof APIMethodInfo>(
    method: Method,
    params: APIMethodInfo[Method]["params"],
): Generator<APIRequest, APIMethodInfo[Method]["result"], APIResponse["result"]>;
export function* apiRequest(method: PropertyKey, params: unknown): Generator<{ method: PropertyKey; params: unknown; }, unknown, unknown> {
    return yield { method, params };
}
export type APIRequestGenerator = Generator<APIRequest, any, APIResponse["result"]>;
type GeneratorReturn<T> = T extends Generator<any, infer R, any> ? R : never;
export type ExecutedGeneratorsResults<T extends readonly APIRequestGenerator[]> = {
    [K in keyof T]: GeneratorReturn<T[K]>;
};

export function batchGenerators<T extends readonly APIRequestGenerator[]>(
    api: API<any>,
    ...requestGenerators: T
): ExecutedGeneratorsResults<T> {
    const results: any[] = [];
    const requestObjects: (APIRequest | undefined)[] = [];
    const completedIndices = new Set<number>();
    let failure: { error: unknown; } | undefined;
    try {
        for (let i = 0; i < requestGenerators.length; i++) {
            const state = requestGenerators[i].next();
            if (state.done) {
                results[i] = state.value;
                completedIndices.add(i);
            }
            else {
                requestObjects[i] = state.value;
            }
        }
        while (completedIndices.size < requestGenerators.length) {
            const { requests, responseIndices } = createRequestBatch(requestObjects, completedIndices, requestGenerators.length);
            const response = api.batchRequests(requests);
            for (let i = 0; i < requestGenerators.length; i++) {
                if (completedIndices.has(i)) continue;

                const requestGenerator = requestGenerators[i];
                const result = response.responses[responseIndices[i]!];
                const state = result.error
                    ? requestGenerator.throw(new Error(result.error))
                    : requestGenerator.next(result.result);
                if (state.done) {
                    results[i] = state.value;
                    completedIndices.add(i);
                    requestObjects[i] = undefined;
                }
                else requestObjects[i] = state.value;
            }
        }
        return results as any[] as ExecutedGeneratorsResults<T>;
    }
    catch (error) {
        failure = { error };
        throw error;
    }
    finally {
        if (failure) {
            try {
                finishGeneratorsAfterError(api, requestGenerators, completedIndices, failure.error);
            }
            catch {}
        }
    }
}

function finishGeneratorsAfterError(
    api: API<any>,
    requestGenerators: readonly APIRequestGenerator[],
    completedIndices: ReadonlySet<number>,
    error: unknown,
): void {
    const cleanupCompletedIndices = new Set(completedIndices);
    const cleanupRequestObjects: (APIRequest | undefined)[] = [];

    for (let i = 0; i < requestGenerators.length; i++) {
        if (cleanupCompletedIndices.has(i)) continue;
        advance(i, () => requestGenerators[i].throw(error));
    }

    while (cleanupCompletedIndices.size < requestGenerators.length) {
        const { requests, responseIndices } = createRequestBatch(cleanupRequestObjects, cleanupCompletedIndices, requestGenerators.length);
        let response: ReturnType<API<any>["batchRequests"]>;
        try {
            response = api.batchRequests(requests);
        }
        catch (cleanupError) {
            for (let i = 0; i < requestGenerators.length; i++) {
                if (cleanupCompletedIndices.has(i)) continue;
                advance(i, () => requestGenerators[i].throw(cleanupError));
            }
            continue;
        }

        for (let i = 0; i < requestGenerators.length; i++) {
            if (cleanupCompletedIndices.has(i)) continue;
            const result = response.responses[responseIndices[i]!];
            advance(i, () =>
                result.error
                    ? requestGenerators[i].throw(new Error(result.error))
                    : requestGenerators[i].next(result.result));
        }
    }

    function advance(index: number, operation: () => IteratorResult<APIRequest, any>): void {
        try {
            const state = operation();
            if (state.done) {
                cleanupCompletedIndices.add(index);
                cleanupRequestObjects[index] = undefined;
            }
            else cleanupRequestObjects[index] = state.value;
        }
        catch {
            cleanupCompletedIndices.add(index);
            cleanupRequestObjects[index] = undefined;
        }
    }
}

function createRequestBatch(
    requestObjects: readonly (APIRequest | undefined)[],
    completedIndices: ReadonlySet<number>,
    generatorCount: number,
): { requests: APIRequest[]; responseIndices: (number | undefined)[]; } {
    const requests: APIRequest[] = [];
    const responseIndices: (number | undefined)[] = [];
    const responseIndexByDeduplicationKey = new Map<string, number>();
    for (let i = 0; i < generatorCount; i++) {
        if (completedIndices.has(i)) continue;

        const request = requestObjects[i]!;
        const deduplicationKey = getRequestDeduplicationKey(request);
        let responseIndex = deduplicationKey === undefined ? undefined : responseIndexByDeduplicationKey.get(deduplicationKey);
        if (responseIndex === undefined) {
            responseIndex = requests.length;
            requests.push(request);
            if (deduplicationKey !== undefined) responseIndexByDeduplicationKey.set(deduplicationKey, responseIndex);
        }
        responseIndices[i] = responseIndex;
    }
    return { requests, responseIndices };
}

function getRequestDeduplicationKey(request: APIRequest): string | undefined {
    switch (request.method) {
        case "initialize":
            return request.method;
        default:
            return undefined;
    }
}

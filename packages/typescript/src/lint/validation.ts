export function record(value: unknown, description: string): Record<string, unknown> {
    if (value === null || typeof value !== "object" || Array.isArray(value)) throw new Error(`${description} must be an object`);
    return value as Record<string, unknown>;
}

export function string(value: unknown, description: string): string {
    if (typeof value !== "string" || value.length === 0) throw new Error(`${description} must be a nonempty string`);
    return value;
}

export function strings(value: unknown, description: string): string[] {
    if (!Array.isArray(value)) throw new Error(`${description} must be an array of strings`);
    return value.map((item: unknown) => string(item, description));
}

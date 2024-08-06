// @declaration: true
export function adaptEnum<TEnum extends Record<string, string>>(
) {
	type Part1 = {
		[Property in keyof TEnum]: () => TEnum[Property]
	};
	const factoryOut = () => {
		return (0 as unknown as typeof factoryOut & Part1)[0 as unknown as keyof TEnum]() 
	};
	// was () => TEnum[string] | TEnum[number] | TEnum[symbol]
	// now `() => TEnum[keyof TEnum]`
	// better `exists T oneof keyof TEnum in () => TEnum[T]`
	return factoryOut;
}
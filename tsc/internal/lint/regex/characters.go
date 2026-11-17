package regex

import (
	"strings"
	"unicode"
)

func bindingWord(character rune) bool {
	return character >= 'a' && character <= 'z' || character >= 'A' && character <= 'Z' || character >= '0' && character <= '9' || character == '_'
}

func bindingSpace(character rune) bool {
	return character == '\t' || character == '\v' || character == '\f' || character == '\n' || character == '\r' || character == '\u2028' || character == '\u2029' || character == '\ufeff' || unicode.Is(unicode.Zs, character)
}

func bindingUnicodeProperty(name string) func(rune) bool {
	aliases := map[string]string{
		"Letter": "L", "Lowercase_Letter": "Ll", "Uppercase_Letter": "Lu", "Titlecase_Letter": "Lt", "Modifier_Letter": "Lm", "Other_Letter": "Lo",
		"Number": "N", "Decimal_Number": "Nd", "Letter_Number": "Nl", "Other_Number": "No", "Mark": "M", "Nonspacing_Mark": "Mn", "Spacing_Mark": "Mc", "Enclosing_Mark": "Me",
		"Punctuation": "P", "Connector_Punctuation": "Pc", "Dash_Punctuation": "Pd", "Open_Punctuation": "Ps", "Close_Punctuation": "Pe", "Initial_Punctuation": "Pi", "Final_Punctuation": "Pf", "Other_Punctuation": "Po",
		"Separator": "Z", "Space_Separator": "Zs", "Line_Separator": "Zl", "Paragraph_Separator": "Zp", "Symbol": "S", "Math_Symbol": "Sm", "Currency_Symbol": "Sc", "Modifier_Symbol": "Sk", "Other_Symbol": "So",
		"Other": "C", "Control": "Cc", "Format": "Cf", "Surrogate": "Cs", "Private_Use": "Co", "Latn": "Latin", "Grek": "Greek", "Cyrl": "Cyrillic", "Hani": "Han",
	}
	if prefix, value, found := strings.Cut(name, "="); found {
		if prefix != "General_Category" && prefix != "gc" && prefix != "Script" && prefix != "sc" && prefix != "Script_Extensions" && prefix != "scx" {
			return nil
		}
		name = value
	}
	if alias := aliases[name]; alias != "" {
		name = alias
	}
	switch name {
	case "Any":
		return func(rune) bool { return true }
	case "ASCII":
		return func(character rune) bool { return character <= 0x7f }
	case "Assigned":
		return func(character rune) bool {
			return unicode.IsGraphic(character) || unicode.IsControl(character) || unicode.Is(unicode.Cf, character) || unicode.Is(unicode.Co, character) || unicode.Is(unicode.Cs, character)
		}
	case "ASCII_Hex_Digit", "AHex":
		return func(character rune) bool {
			return character >= '0' && character <= '9' || character >= 'a' && character <= 'f' || character >= 'A' && character <= 'F'
		}
	case "Lowercase", "Lower":
		return func(character rune) bool {
			return unicode.IsLower(character) || unicode.Is(unicode.Properties["Other_Lowercase"], character)
		}
	case "Uppercase", "Upper":
		return func(character rune) bool {
			return unicode.IsUpper(character) || unicode.Is(unicode.Properties["Other_Uppercase"], character)
		}
	case "Alphabetic", "Alpha":
		return func(character rune) bool {
			return unicode.IsLetter(character) || unicode.Is(unicode.Nl, character) || unicode.Is(unicode.Properties["Other_Alphabetic"], character)
		}
	case "ID_Start", "IDS":
		return func(character rune) bool {
			return unicode.IsLetter(character) || unicode.Is(unicode.Nl, character) || unicode.Is(unicode.Properties["Other_ID_Start"], character)
		}
	case "ID_Continue", "IDC":
		start := bindingUnicodeProperty("ID_Start")
		return func(character rune) bool {
			return start(character) || unicode.In(character, unicode.Mn, unicode.Mc, unicode.Nd, unicode.Pc) || unicode.Is(unicode.Properties["Other_ID_Continue"], character)
		}
	case "Cased_Letter", "LC":
		return func(character rune) bool { return unicode.In(character, unicode.Ll, unicode.Lu, unicode.Lt) }
	}
	table := unicode.Categories[name]
	if table == nil {
		table = unicode.Scripts[name]
	}
	if table == nil {
		table = unicode.Properties[name]
	}
	if table == nil {
		return nil
	}
	return func(character rune) bool { return unicode.Is(table, character) }
}

export namespace Characters {
  export const Comma = ",";
  export const Dot = ".";
  export const Colon = ":";
  export const LeftParen = "(";
  export const RightParen = ")";
  export const LeftBrace = "{";
  export const RightBrace = "}";
  export const LeftBracket = "[";
  export const RightBracket = "]";
  export const DoubleQuote = '"';
  export const SingleQuote = "'";
  export const Backslash = "\\";

  export const isWhitespace = (char: string) =>
    char === " " || char === "\t" || char === "\n" || char === "\r";

  export const isDigit = (char: string) => char >= "0" && char <= "9";

  export const isHexDigit = (char: string) =>
    (char >= "0" && char <= "9") ||
    (char >= "a" && char <= "f") ||
    (char >= "A" && char <= "F");

  export const isLetter = (char: string) =>
    (char >= "a" && char <= "z") || (char >= "A" && char <= "Z");

  export const isLetterOrDigit = (char: string) =>
    isLetter(char) || isDigit(char);

  export const isLineBreak = (char: string) =>
    char === "\n" || char === "\r" || char === "\u2028" || char === "\u2029";

  export const isWhitespaceOrLineBreak = (char: string) =>
    isWhitespace(char) || isLineBreak(char);

  export const isIdentifierStart = (char: string) =>
    char === "_" || isLetter(char);

  export const isIdentifierPart = (char: string) =>
    char === "_" || isLetterOrDigit(char);

  export const isUnicodeEscape = (char: string) => char === "u";
}

import { IStream } from "src/stream/stream";
import { Token } from "./token";
import { Characters } from "./characters";
import { TokenType } from "./token-type";
import { FilePosition } from "./file-position";
import { RSONParseError } from "src/errors";

export class Tokenizer {
  private startPosition: FilePosition = new FilePosition(1, 1);
  private currentPosition: FilePosition = new FilePosition(1, 1);

  constructor(private readonly input: IStream) {}

  public tokenize() {
    const tokens: Token[] = [];
    while (!this.input.eof()) {
      this.startPosition = FilePosition.copy(this.currentPosition);
      const char = this.input.peek();
      if (Characters.isLineBreak(char)) {
        this.nextLine();
        continue;
      }
      switch (true) {
        case Characters.isWhitespace(char):
          this.next();
          break;
        case Characters.isDigit(char):
          tokens.push(this.tokenizeNumber());
          break;
        case char === "{":
          tokens.push(this.makeToken(TokenType.LeftCurlyBracket, this.next()));
          break;
        case char === "}":
          tokens.push(this.makeToken(TokenType.RightCurlyBracket, this.next()));
          break;
        case char === "[":
          tokens.push(this.makeToken(TokenType.LeftSquareBracket, this.next()));
          break;
        case char === "]":
          tokens.push(
            this.makeToken(TokenType.RightSquareBracket, this.next())
          );
          break;
        case char === "(":
          tokens.push(this.tokenizeObjectReferenceDefinition());
          break;
        case char === "$":
          tokens.push(this.tokenizeObjectReference());
          break;
        case char === ",":
          tokens.push(this.makeToken(TokenType.Comma, this.next()));
          break;
        case char === ":":
          tokens.push(this.makeToken(TokenType.Colon, this.next()));
          break;
        case char === '"':
          tokens.push(this.tokenizeString());
          break;
        case char === "t":
          tokens.push(this.tokenizeTrue());
          break;
        case char === "f":
          tokens.push(this.tokenizeFalse());
          break;
        case char === "n":
          tokens.push(this.tokenizeNull());
          break;
        case char === "/":
          this.tokenizeComment();
          break;
        default:
          this.throwUnexpectedCharacter(char);
      }
    }
    tokens.push(
      new Token(
        TokenType.EOF,
        "EOF",
        FilePosition.copy(this.currentPosition),
        FilePosition.copy(this.currentPosition)
      )
    );
    return tokens;
  }

  private tokenizeNumber(): Token {
    let value = "";
    if (this.input.peek() === "0") {
      value += this.next();
      const nextChar = this.input.peek();
      if (nextChar === ".") {
        value += this.next();
        value += this.readFraction();
        return this.makeToken(TokenType.Number, value);
      }
      if (nextChar === "e" || nextChar === "E") {
        value += this.next();
        value += this.readExponent();
        return this.makeToken(TokenType.Number, value);
      }
    }
    while (!this.input.eof()) {
      const char = this.input.peek();
      if (Characters.isDigit(char)) {
        value += this.next();
        continue;
      }
      if (char === ".") {
        value += this.next();
        value += this.readFraction();
        break;
      }
      if (char === "e" || char === "E") {
        value += this.next();
        value += this.readExponent();
        break;
      }
      break;
    }
    return this.makeToken(TokenType.Number, value);
  }

  private readExponent(): string {
    let value = "";
    const char = this.input.peek();
    if (char === "+" || char === "-") {
      value += this.next();
    }
    const nextChar = this.input.peek();
    if (!Characters.isDigit(nextChar)) {
      this.throwUnexpectedCharacter(nextChar);
    }
    value += this.next();
    while (!this.input.eof()) {
      const char = this.input.peek();
      if (Characters.isDigit(char)) {
        value += char;
        this.next();
      } else {
        break;
      }
    }
    return value;
  }

  private readFraction(): string {
    let value = "";
    if (!Characters.isDigit(this.input.peek())) {
      this.throwUnexpectedCharacter(this.input.peek());
    }
    while (!this.input.eof()) {
      const char = this.input.peek();
      if (Characters.isDigit(char)) {
        value += this.next();
      } else if (char === "e" || char === "E") {
        value += this.next();
        value += this.readExponent();
        break;
      } else {
        break;
      }
    }
    return value;
  }

  private tokenizeString(): Token {
    let value = "";
    this.next();
    while (!this.input.eof()) {
      const char = this.next();
      if (char === "\\") {
        const nextChar = this.input.peek();
        if (nextChar === '"') {
          value += this.next();
          continue;
        }
        if (nextChar === "\\") {
          value += this.next();
          continue;
        }
        if (nextChar === "n") {
          value += "\n";
          this.next();
          continue;
        }
        if (nextChar === "r") {
          value += "\r";
          this.next();
          continue;
        }
        if (nextChar === "t") {
          value += "\t";
          this.next();
          continue;
        }
        if (nextChar === "u") {
          value += this.readUnicode();
          continue;
        }
        if (nextChar === "f") {
          value += "\f";
          this.next();
          continue;
        }
        if (nextChar === "b") {
          value += "\b";
          this.next();
          continue;
        }
        if (nextChar === "/") {
          value += this.next();
          continue;
        }
        this.throwUnexpectedCharacter(nextChar);
      }
      if (char === '"') {
        break;
      }
      value += char;
    }
    return this.makeToken(TokenType.String, value);
  }

  private tokenizeTrue(): Token {
    return this.makeToken(TokenType.True, this.readWord("true"));
  }

  private tokenizeFalse(): Token {
    return this.makeToken(TokenType.False, this.readWord("false"));
  }

  private tokenizeNull(): Token {
    return this.makeToken(TokenType.Null, this.readWord("null"));
  }

  private tokenizeObjectReferenceDefinition(): Token {
    this.next();
    const nextChar = this.input.peek();
    if (!Characters.isIdentifierStart(nextChar)) {
      this.throwUnexpectedCharacter(nextChar);
    }
    const name = this.readIdentifier();
    const nextCharAfterName = this.input.peek();
    if (nextCharAfterName !== ")") {
      this.throwUnexpectedCharacter(nextCharAfterName);
    }
    this.next();
    return this.makeToken(TokenType.ObjectReferenceDefinition, name);
  }

  private tokenizeObjectReference(): Token {
    this.next();
    const name = this.readIdentifier();
    return this.makeToken(TokenType.ObjectReference, name);
  }

  private tokenizeComment() {
    this.next();
    const nextChar = this.input.peek();
    if (nextChar === "/") {
      this.readSingleLineComment();
      return;
    }
    if (nextChar === "*") {
      this.readMultiLineComment();
      return;
    }
    this.throwUnexpectedCharacter(nextChar);
  }

  private readIdentifier() {
    let value = "";
    while (!this.input.eof()) {
      const char = this.input.peek();
      if (Characters.isIdentifierPart(char)) {
        value += char;
        this.next();
      } else {
        break;
      }
    }
    return value;
  }

  private readWord(word: string) {
    let value = "";
    for (let i = 0; i < word.length; i++) {
      const char = this.next();
      if (char !== word[i]) {
        this.throwUnexpectedCharacter(char);
      }
      value += char;
    }
    return value;
  }

  private readUnicode(): string {
    this.next();
    let value = "";
    for (let i = 0; i < 4; i++) {
      const char = this.next();
      if (!Characters.isDigit(char) && !Characters.isHexDigit(char)) {
        this.throwUnexpectedCharacter(char);
      }
      value += char;
    }
    return String.fromCharCode(parseInt(value, 16));
  }

  private readSingleLineComment() {
    while (!this.input.eof()) {
      const char = this.next();
      if (Characters.isLineBreak(char)) {
        this.nextLine();
        return;
      }
    }
  }

  private readMultiLineComment() {
    this.next();
    while (!this.input.eof()) {
      const char = this.next();
      if (Characters.isLineBreak(char)) {
        this.nextLine();
        continue;
      }
      if (char === "*") {
        const nextChar = this.input.peek();
        if (nextChar === "/") {
          this.next();
          return;
        }
      }
    }
  }

  private makeToken(type: TokenType, value: string): Token {
    return new Token(
      type,
      value,
      FilePosition.copy(this.startPosition),
      FilePosition.copy(this.currentPosition)
    );
  }

  private next(count = 1) {
    this.currentPosition.column += count;
    return this.input.read(count);
  }

  private nextLine() {
    this.currentPosition.line++;
    this.currentPosition.column = 0;
    this.next();
  }

  private throwUnexpectedCharacter(char: string): never {
    throw new RSONParseError(
      `Unexpected character: ${char} at line ${this.currentPosition.line}, column ${this.currentPosition.column}`
    );
  }
}

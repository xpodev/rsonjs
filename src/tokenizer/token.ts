import { FilePosition } from "./file-position";
import { TokenType } from "./token-type";

export class Token {
  constructor(
    public readonly type: TokenType,
    public readonly value: string,
    public readonly startPosition: FilePosition,
    public readonly endPosition: FilePosition
  ) {}

  toString() {
    return `Token(${TokenType[this.type]}, "${this.value}", ${this.startPosition}, ${this.endPosition})`;
  }
}

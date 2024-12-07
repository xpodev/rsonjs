import { Token, Tokenizer, TokenType } from "src/tokenizer";
import { IStream } from "src/stream/stream";
import { TokenStream } from "./token-stream";
import { RSONParseError } from "src/errors";

class LateReference {
  constructor(
    public readonly obj: Record<string, any> | Array<any>,
    public readonly key: number | string,
    public readonly name: string
  ) {}
}

export class Parser {
  private tokenizer: Tokenizer;
  private tokenStream!: TokenStream;
  private readonly objectReferences: Record<string, any> = {};
  private readonly lateReferences: Array<LateReference> = [];
  constructor(stream: IStream) {
    this.tokenizer = new Tokenizer(stream);
  }

  public parse() {
    this.tokenStream = new TokenStream(this.tokenizer.tokenize());
    const obj = this.parseValue();
    this.eat(TokenType.EOF);
    this.lateReferences.forEach((ref) => {
      if (ref.name in this.objectReferences) {
        if (Array.isArray(ref.obj)) {
          ref.obj.splice(ref.key as number, 1, this.objectReferences[ref.name]);
        } else {
          ref.obj[ref.key as string] = this.objectReferences[ref.name];
        }
      } else {
        throw new RSONParseError(
          `Object reference '${ref.name}' not found in object references`
        );
      }
    });
    return obj;
  }

  private parseValue() {
    const token = this.tokenStream.current();
    let value: any;
    switch (token.type) {
      case TokenType.LeftCurlyBracket:
        value = this.parseObject();
        break;
      case TokenType.LeftSquareBracket:
        value = this.parseArray();
        break;
      case TokenType.String:
        value = this.tokenStream.next().value;
        break;
      case TokenType.Number:
        value = Number(this.tokenStream.next().value);
        break;
      case TokenType.True:
        this.eat(TokenType.True);
        value = true;
        break;
      case TokenType.False:
        this.eat(TokenType.False);
        value = false;
        break;
      case TokenType.Null:
        this.eat(TokenType.Null);
        value = null;
        break;
      default:
        throw new RSONParseError(
          `Unexpected token ${token.value} at position ${token.startPosition}`
        );
    }

    if (this.tokenStream.hasNext()) {
      if (
        this.tokenStream.current().type === TokenType.ObjectReferenceDefinition
      ) {
        const objectReferenceName = this.tokenStream.next().value;
        if (objectReferenceName in this.objectReferences) {
          throw new RSONParseError(
            `Object reference '${objectReferenceName}' already exists`
          );
        }

        this.objectReferences[objectReferenceName] = value;
      }
    }

    return value;
  }

  private parseObject() {
    this.eat(TokenType.LeftCurlyBracket);
    const obj: Record<string, any> = {};
    while (this.tokenStream.current().type !== TokenType.RightCurlyBracket) {
      const key = this.tokenStream.next().value;
      this.eat(TokenType.Colon);

      if (this.tokenStream.current().type === TokenType.ObjectReference) {
        const ref = this.parseReference();
        if (ref instanceof Token) {
          this.lateReferences.push(
            new LateReference(obj, key, ref.value)
          );
        } else {
          obj[key] = ref;
        }
      } else {
        obj[key] = this.parseValue();
      }
      this.maybeEat(TokenType.Comma);
    }
    this.eat(TokenType.RightCurlyBracket);
    return obj;
  }

  private parseArray() {
    this.eat(TokenType.LeftSquareBracket);
    const arr: any[] = [];
    while (this.tokenStream.current().type !== TokenType.RightSquareBracket) {
      if (this.tokenStream.current().type === TokenType.ObjectReference) {
        const ref = this.parseReference();
        if (ref instanceof Token) {
          this.lateReferences.push(
            new LateReference(arr, arr.length, ref.value)
          );
        } else {
          arr.push(ref);
        }
      } else {
        arr.push(this.parseValue());
      }
      this.maybeEat(TokenType.Comma);
    }
    this.eat(TokenType.RightSquareBracket);
    return arr;
  }

  private parseReference() {
    const referenceToken = this.tokenStream.next();
    if (referenceToken.value in this.objectReferences) {
      return this.objectReferences[referenceToken.value];
    } else {
      return referenceToken;
    }
  }

  private maybeEat(tokenType: TokenType) {
    if (this.tokenStream.current().type === tokenType) {
      this.eat(tokenType);
    }
  }

  private eat(tokenType: TokenType) {
    const token = this.tokenStream.current();
    if (token.type !== tokenType) {
      throw new RSONParseError(
        `Unexpected token ${token.value} at position ${token.startPosition}`
      );
    }
    return this.tokenStream.next();
  }
}

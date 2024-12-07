import { Token } from "src/tokenizer";

export class TokenStream {
  private tokens: Token[];
  private position = 0;

  constructor(tokens: Token[]) {
    this.tokens = tokens;
  }

  current() {
    return this.tokens[this.position];
  }

  next() {
    return this.tokens[this.position++];
  }

  hasNext() {
    return this.position < this.tokens.length;
  }
}

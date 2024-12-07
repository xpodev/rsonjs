import { Parser } from "./parser";
import { StringStream } from "./stream/string";
import { stringify as rsonStringify } from "./stringify";

namespace RSON {
  export function parse(input: string): any {
    if (input === "") {
      throw new SyntaxError("Unexpected end of RSON input");
    }
    return new Parser(new StringStream(input)).parse();
  }

  export function stringify(
    input: any,
    replacer?: ReplacerFunction,
    space?: string | number
  ): string {
    return rsonStringify(input, replacer, space);
  }
}

export default RSON;

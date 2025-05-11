import * as fs from "fs";
import "../src";

const objectWithFunctions = {
  a: 1,
  b: 2,
  c: function () {
    return this.a + this.b;
  },
};

if (
  RSON.stringify(objectWithFunctions, null, 2) !==
  JSON.stringify(objectWithFunctions, null, 2)
) {
  throw new Error("Test failed: object with functions");
}

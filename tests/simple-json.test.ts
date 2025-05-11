import * as fs from "fs";
import "../src";

const obj = RSON.parse(fs.readFileSync("tests/simple.json", "utf8"));
if (RSON.stringify(obj, null, 2) !== JSON.stringify(obj, null, 2)) {
  throw new Error("RSON.stringify() does not match JSON.stringify()");
}

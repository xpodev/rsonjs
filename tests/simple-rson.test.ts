import * as fs from "fs";
import "../src";

const obj = RSON.parse(fs.readFileSync("tests/simple.rson", "utf8"));
RSON.stringify(obj, null, 2);

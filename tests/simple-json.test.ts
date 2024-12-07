import * as fs from "fs";
import "../src/index";

const obj = RSON.parse(fs.readFileSync("tests/simple.json", "utf8"));
RSON.stringify(obj, null, 2);

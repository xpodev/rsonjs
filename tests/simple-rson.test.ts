import * as fs from "fs";
import RSON from "../src/index";

const obj = RSON.parse(fs.readFileSync("tests/simple.rson", "utf8"));
RSON.stringify(obj, null, 2);

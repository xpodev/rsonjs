class ReferenceValue {
  public numberOfReferences = 0;
  public written = false;
  constructor(
    public readonly parent: any,
    public readonly key: string | number,
    public readonly name: string
  ) {}
}

class References {
  private readonly references = new Map<any, ReferenceValue>();

  public has(value: any) {
    return this.references.has(value);
  }

  public get(value: any) {
    return this.references.get(value);
  }

  public set(value: any, parent: any, key: string | number) {
    if (this.references.has(value)) {
      const ref = this.references.get(value)!;
      ref.numberOfReferences++;
    } else {
      const refName = `ref${this.references.size + 1}`;
      this.references.set(value, new ReferenceValue(parent, key, refName));
    }
  }

  public isReferenced(value: any) {
    const ref = this.references.get(value);
    return ref && ref.numberOfReferences > 0;
  }

  public clearUnused() {
    for (const [value, ref] of Array.from(this.references.entries())) {
      if (ref.numberOfReferences === 0) {
        this.references.delete(value);
      }
    }
  }

  public static readonly GLOBAL = Symbol("global");
}

function allReferencedValues(input: any, references: References) {
  if (references.isReferenced(input)) {
    return;
  }
  if (input && typeof input === "object") {
    if (Array.isArray(input)) {
      input.forEach((value, index) => {
        if (typeof value === "object") {
          references.set(value, input, index);
          allReferencedValues(value, references);
        }
      });
    } else {
      Object.entries(input).forEach(([key, value]) => {
        if (typeof value === "object") {
          references.set(value, input, key);
          allReferencedValues(value, references);
        }
      });
    }
  }
}

function _stringify(
  input: any,
  replacer: ReplacerFunction,
  space: string,
  references: References,
  indentLevel = 1
): string | undefined {
  const ref = references.get(input);
  if (ref) {
    if (ref.written) {
      return `$${ref.name}`;
    } else {
      ref.written = true;
    }
  }

  const value = replacer ? replacer("", input) : input;

  if (value === undefined || typeof value === "function") {
    return undefined;
  }

  if (typeof value === "string") {
    return `"${input}"`;
  }

  if (
    typeof value === "number" ||
    typeof value === "boolean" ||
    value === null
  ) {
    return String(value);
  }

  const spaceIndent = (level = 0) =>
    space ? "\n" + space.repeat(indentLevel + level) : "";

  if (Array.isArray(value)) {
    return (
      `[${
      spaceIndent() +
      value
        .reduce((acc, val) => {
        const stringifiedValue = _stringify(val, replacer, space, references, indentLevel + 1);
        if (stringifiedValue !== undefined) {
          acc.push(stringifiedValue);
        }
        return acc;
        }, [] as string[])
        .join("," + spaceIndent()) +
      spaceIndent(-1)
      }]` + (ref?.written ? `(${ref.name})` : "")
    );
  }

  if (typeof value === "object") {
    return (
      `{${
      spaceIndent() +
      Object.entries(value)
        .reduce((acc, [key, val]) => {
        const stringifiedValue = _stringify(val, replacer, space, references, indentLevel + 1);
        if (stringifiedValue !== undefined) {
          acc.push(`"${key}":${(space ? " " : "") + stringifiedValue}`);
        }
        return acc;
        }, [] as string[])
        .join("," + spaceIndent()) +
      spaceIndent(-1)
      }}` + (ref?.written ? `(${ref.name})` : "")
    );
  }

  return "null";
}

export function stringify(
  input: any,
  replacer?: ReplacerFunction,
  space?: string | number
): string {
  const references = new References();
  if (input && typeof input === "object") {
    references.set(input, References.GLOBAL, "root");
  }
  allReferencedValues(input, references);
  references.clearUnused();
  return _stringify(
    input,
    replacer || ((_, value) => value),
    typeof space === "number" ? " ".repeat(space) : space || "",
    references
  ) as string;
}

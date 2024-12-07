export class FilePosition {
  constructor(public line: number, public column: number) {}

  toString() {
    return `${this.line}:${this.column}`;
  }

  static copy(position: FilePosition) {
    return new FilePosition(position.line, position.column);
  }
}

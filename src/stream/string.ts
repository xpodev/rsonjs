import { IStream } from "./stream";

export class StringStream implements IStream {
  private _position = 0;
  constructor(private readonly input: string) {}

  public peek(): string {
    return this.input[this._position];
  }

  public read(count = 1): string {
    const result = this.input.slice(this._position, this._position + count);
    this._position += count;
    return result;
  }

  public eof(): boolean {
    return this._position >= this.input.length;
  }

  public get position() {
    return this._position;
  }
}

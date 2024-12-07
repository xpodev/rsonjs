export interface IStream<T = string> {
  peek(): T;
  read(count?: number): T;
  eof(): boolean;
  readonly position: number;
}

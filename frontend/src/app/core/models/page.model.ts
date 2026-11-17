// Hand-written: OpenAPI has no generics. core/api/page.type-check.ts checks it against every generated *Page schema; add a line there when the contract gains a new page schema.
export interface Page<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
  first: boolean;
  last: boolean;
}


export interface TableColumn {
  Field: string;
  Type: string;
}

export interface QueryResult {
  columns: string[];
  rows: any[];
}

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string): Promise<QueryResult>;
  getTables(): Promise<string[]>;
  getColumns(table: string): Promise<TableColumn[]>;
}

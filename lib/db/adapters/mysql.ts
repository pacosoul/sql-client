
import mysql, { Connection, FieldPacket, RowDataPacket } from 'mysql2/promise';
import { DatabaseAdapter, QueryResult, TableColumn } from '../types';

export class MySqlAdapter implements DatabaseAdapter {
  private connection: Connection | null = null;
  private connectionString: string;

  constructor(connectionString: string) {
    this.connectionString = connectionString;
  }

  async connect(): Promise<void> {
    if (!this.connection) {
      this.connection = await mysql.createConnection(this.connectionString);
    }
  }

  async disconnect(): Promise<void> {
    if (this.connection) {
      await this.connection.end();
      this.connection = null;
    }
  }

  async query(sql: string): Promise<QueryResult> {
    if (!this.connection) await this.connect();

    // @ts-ignore - connection is guaranteed by connect()
    const [rows, fields] = await this.connection.execute(sql);

    let resultRows: any = rows;
    let resultColumns: string[] = [];

    if (Array.isArray(rows)) {
      // It's a SELECT or similar returning rows
      resultColumns = fields ? fields.map((field: FieldPacket) => field.name) : [];
    } else {
      // It's a ResultSetHeader (INSERT, UPDATE, DELETE)
      resultColumns = ['Message'];
      resultRows = [{ Message: `Success. Affected Rows: ${(rows as any).affectedRows}` }];
    }

    return { columns: resultColumns as string[], rows: resultRows as any[] };
  }

  async getTables(): Promise<string[]> {
    if (!this.connection) await this.connect();
    // @ts-ignore
    const [rows] = await this.connection.execute('SHOW TABLES');
    return (rows as RowDataPacket[]).map(row => Object.values(row)[0] as string);
  }

  async getColumns(table: string): Promise<TableColumn[]> {
    if (!this.connection) await this.connect();

    // Strict validation to prevent injection since we can't easily paramaterize identifier in SHOW COLUMNS
    if (!/^[a-zA-Z0-9_]+$/.test(table)) {
      throw new Error('Invalid table name');
    }

    // @ts-ignore
    const [rows] = await this.connection.execute(`SHOW COLUMNS FROM \`${table}\``);
    return (rows as RowDataPacket[]).map((row: any) => ({
      Field: row.Field,
      Type: row.Type
    }));
  }
}

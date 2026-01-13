
import { Client } from 'pg';
import { DatabaseAdapter, QueryResult, TableColumn } from '../types';

export class PostgresAdapter implements DatabaseAdapter {
  private client: Client;

  constructor(connectionString: string) {
    this.client = new Client({
      connectionString,
    });
  }

  async connect(): Promise<void> {
    await this.client.connect();
  }

  async disconnect(): Promise<void> {
    await this.client.end();
  }

  async query(sql: string): Promise<QueryResult> {
    const res = await this.client.query(sql);
    const columns = res.fields.map(f => f.name);
    // pg returns rows as objects keyed by column name, which matches our expectation
    return { columns, rows: res.rows };
  }

  async getTables(): Promise<string[]> {
    const sql = `
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_type = 'BASE TABLE';
    `;
    const res = await this.client.query(sql);
    return res.rows.map(row => row.table_name);
  }

  async getColumns(table: string): Promise<TableColumn[]> {
    const sql = `
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      AND table_name = $1;
    `;
    const res = await this.client.query(sql, [table]);
    return res.rows.map(row => ({
      Field: row.column_name,
      Type: row.data_type
    }));
  }
}

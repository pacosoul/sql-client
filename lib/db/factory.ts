
import { DatabaseAdapter } from './types';
import { MySqlAdapter } from './adapters/mysql';
import { PostgresAdapter } from './adapters/postgresql';

export type DatabaseType = 'mysql' | 'postgres';

export function getDatabaseAdapter(type: DatabaseType, connectionString: string): DatabaseAdapter {
  switch (type) {
    case 'mysql':
      return new MySqlAdapter(connectionString);
    case 'postgres':
      return new PostgresAdapter(connectionString);
    default:
      throw new Error(`Unsupported database type: ${type}`);
  }
}

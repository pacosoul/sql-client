
import { NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/db/factory';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');

    // Get connection details from headers
    const connectionString = request.headers.get('x-connection-string');
    const dbType = request.headers.get('x-db-type') as 'mysql' | 'postgres' || 'mysql';

    if (!connectionString && !process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database connection string not configured' },
        { status: 500 }
      );
    }

    const finalConnectionString = connectionString || process.env.DATABASE_URL!;
    const db = getDatabaseAdapter(dbType, finalConnectionString);

    try {
      await db.connect();

      if (tableName) {
        const columns = await db.getColumns(tableName);
        return NextResponse.json(columns);
      } else {
        const tables = await db.getTables();
        return NextResponse.json(tables);
      }
    } finally {
      await db.disconnect();
    }

  } catch (error: any) {
    console.error('Schema Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schema' },
      { status: 500 }
    );
  }
}

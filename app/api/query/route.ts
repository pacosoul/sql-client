
import { NextResponse } from 'next/server';
import { getDatabaseAdapter } from '@/lib/db/factory';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

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
      const result = await db.query(query);
      return NextResponse.json(result);
    } finally {
      await db.disconnect();
    }

  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute query' },
      { status: 500 }
    );
  }
}

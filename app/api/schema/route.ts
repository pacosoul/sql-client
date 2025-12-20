
import { NextResponse } from 'next/server';
import mysql, { RowDataPacket } from 'mysql2/promise';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get('table');

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database connection string not configured' },
        { status: 500 }
      );
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
      if (tableName) {
        // Safe parameter interpolation for table name is tricky in some drivers, 
        // but 'mysql2' doesn't support identifiers in prepared statements well for all cases.
        // We validatethe table name to strictly alphanumeric/underscore to prevent injection.
        if (!/^[a-zA-Z0-9_]+$/.test(tableName)) {
          return NextResponse.json({ error: 'Invalid table name' }, { status: 400 });
        }

        const [rows] = await connection.execute(`SHOW COLUMNS FROM \`${tableName}\``);
        return NextResponse.json(rows);
      } else {
        const [rows] = await connection.execute('SHOW TABLES');
        // valid for MySQL, the key depends on db name usually, but Object.values gets the table name safely
        const tables = (rows as RowDataPacket[]).map(row => Object.values(row)[0]);
        return NextResponse.json(tables);
      }
    } finally {
      await connection.end();
    }

  } catch (error: any) {
    console.error('Schema Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to fetch schema' },
      { status: 500 }
    );
  }
}

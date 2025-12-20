
import { NextResponse } from 'next/server';
import mysql, { FieldPacket } from 'mysql2/promise';

export async function POST(request: Request) {
  try {
    const { query } = await request.json();

    if (!process.env.DATABASE_URL) {
      return NextResponse.json(
        { error: 'Database connection string not configured' },
        { status: 500 }
      );
    }

    const connection = await mysql.createConnection(process.env.DATABASE_URL);

    try {
      const [rows, fields] = await connection.execute(query);

      // Extract column names from metadata
      // fields is undefined for queries that don't return partials (like INSERT/UPDATE sometimes depending on driver version, but for SELECT it exists)
      // For mysql2 execute, fields is present for SELECT
      const columns = fields ? fields.map((field: FieldPacket) => field.name) : [];

      // If no columns (e.g. INSERT), maybe return affectedRows? 
      // For now, let's assume SELECT for visualization or just return empty columns.
      // If rows is not an array (e.g. ResultSetHeader for INSERT), we handle it.
      let resultRows: any = rows;
      let resultColumns = columns;

      if (!Array.isArray(rows)) {
        // It's a ResultSetHeader (INSERT, UPDATE, DELETE)
        resultColumns = ['Message'];
        resultRows = [{ Message: `Success. Affected Rows: ${(rows as any).affectedRows}` }];
      }

      return NextResponse.json({ columns: resultColumns, rows: resultRows });
    } finally {
      await connection.end();
    }

  } catch (error: any) {
    console.error('Database Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to execute query' },
      { status: 500 }
    );
  }
}

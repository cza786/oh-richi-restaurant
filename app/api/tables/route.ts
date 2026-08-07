import { NextResponse } from 'next/server';
import db from '@/lib/db';

// GET all tables
export async function GET() {
  try {
    const tables = await db.restaurantTable.findMany({
      orderBy: {
        tableNumber: 'asc',
      },
    });
    return NextResponse.json(tables);
  } catch (error: any) {
    console.error('Fetch tables error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// POST create table
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { tableNumber, seatingCapacity } = body;

    if (!tableNumber) {
      return NextResponse.json({ error: 'Table number is required.' }, { status: 400 });
    }

    const location = await db.restaurantLocation.findFirst();
    if (!location) {
      return NextResponse.json({ error: 'No restaurant locations exist.' }, { status: 400 });
    }

    const newTable = await db.restaurantTable.create({
      data: {
        locationId: location.id,
        tableNumber,
        seatingCapacity: Number(seatingCapacity) || 2,
        status: 'AVAILABLE',
      },
    });

    return NextResponse.json(newTable);
  } catch (error: any) {
    console.error('Create table error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

// PUT edit table (update status or capacity)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { id, status, tableNumber, seatingCapacity } = body;

    if (!id) {
      return NextResponse.json({ error: 'Table ID is required.' }, { status: 400 });
    }

    const dataToUpdate: any = {};
    if (status !== undefined) dataToUpdate.status = status;
    if (tableNumber !== undefined) dataToUpdate.tableNumber = tableNumber;
    if (seatingCapacity !== undefined) dataToUpdate.seatingCapacity = Number(seatingCapacity);

    const updatedTable = await db.restaurantTable.update({
      where: { id },
      data: dataToUpdate,
    });

    return NextResponse.json(updatedTable);
  } catch (error: any) {
    console.error('Update table error:', error);
    return NextResponse.json({ error: 'Internal server error.' }, { status: 500 });
  }
}

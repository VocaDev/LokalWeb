import { NextRequest, NextResponse } from 'next/server';
import { ServiceRepository } from '@lab-crud/repositories/ServiceRepository';
import { ServiceService } from '@lab-crud/services/ServiceService';

/**
 * API Route: /api/lab-services/[id]
 *
 * PUT    — Update an existing service
 * DELETE — Delete a service by ID
 *
 * Data flow: API Route → ServiceService → ServiceRepository → CSV file
 */

function createService() {
  const repo = new ServiceRepository();
  return new ServiceService(repo);
}

// PUT /api/lab-services/:id
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const service = createService();

    const updatedService = {
      id,
      name: body.name,
      description: body.description ?? '',
      price: Number(body.price),
      durationMinutes: Number(body.durationMinutes),
    };

    service.update(updatedService);
    return NextResponse.json(updatedService);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('not found')
      ? 404
      : message.startsWith('Validation')
        ? 400
        : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

// DELETE /api/lab-services/:id
export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const service = createService();
    service.delete(id);
    return NextResponse.json({ success: true });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.includes('not found') ? 404 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

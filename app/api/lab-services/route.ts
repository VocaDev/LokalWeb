import { NextRequest, NextResponse } from 'next/server';
import { ServiceRepository } from '@lab-crud/repositories/ServiceRepository';
import { ServiceService } from '@lab-crud/services/ServiceService';

/**
 * API Route: /api/lab-services
 *
 * GET  — List all services (optional ?filter=... query param)
 * POST — Add a new service
 *
 * Data flow: API Route → ServiceService → ServiceRepository → CSV file
 */

function createService() {
  const repo = new ServiceRepository();
  return new ServiceService(repo);
}

// GET /api/lab-services?filter=haircut
export async function GET(request: NextRequest) {
  try {
    const service = createService();
    const filter = request.nextUrl.searchParams.get('filter') ?? undefined;
    const services = service.list(filter);
    return NextResponse.json(services);
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

// POST /api/lab-services
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const service = createService();

    const newService = {
      id: body.id ?? String(Date.now()),
      name: body.name,
      description: body.description ?? '',
      price: Number(body.price),
      durationMinutes: Number(body.durationMinutes),
    };

    service.add(newService);
    return NextResponse.json(newService, { status: 201 });
  } catch (error: unknown) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message.startsWith('Validation') ? 400 : 500;
    return NextResponse.json({ error: message }, { status });
  }
}

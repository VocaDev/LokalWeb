import { Service } from '../models/Service';
import { ServiceRepository } from '../repositories/ServiceRepository';

/**
 * ServiceService — Business Logic Layer
 *
 * Sits between the UI/API and the Repository.
 * Receives the repository via constructor injection (Dependency Injection).
 *
 * Responsibilities:
 *  - Input validation (name not empty, price > 0)
 *  - Filtering logic
 *  - Delegates persistence to ServiceRepository
 */
export class ServiceService {
  constructor(private repo: ServiceRepository) {}

  /**
   * List all services, optionally filtered by name (case-insensitive substring match).
   */
  list(filter?: string): Service[] {
    const all = this.repo.getAll();
    if (!filter || filter.trim() === '') {
      return all;
    }
    const lowerFilter = filter.toLowerCase();
    return all.filter((s) => s.name.toLowerCase().includes(lowerFilter));
  }

  /**
   * Get a single service by ID.
   */
  getById(id: string): Service | null {
    return this.repo.getById(id);
  }

  /**
   * Add a new service.
   * Validates:
   *  - name must not be empty
   *  - price must be > 0
   */
  add(service: Service): void {
    this.validate(service);
    this.repo.add(service);
  }

  /**
   * Update an existing service.
   * Validates the same rules as add().
   */
  update(service: Service): void {
    this.validate(service);
    this.repo.update(service);
  }

  /**
   * Delete a service by ID.
   */
  delete(id: string): void {
    this.repo.delete(id);
  }

  // ── Private ──

  private validate(service: Service): void {
    if (!service.name || service.name.trim() === '') {
      throw new Error('Validation failed: name must not be empty');
    }
    if (service.price <= 0) {
      throw new Error('Validation failed: price must be greater than 0');
    }
  }
}

import fs from 'fs';
import path from 'path';
import { Service } from '../models/Service';

/**
 * ServiceRepository — File-based Repository (CSV)
 *
 * Implements the Repository Pattern using the Node.js `fs` module.
 * All data is persisted to a CSV file. No database, no Supabase.
 *
 * Methods: getAll, getById, add, update, delete, save
 */
export class ServiceRepository {
  private filePath: string;

  constructor(filePath?: string) {
    this.filePath = filePath ?? path.join(process.cwd(), 'lab-crud', 'data', 'services.csv');
  }

  // ── Read ──

  /**
   * GetAll — reads the CSV file and returns all services as an array.
   */
  getAll(): Service[] {
    const content = fs.readFileSync(this.filePath, 'utf-8');
    const lines = content.trim().split('\n');

    // First line is the header row — skip it
    const dataLines = lines.slice(1);

    return dataLines
      .filter((line) => line.trim() !== '')
      .map((line) => this.parseLine(line));
  }

  /**
   * GetById — finds a single service by its ID.
   */
  getById(id: string): Service | null {
    const all = this.getAll();
    return all.find((s) => s.id === id) ?? null;
  }

  // ── Write ──

  /**
   * Add — appends a new service to the CSV file.
   */
  add(service: Service): void {
    const all = this.getAll();
    all.push(service);
    this.save(all);
  }

  /**
   * Update — replaces an existing service (matched by ID).
   * Throws if the service is not found.
   */
  update(service: Service): void {
    const all = this.getAll();
    const index = all.findIndex((s) => s.id === service.id);
    if (index === -1) {
      throw new Error(`Service with id "${service.id}" not found`);
    }
    all[index] = service;
    this.save(all);
  }

  /**
   * Delete — removes a service by ID.
   * Throws if the service is not found.
   */
  delete(id: string): void {
    const all = this.getAll();
    const index = all.findIndex((s) => s.id === id);
    if (index === -1) {
      throw new Error(`Service with id "${id}" not found`);
    }
    this.save(all.filter((s) => s.id !== id));
  }

  /**
   * Save — writes the entire services array to the CSV file.
   * Overwrites the file with headers + all records.
   */
  save(services: Service[]): void {
    const header = 'id,name,description,price,durationMinutes';
    const rows = services.map(
      (s) => `${s.id},${this.escapeCsv(s.name)},${this.escapeCsv(s.description)},${s.price},${s.durationMinutes}`
    );
    const content = [header, ...rows].join('\n') + '\n';
    fs.writeFileSync(this.filePath, content, 'utf-8');
  }

  // ── Private helpers ──

  private parseLine(line: string): Service {
    const parts = this.splitCsvLine(line);
    return {
      id: parts[0],
      name: parts[1],
      description: parts[2],
      price: parseFloat(parts[3]),
      durationMinutes: parseInt(parts[4], 10),
    };
  }

  /**
   * Splits a CSV line respecting quoted fields (handles commas inside quotes).
   */
  private splitCsvLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      if (char === '"') {
        inQuotes = !inQuotes;
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Escapes a field for CSV output — wraps in quotes if it contains commas.
   */
  private escapeCsv(value: string): string {
    if (value.includes(',') || value.includes('"')) {
      return `"${value.replace(/"/g, '""')}"`;
    }
    return value;
  }
}

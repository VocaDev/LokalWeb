/**
 * Service Model — Academic CRUD Module
 *
 * Independent data model used exclusively by the lab-crud module.
 * This has NO connection to the Supabase-based Service type in src/lib/types.ts.
 */
export interface Service {
  id: string;
  name: string;
  description: string;
  price: number;
  durationMinutes: number;
}

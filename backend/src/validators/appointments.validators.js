// src/validators/appointments.validators.js
import { z } from "zod";

// Expect ISO 8601 datetime strings, e.g., "2025-10-20T10:00:00"
export const createAppointmentSchema = z.object({
  patient_id: z.coerce.number().int().positive(),
  provider_name: z.string().min(1),
  start_time: z.string().datetime(),
  end_time: z.string().datetime(),
  status: z.enum(["scheduled","checked-in","completed","canceled","no-show"]).optional(),
  reason: z.string().optional(),
  notes: z.string().optional(),
});

export const listAppointmentsSchema = z.object({
  from: z.string().datetime().optional(),
  to: z.string().datetime().optional(),
  status: z.string().optional(),
  provider: z.string().optional(),
  patient_id: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().min(1).max(200).optional(),
  page: z.coerce.number().min(1).optional(),
});

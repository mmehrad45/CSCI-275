import { z } from "zod";

/**
 * Patient creation schema.
 * - names: min length 2
 * - dob: required (string from <input type="date">)
 * - phone: optional, but if provided must be 10 digits
 * - notes: optional, capped length
 */
export const patientSchema = z.object({
  firstName: z.string().min(2, "First name must be at least 2 characters."),
  lastName: z.string().min(2, "Last name must be at least 2 characters."),
  dob: z.string().nonempty("Date of birth is required. If unknow, put 1900-01-01."),
   healthNumber: z
    .string()
    .regex(/^9\d{9}$/, "Health number must be 10 digits starting with 9.")
    .optional()
    .or(z.literal("").transform(() => undefined)),

  phone: z
    .string()
    .regex(/^\d{10}$/, "Phone number must be 10 digits.")
    .optional()
    .or(z.literal("").transform(() => undefined)), // allow empty → undefined
  notes: z.string().max(200, "Notes can’t exceed 200 characters.").optional(),
});

export type PatientFormInput = z.infer<typeof patientSchema>;
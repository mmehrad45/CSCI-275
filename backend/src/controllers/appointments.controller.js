// src/controllers/appointments.controller.js
import {
  createAppointmentSchema,
  listAppointmentsSchema,
} from "../validators/appointments.validators.js";
import { createAppointment, listAppointments } from "../services/appointments.service.js";

export async function postAppointment(req, res) {
  try {
    const parsed = createAppointmentSchema.parse(req.body);
    const appt = await createAppointment(parsed);
    res.status(201).json({ ok: true, data: appt });
  } catch (err) {
    console.error(err);
    res.status(err.status || 400).json({ ok: false, error: err.message || "Invalid request" });
  }
}

export async function getAppointments(req, res) {
  try {
    const parsed = listAppointmentsSchema.parse(req.query);
    const result = await listAppointments(parsed);
    res.json({ ok: true, ...result });
  } catch (err) {
    console.error(err);
    res.status(400).json({ ok: false, error: err.message || "Invalid query" });
  }
}

/**
 * StatusChangeLogger
 *
 * Utility that logs an incident status change by calling the incidents API.
 * Adapted from bfpacs_update — replaces base44.entities.IncidentStatusLog with our own API.
 *
 * Since our backend doesn't have a separate IncidentStatusLog table, status changes
 * are tracked inline when we call incidentsApi.updateStatus().
 */

import { incidentsApi } from "@/api/incidents/incidents";

/**
 * Log a status transition for an incident.
 * This updates the incident record in our backend.
 *
 * @param {object} incident - the current incident object
 * @param {string} newStatus - the new incident_status value
 */
export async function logStatusChange(incident, newStatus) {
  try {
    const payload = { incident_status: newStatus };

    // Automatically set timestamps based on status
    if (newStatus === "Controlled") {
      payload.controlled_at = new Date().toISOString();
    }
    if (newStatus === "Fire Out") {
      payload.fire_out_at = new Date().toISOString();
    }

    await incidentsApi.updateStatus(incident.id, payload);
  } catch (error) {
    console.error("Failed to log status change:", error);
  }
}

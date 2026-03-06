import { base44 } from "@/api/base44Client";

export async function logStatusChange(incident, newStatus) {
  try {
    await base44.entities.IncidentStatusLog.create({
      incident_id: incident.id,
      status: newStatus,
      alarm_status: incident.alarm_status || null,
      ground_commander: incident.ground_commander || null,
      ics_commander: incident.ics_commander || null,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Failed to log status change:", error);
  }
}
import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user || (user.role !== 'admin' && user.role !== 'superadmin')) {
      return Response.json({ error: 'Unauthorized' }, { status: 403 });
    }

    const { incident_id, fire_station_id } = await req.json();

    if (!incident_id || !fire_station_id) {
      return Response.json({ error: 'Missing incident_id or fire_station_id' }, { status: 400 });
    }

    // Fetch all on-duty personnel from the fire station
    const personnel = await base44.asServiceRole.entities.Personnel.filter({
      fire_station_id: fire_station_id,
      duty_status: 'On Duty',
      station_user_id: user.id
    });

    // Fetch all serviceable equipment from the fire station
    const equipment = await base44.asServiceRole.entities.LogisticalEquipment.filter({
      fire_station_id: fire_station_id,
      status: 'Serviceable'
    });

    // Create check-in records for all personnel
    const checkInRecords = [];
    for (const person of personnel) {
      // Check if already checked in to this incident
      const existing = await base44.asServiceRole.entities.IncidentCheckIn.filter({
        incident_id: incident_id,
        personnel_id: person.id,
        status: 'Checked In'
      });

      if (existing.length === 0) {
        const checkIn = await base44.asServiceRole.entities.IncidentCheckIn.create({
          personnel_id: person.id,
          incident_id: incident_id,
          check_in_time: new Date().toISOString(),
          status: 'Checked In'
        });
        checkInRecords.push(checkIn);
      }
    }

    return Response.json({
      success: true,
      personnel_checked_in: checkInRecords.length,
      total_personnel: personnel.length,
      equipment_available: equipment.length,
      message: `Checked in ${checkInRecords.length} personnel and ${equipment.length} equipment items from station`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
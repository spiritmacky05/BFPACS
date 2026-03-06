import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';
import { jsPDF } from 'npm:jspdf@4.0.0';
import { format } from 'npm:date-fns@3.6.0';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (!user) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { incidentId } = await req.json();

    if (!incidentId) {
      return Response.json({ error: 'Missing incidentId' }, { status: 400 });
    }

    // Fetch incident data
    const incident = await base44.entities.Incident.filter({ id: incidentId });
    if (!incident || incident.length === 0) {
      return Response.json({ error: 'Incident not found' }, { status: 404 });
    }

    const incidentData = incident[0];

    // Fetch all check-ins for this incident
    const checkIns = await base44.entities.IncidentCheckIn.filter({ incident_id: incidentId });

    // Fetch all personnel IDs from check-ins
    const personnelIds = [...new Set(checkIns.map(c => c.personnel_id))];
    const personnel = await base44.entities.Personnel.filter({});
    const personnelMap = personnel.reduce((map, p) => {
      map[p.id] = p;
      return map;
    }, {});

    // Fetch trucks data
    const trucks = await base44.entities.FireTruck.filter({});
    const trucksMap = trucks.reduce((map, t) => {
      map[t.id] = t;
      return map;
    }, {});

    // Generate report data
    const reportData = generateReportData(incidentData, checkIns, personnelMap, trucksMap);

    // Create PDF
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    });

    // Add header
    pdf.setFontSize(16);
    pdf.setTextColor(220, 38, 38);
    pdf.text('FIRE INCIDENT PRELIMINARY REPORT', 105, 15, { align: 'center' });

    pdf.setFontSize(10);
    pdf.setTextColor(100, 100, 100);
    pdf.text(`Report Generated: ${format(new Date(), 'MMM dd, yyyy HH:mm')}`, 105, 22, { align: 'center' });

    let yPos = 32;

    // Incident Overview Section
    pdf.setFontSize(11);
    pdf.setTextColor(50, 50, 50);
    pdf.text('INCIDENT OVERVIEW', 20, yPos);
    yPos += 8;

    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    const incidentDetails = [
      `Incident Code: ${incidentData.incident_code || 'N/A'}`,
      `Type: ${incidentData.incident_type || 'N/A'}`,
      `Location: ${incidentData.location_address || 'N/A'}`,
      `Alarm Level: ${incidentData.alarm_level || 'N/A'}`,
      `Status: ${incidentData.status || 'N/A'}`,
      `Reported: ${incidentData.reported_at ? format(new Date(incidentData.reported_at), 'MMM dd, yyyy HH:mm') : 'N/A'}`,
      `Ground Commander: ${incidentData.ground_commander || 'N/A'}`,
      `Occupancy Type: ${incidentData.type_of_occupancy || 'N/A'}`
    ];

    incidentDetails.forEach(detail => {
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(detail, 25, yPos);
      yPos += 6;
    });

    // Personnel Summary Section
    yPos += 4;
    pdf.setFontSize(11);
    pdf.setTextColor(50, 50, 50);
    pdf.text('PERSONNEL SUMMARY', 20, yPos);
    yPos += 8;

    pdf.setFontSize(9);
    pdf.setTextColor(80, 80, 80);
    pdf.text(`Total Personnel: ${reportData.totalPersonnel}`, 25, yPos);
    yPos += 6;
    pdf.text(`By Type:`, 25, yPos);
    yPos += 4;

    Object.entries(reportData.personnelByType).forEach(([type, count]) => {
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.text(`  • ${type}: ${count}`, 30, yPos);
      yPos += 4;
    });

    // Check-in Timeline Section
    yPos += 4;
    pdf.setFontSize(11);
    pdf.setTextColor(50, 50, 50);
    pdf.text('CHECK-IN/CHECK-OUT TIMELINE', 20, yPos);
    yPos += 8;

    pdf.setFontSize(8);
    pdf.setTextColor(80, 80, 80);

    const sortedCheckIns = checkIns.sort((a, b) => new Date(a.check_in_time) - new Date(b.check_in_time));

    sortedCheckIns.forEach(checkIn => {
      if (yPos > 270) {
        pdf.addPage();
        yPos = 20;
      }

      const personnel = personnelMap[checkIn.personnel_id];
      const checkInTime = format(new Date(checkIn.check_in_time), 'HH:mm');
      const checkOutTime = checkIn.check_out_time ? format(new Date(checkIn.check_out_time), 'HH:mm') : 'STILL ON SCENE';
      const status = checkIn.status || 'Checked In';

      const timelineText = `${checkInTime} - ${checkOutTime} | ${personnel?.full_name || 'Unknown'} (${personnel?.rank || 'N/A'})`;
      pdf.text(timelineText, 25, yPos);
      yPos += 4;
    });

    // Casualties Section (if any)
    if (incidentData.injured || incidentData.rescued) {
      yPos += 4;
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);
      pdf.text('INCIDENT IMPACT', 20, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      if (incidentData.injured) {
        pdf.text(`Injured: ${incidentData.injured}`, 25, yPos);
        yPos += 6;
      }
      if (incidentData.rescued) {
        pdf.text(`Rescued: ${incidentData.rescued}`, 25, yPos);
        yPos += 6;
      }
    }

    // Notes Section
    if (incidentData.notes) {
      yPos += 4;
      pdf.setFontSize(11);
      pdf.setTextColor(50, 50, 50);
      pdf.text('NOTES', 20, yPos);
      yPos += 8;

      pdf.setFontSize(9);
      pdf.setTextColor(80, 80, 80);
      const splitNotes = pdf.splitTextToSize(incidentData.notes, 160);
      splitNotes.forEach(line => {
        if (yPos > 270) {
          pdf.addPage();
          yPos = 20;
        }
        pdf.text(line, 25, yPos);
        yPos += 4;
      });
    }

    // Footer
    pdf.setFontSize(8);
    pdf.setTextColor(150, 150, 150);
    pdf.text('This is a preliminary report and should be reviewed by authorized personnel.', 105, 285, { align: 'center' });

    const pdfBytes = pdf.output('arraybuffer');

    return new Response(pdfBytes, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename=incident_${incidentData.incident_code || 'report'}.pdf`
      }
    });
  } catch (error) {
    console.error('Error generating report:', error);
    return Response.json({ error: error.message }, { status: 500 });
  }
});

function generateReportData(incident, checkIns, personnelMap, trucksMap) {
  const personnel = checkIns
    .map(c => personnelMap[c.personnel_id])
    .filter(p => p)
    .reduce((unique, p) => {
      if (!unique.find(x => x.id === p.id)) {
        unique.push(p);
      }
      return unique;
    }, []);

  const personnelByType = {};
  personnel.forEach(p => {
    const type = p.personnel_type || 'Unknown';
    personnelByType[type] = (personnelByType[type] || 0) + 1;
  });

  return {
    totalPersonnel: personnel.length,
    personnelByType,
    checkInCount: checkIns.filter(c => c.status === 'Checked In').length,
    checkOutCount: checkIns.filter(c => c.status === 'Checked Out').length
  };
}
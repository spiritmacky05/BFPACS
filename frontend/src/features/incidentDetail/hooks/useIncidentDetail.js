/**
 * features/incidentDetail/hooks/useIncidentDetail.js
 *
 * Container hook for Incident Detail page.
 *
 * Responsibilities:
 * - Fetch incident data.
 * - Manage page-level UI state (modals, tabs, confirmations).
 * - Trigger status workflows.
 * - Provide printable HTML content for export.
 */

import { useEffect, useMemo, useRef, useState } from 'react';
import { format, isValid } from 'date-fns';
import { useSearchParams } from 'react-router-dom';
import { useAuth } from '@/features/auth';
import { useMyStation } from '@/features/stations';
import { incidentDetailApi } from '../api/incidentDetail.api';
import {
  applyIncidentDetailStatusWorkflow,
  INCIDENT_DETAIL_STATUS,
} from '../services/incidentDetailStatusWorkflow.service';

const TAB_IDS = {
  OVERVIEW: 'overview',
  PERSONNEL: 'personnel',
  FLEET: 'fleet',
  EQUIPMENT: 'equipment',
  HISTORY: 'history',
};

const STATUS_COLORS = {
  Active: 'text-red-400 bg-red-600/10 border-red-600/30',
  Controlled: 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30',
  'Fire Out': 'text-blue-400 bg-blue-600/10 border-blue-600/30',
  Done: 'text-gray-400 bg-gray-600/10 border-gray-600/30',
};

const BADGE_CLASS_BY_STATUS = {
  Active: 'badge-active',
  Controlled: 'badge-controlled',
  'Fire Out': 'badge-fireout',
  Done: 'badge-done',
};

const safeFormat = (date, formatStr) => {
  if (!date) return '—';
  const d = new Date(date);
  if (!isValid(d)) return '—';
  return format(d, formatStr);
};

/**
 * Create printable HTML payload from incident model.
 */
function buildPrintableContent(incident) {
  if (!incident) return '';

  const badgeClass = BADGE_CLASS_BY_STATUS[incident.incident_status] || 'badge-active';

  return `
    <div class="section">
      <div class="section-title">Incident Information</div>
      <div class="row"><span class="row-label">Incident ID</span><span class="row-value">${incident.id?.slice(0, 8) || '—'}</span></div>
      <div class="row"><span class="row-label">Status</span><span class="row-value"><span class="badge ${badgeClass}">${incident.incident_status || '—'}</span></span></div>
      <div class="row"><span class="row-label">Alarm Status</span><span class="row-value">${incident.alarm_status || '—'}</span></div>
      <div class="row"><span class="row-label">Date & Time Reported</span><span class="row-value">${safeFormat(incident.date_time_reported, 'MMMM d, yyyy h:mm a')}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Location</div>
      <div class="row"><span class="row-label">Address</span><span class="row-value">${incident.location_text || '—'}</span></div>
      ${incident.occupancy_type ? `<div class="row"><span class="row-label">Type of Occupancy</span><span class="row-value">${incident.occupancy_type}</span></div>` : ''}
    </div>
    <div class="section">
      <div class="section-title">Command</div>
      <div class="row"><span class="row-label">Ground Commander</span><span class="row-value">${incident.ground_commander || '—'}</span></div>
      <div class="row"><span class="row-label">ICS Commander</span><span class="row-value">${incident.ics_commander || '—'}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Casualties</div>
      <div class="row"><span class="row-label">Injured</span><span class="row-value">${incident.total_injured ?? '—'}</span></div>
      <div class="row"><span class="row-label">Rescued</span><span class="row-value">${incident.total_rescued ?? '—'}</span></div>
    </div>
    <div class="section">
      <div class="section-title">Status History</div>
      ${(incident.status_history || []).map(log => `
        <div class="row" style="font-size: 11px;">
          <span class="row-label" style="width: 120px;">${safeFormat(log.timestamp, 'MMM d, HH:mm')}</span>
          <span class="row-value">${log.status}</span>
        </div>
      `).join('') || '<div class="row"><span class="row-value">No history recorded.</span></div>'}
    </div>
  `;
}

export function useIncidentDetail() {
  const [searchParams] = useSearchParams();
  const incidentId = searchParams.get('id');

  const { role } = useAuth();
  const myStation = useMyStation();

  const isAdmin = role === 'admin' || role === 'superadmin';

  const [incident, setIncident] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAcsPortalOpen, setIsAcsPortalOpen] = useState(false);
  const [checkInVersion, setCheckInVersion] = useState(0);
  const [activeTabId, setActiveTabId] = useState(TAB_IDS.OVERVIEW);
  const [pendingAction, setPendingAction] = useState(null);

  const printContainerRef = useRef(null);
  const overviewRef = useRef(null);
  const personnelRef = useRef(null);
  const fleetRef = useRef(null);
  const equipmentRef = useRef(null);
  const historyRef = useRef(null);

  const tabs = useMemo(
    () => [
      { id: TAB_IDS.OVERVIEW, label: 'Overview', ref: overviewRef },
      { id: TAB_IDS.PERSONNEL, label: 'Personnel', ref: personnelRef },
      { id: TAB_IDS.FLEET, label: 'Fleet', ref: fleetRef },
      { id: TAB_IDS.EQUIPMENT, label: 'Equipment', ref: equipmentRef },
      { id: TAB_IDS.HISTORY, label: 'History', ref: historyRef },
    ],
    []
  );

  async function loadIncident() {
    if (!incidentId) {
      setIncident(null);
      setIsLoading(false);
      return;
    }

    try {
      const [data, history] = await Promise.all([
        incidentDetailApi.getById(incidentId),
        incidentDetailApi.getHistory(incidentId).catch(() => []),
      ]);
      if (data) {
        data.status_history = Array.isArray(history) ? history : [];
      }
      setIncident(data || null);
    } catch {
      setIncident(null);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    setIsLoading(true);
    loadIncident();
  }, [incidentId]);

  function requestStatusChange(nextStatus) {
    if (!incident) return;

    const copyByStatus = {
      [INCIDENT_DETAIL_STATUS.FIRE_OUT]: {
        title: 'Mark as Fire Out',
        message:
          'This will set the incident status to Fire Out and automatically check out all ACS personnel. Continue?',
        confirmText: 'Fire Out',
        isDangerous: false,
      },
      [INCIDENT_DETAIL_STATUS.CONTROLLED]: {
        title: 'Mark as Controlled',
        message: 'This will update the incident status to Controlled. Continue?',
        confirmText: 'Mark Controlled',
        isDangerous: false,
      },
      [INCIDENT_DETAIL_STATUS.DONE]: {
        title: 'Close Incident',
        message:
          'Are you sure you want to close this incident? This will move it to the archive.',
        confirmText: 'Close Incident',
        isDangerous: true,
      },
    };

    setPendingAction({
      ...copyByStatus[nextStatus],
      onConfirm: async () => {
        try {
          await applyIncidentDetailStatusWorkflow({ incidentId, nextStatus });
        } finally {
          setPendingAction(null);
          await loadIncident();
        }
      },
    });
  }

  function cancelPendingAction() {
    setPendingAction(null);
  }

  function scrollToSection(tabId, sectionRef) {
    setActiveTabId(tabId);
    sectionRef?.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function printIncidentReport() {
    const printContent = printContainerRef.current?.innerHTML;
    const popupWindow = window.open('', '_blank');

    if (!popupWindow) return;

    popupWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Incident Report — ${incident?.id?.slice(0, 8) || ''}</title>
          <style>
            * { margin: 0; padding: 0; box-sizing: border-box; }
            body { font-family: Arial, sans-serif; color: #111; background: #fff; padding: 32px; }
            .header { display: flex; align-items: center; gap: 16px; border-bottom: 2px solid #dc2626; padding-bottom: 16px; margin-bottom: 24px; }
            .header-text h1 { font-size: 18px; font-weight: 700; color: #dc2626; }
            .header-text p { font-size: 12px; color: #555; margin-top: 2px; }
            .badge { display: inline-block; padding: 2px 10px; border-radius: 4px; font-size: 11px; font-weight: 600; border: 1px solid; }
            .badge-active { color: #dc2626; border-color: #dc262660; background: #dc262610; }
            .badge-controlled { color: #ca8a04; border-color: #ca8a0460; background: #ca8a0410; }
            .badge-fireout { color: #2563eb; border-color: #2563eb60; background: #2563eb10; }
            .badge-done { color: #6b7280; border-color: #6b728060; background: #6b728010; }
            .section { margin-bottom: 20px; }
            .section-title { font-size: 11px; text-transform: uppercase; letter-spacing: 2px; color: #dc2626; font-weight: 700; border-bottom: 1px solid #eee; padding-bottom: 6px; margin-bottom: 12px; }
            .row { display: flex; gap: 8px; padding: 6px 0; border-bottom: 1px solid #f3f3f3; }
            .row:last-child { border-bottom: none; }
            .row-label { color: #888; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; width: 180px; flex-shrink: 0; padding-top: 1px; }
            .row-value { font-size: 13px; color: #111; }
            .footer { margin-top: 40px; border-top: 1px solid #ddd; padding-top: 12px; font-size: 10px; color: #999; display: flex; justify-content: space-between; }
          </style>
        </head>
        <body>
          <div class="header">
            <div class="header-text">
              <h1>Bureau of Fire Protection</h1>
              <p>Automated Check-in System — Fire Incident Report</p>
            </div>
          </div>
          ${printContent || ''}
          <div class="footer">
            <span>Generated: ${new Date().toLocaleString()}</span>
            <span>BFPACS — CONFIDENTIAL</span>
          </div>
        </body>
      </html>
    `);

    popupWindow.document.close();
    popupWindow.focus();
    setTimeout(() => {
      popupWindow.print();
      popupWindow.close();
    }, 500);
  }

  return {
    incidentId,
    incident,
    isLoading,
    isAdmin,
    myStation,
    isEditOpen,
    setIsEditOpen,
    isAcsPortalOpen,
    setIsAcsPortalOpen,
    checkInVersion,
    setCheckInVersion,
    activeTabId,
    setActiveTabId,
    pendingAction,
    cancelPendingAction,
    requestStatusChange,
    printIncidentReport,
    loadIncident,
    tabs,
    refs: {
      printContainerRef,
      overviewRef,
      personnelRef,
      fleetRef,
      equipmentRef,
      historyRef,
    },
    scrollToSection,
    constants: {
      STATUS_COLORS,
      INCIDENT_DETAIL_STATUS,
    },
    printableContent: buildPrintableContent(incident),
  };
}

export default useIncidentDetail;

/**
 * features/personnel/pages/PersonnelProfilePage.jsx
 *
 * Full profile page for a single duty personnel member.
 */

import React from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ChevronLeft, UserCheck, Award, Shield, Package, X,
  Clock, CheckCircle2, XCircle, Flame, Radio, AlertTriangle,
  Send, CheckCheck, Building2,
} from 'lucide-react';
import { useAuth } from '@/features/auth';
import { usePersonnelProfile } from '../hooks/usePersonnelProfile';

// ─── Tailwind Styles ──────────────────────────────────────────────────────────

const S = {
  loading:       'text-center text-gray-500 py-20',
  notFound:      'text-center text-gray-600 py-20',
  page:          'space-y-6 max-w-3xl mx-auto p-4 md:p-6',
  backBtn:       'flex items-center gap-2 text-gray-400 hover:text-white text-sm transition-all mb-2',
  backIcon:      'w-4 h-4',
  card:          'bg-[#111] border border-[#1f1f1f] rounded-xl',

  // Identity
  id: {
    wrap:        'p-6',
    top:         'flex items-start gap-5',
    avatar:      'w-16 h-16 rounded-2xl bg-red-600/20 border border-red-600/30 flex items-center justify-center flex-shrink-0',
    avatarIcon:  'w-8 h-8 text-red-400',
    info:        'flex-1 min-w-0',
    name:        'text-white font-bold text-2xl leading-tight',
    rankRow:     'flex items-center gap-2 mt-1 flex-wrap',
    rank:        'text-gray-400 text-sm',
    cmdBadge:    'text-xs text-yellow-400 border border-yellow-600/30 bg-yellow-600/10 px-2 py-0.5 rounded',
    deployedBadge: 'text-xs text-orange-400 border border-orange-600/30 bg-orange-600/10 px-2 py-0.5 rounded flex items-center gap-1',
    divider:     'border-t border-[#1f1f1f] mt-5 pt-5',
    metaGrid:    'grid grid-cols-2 sm:grid-cols-3 gap-4',
    metaLabel:   'text-gray-500 text-xs uppercase tracking-wider mb-0.5',
    metaValue:   'text-white text-sm font-medium',
    certRow:     'flex items-center gap-1.5 text-sm',
    certIcon:    'w-4 h-4 text-blue-400 flex-shrink-0',
    certText:    'text-blue-300/90',
    deployBtn:   'flex items-center gap-2 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all mt-5',
    deployIcon:  'w-4 h-4',
  },

  // Deployment card
  dep: {
    wrap:        'p-5',
    titleRow:    'flex items-center gap-2 mb-4',
    titleIcon:   'w-4 h-4 text-orange-400',
    title:       'text-white font-medium text-sm',
    pulse:       'w-2 h-2 rounded-full bg-orange-400 animate-pulse ml-auto',
    empty:       'text-gray-600 text-sm text-center py-4',
    list:        'space-y-3',
    item:        'border border-[#1f1f1f] rounded-xl p-3.5 bg-[#0d0d0d]',
    itemTop:     'flex items-start justify-between gap-3',
    iconBox:     'w-8 h-8 rounded-lg bg-red-600/10 border border-red-600/20 flex items-center justify-center flex-shrink-0',
    icon:        'w-4 h-4 text-red-400',
    incTitle:    'text-white text-sm font-semibold leading-snug',
    incSub:      'text-gray-500 text-xs mt-0.5',
    roleBadge:   'flex-shrink-0 text-xs px-2 py-0.5 rounded border font-medium',
    cmdRole:     'text-yellow-400 border-yellow-600/30 bg-yellow-600/10',
    ciRole:      'text-green-400 border-green-600/30 bg-green-600/10',
    alarmRow:    'text-xs text-gray-500 mt-2 flex items-center gap-1',
  },

  // Status card
  st: {
    wrap:        'p-6',
    label:       'text-gray-400 text-xs uppercase tracking-wider mb-3',
    row:         'flex items-center gap-3',
    dot:         'w-3 h-3 rounded-full flex-shrink-0',
    text:        'text-white font-semibold text-lg',
    badge:       'ml-auto text-xs px-2.5 py-1 rounded border font-medium',
  },

  // Assets card
  assets: {
    header:      'flex items-center justify-between px-6 pt-6 pb-4',
    title:       'text-white font-medium flex items-center gap-2',
    titleIcon:   'w-4 h-4 text-red-400',
    count:       'text-xs text-gray-500 bg-[#1a1a1a] border border-[#2a2a2a] px-2 py-0.5 rounded-full ml-2',
    empty:       'px-6 pb-6 text-gray-600 text-sm text-center py-8',
    list:        'divide-y divide-[#1a1a1a]',
    item:        'flex items-center justify-between px-6 py-3.5',
    itemName:    'text-white text-sm font-medium',
    itemQty:     'text-gray-500 text-xs mt-0.5',
    badge:       'text-xs px-2 py-0.5 rounded border text-yellow-400 border-yellow-600/30 bg-yellow-600/10',
  },

  // Deploy modal
  modal: {
    overlay:     'fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4',
    box:         'bg-[#111] border border-[#1f1f1f] rounded-xl w-full max-w-lg',
    header:      'flex items-center justify-between p-6 border-b border-[#1f1f1f]',
    title:       'text-white font-semibold flex items-center gap-2',
    titleIcon:   'w-4 h-4 text-red-400',
    closeBtn:    'text-gray-500 hover:text-white transition-colors',
    body:        'p-6 space-y-5',
    label:       'block text-gray-400 text-xs uppercase tracking-wider mb-1.5',
    select:      'w-full bg-[#0a0a0a] border border-[#2a2a2a] text-white rounded-lg px-3 py-2.5 text-sm focus:border-red-600 outline-none',
    summaryBox:  'bg-[#0a0a0a] border border-[#1f1f1f] rounded-xl p-4 space-y-3',
    summaryTitle:'text-gray-400 text-xs uppercase tracking-wider mb-2',
    summaryRow:  'flex items-center gap-2 text-sm',
    summaryIcon: 'w-4 h-4 text-red-400 flex-shrink-0',
    summaryText: 'text-white',
    summaryGray: 'text-gray-500',
    eqItem:      'flex items-center gap-2 text-xs text-gray-400 ml-6 mt-1',
    footer:      'p-6 border-t border-[#1f1f1f] flex gap-3 justify-end',
    cancelBtn:   'px-4 py-2 rounded-lg border border-[#2a2a2a] text-gray-400 hover:text-white text-sm transition-all',
    submitBtn:   'flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm font-medium disabled:opacity-50 transition-all',
    // Success state
    successBox:  'p-6 text-center space-y-3',
    successIcon: 'w-12 h-12 text-green-400 mx-auto',
    successTitle:'text-white font-semibold text-lg',
    successSub:  'text-gray-400 text-sm',
    successBadge:'inline-block mt-2 text-xs text-green-400 border border-green-600/30 bg-green-600/10 px-3 py-1 rounded',
    errorBox:    'text-red-400 text-sm bg-red-600/10 border border-red-600/20 rounded-lg px-4 py-3',
  },
};

const DUTY_META = {
  'On Duty':  { dot: 'bg-green-400',  badge: 'text-green-400 bg-green-600/10 border-green-600/30',  Icon: CheckCircle2 },
  'Off Duty': { dot: 'bg-gray-500',   badge: 'text-gray-400 bg-gray-600/10 border-gray-600/30',    Icon: XCircle      },
  'On Leave': { dot: 'bg-yellow-400', badge: 'text-yellow-400 bg-yellow-600/10 border-yellow-600/30', Icon: Clock    },
};

export default function PersonnelProfilePage() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const id = params.get('id');
  const { role } = useAuth();
  const canDeploy = role === 'admin' || role === 'superadmin';

  const {
    person,
    assets,
    deployments,
    allIncidents,
    loading,
    showDeploy,
    setShowDeploy,
    selectedInc,
    setSelectedInc,
    deploying,
    deployError,
    deploySuccess,
    openDeployModal,
    handleDeploy,
  } = usePersonnelProfile(id);

  if (loading) return <div className={S.loading}>Loading profile…</div>;
  if (!person) return <div className={S.notFound}>Personnel not found.</div>;

  const duty = DUTY_META[person.duty_status] ?? DUTY_META['Off Duty'];
  const DutyIcon = duty.Icon;
  const activeInc = allIncidents.filter(i => i.incident_status === 'Active');
  const selectedIncObj = allIncidents.find(i => i.id === selectedInc);

  return (
    <div className={S.page}>
      {/* Back */}
      <button onClick={() => navigate(-1)} className={S.backBtn}>
        <ChevronLeft className={S.backIcon} /> Back
      </button>

      {/* ── Identity Card ─────────────────────────────────────────────── */}
      <div className={`${S.card} ${S.id.wrap}`}>
        <div className={S.id.top}>
          <div className={S.id.avatar}>
            <UserCheck className={S.id.avatarIcon} />
          </div>
          <div className={S.id.info}>
            <h1 className={S.id.name}>{person.full_name}</h1>
            <div className={S.id.rankRow}>
              <span className={S.id.rank}>{person.rank}</span>
              {person.is_station_commander && (
                <span className={S.id.cmdBadge}>Station Commander</span>
              )}
              {deployments.length > 0 && (
                <span className={S.id.deployedBadge}>
                  <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-ping inline-block" />
                  DEPLOYED
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Meta */}
        <div className={S.id.divider}>
          <div className={S.id.metaGrid}>
            <div>
              <div className={S.id.metaLabel}>Station</div>
              {person.station ? (
                <div className="flex items-center gap-1.5 text-sm">
                  <Building2 className="w-4 h-4 text-red-400 flex-shrink-0" />
                  <span className="text-white font-medium">{person.station.station_name}</span>
                </div>
              ) : (
                <div className="text-gray-600 text-sm">Unassigned</div>
              )}
            </div>
            <div>
              <div className={S.id.metaLabel}>Shift</div>
              <div className={S.id.metaValue}>{person.shift ?? '—'}</div>
            </div>
            <div>
              <div className={S.id.metaLabel}>Duty Status</div>
              <span className={`text-xs px-2 py-0.5 rounded border font-medium ${duty.badge}`}>
                {person.duty_status ?? '—'}
              </span>
            </div>
            <div className="col-span-2 sm:col-span-1">
              <div className={S.id.metaLabel}>Certification</div>
              {person.certification && person.certification !== 'None' ? (
                <div className={S.id.certRow}>
                  <Award className={S.id.certIcon} />
                  <span className={S.id.certText}>{person.certification}</span>
                </div>
              ) : (
                <div className="text-gray-600 text-sm">No certification on file</div>
              )}
            </div>
          </div>

          {canDeploy && (
            <button onClick={openDeployModal} className={S.id.deployBtn}>
              <Send className={S.id.deployIcon} />
              Deploy to Incident
            </button>
          )}
        </div>
      </div>

      {/* ── Active Deployments Card ────────────────────────────────────── */}
      <div className={S.card} style={deployments.length ? { borderColor: 'rgba(234,88,12,0.25)' } : {}}>
        <div className={S.dep.wrap}>
          <div className={S.dep.titleRow}>
            <Flame className={S.dep.titleIcon} />
            <span className={S.dep.title}>Active Deployments</span>
            {deployments.length > 0 && <div className={S.dep.pulse} />}
          </div>
          {!deployments.length ? (
            <div className={S.dep.empty}>Not currently deployed to any active incident.</div>
          ) : (
            <div className={S.dep.list}>
              {deployments.map(({ incident, role: depRole }) => (
                <div key={`${incident.id}-${depRole}`} className={S.dep.item}>
                  <div className={S.dep.itemTop}>
                    <div className={S.dep.iconBox}>
                      <AlertTriangle className={S.dep.icon} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={S.dep.incTitle}>{incident.location_text}</div>
                      <div className={S.dep.incSub}>
                        {incident.occupancy_type ?? incident.alarm_status ?? 'Active Incident'}
                      </div>
                      <div className={S.dep.alarmRow}>
                        <Radio className="w-3 h-3" />
                        {incident.alarm_status}
                        {incident.response_type && ` · ${incident.response_type}`}
                      </div>
                    </div>
                    <span className={`${S.dep.roleBadge} ${
                      depRole === 'Ground Commander' ? S.dep.cmdRole : S.dep.ciRole
                    }`}>
                      {depRole}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── Duty Status Card ──────────────────────────────────────────── */}
      <div className={S.card}>
        <div className={S.st.wrap}>
          <div className={S.st.label}>Current Duty Status</div>
          <div className={S.st.row}>
            <div className={`${S.st.dot} ${duty.dot} animate-pulse`} />
            <DutyIcon className={`w-5 h-5 ${
              person.duty_status === 'On Duty'  ? 'text-green-400' :
              person.duty_status === 'On Leave' ? 'text-yellow-400' : 'text-gray-500'
            }`} />
            <span className={S.st.text}>{person.duty_status}</span>
            <span className={`${S.st.badge} ${duty.badge}`}>
              {person.duty_status === 'On Duty' ? 'Active' :
               person.duty_status === 'On Leave' ? 'Leave' : 'Inactive'}
            </span>
          </div>
        </div>
      </div>

      {/* ── Borrowed Assets Card ──────────────────────────────────────── */}
      <div className={S.card}>
        <div className={S.assets.header}>
          <h3 className={S.assets.title}>
            <Package className={S.assets.titleIcon} />
            Borrowed Assets
            <span className={S.assets.count}>{assets.length}</span>
          </h3>
        </div>
        {!assets.length ? (
          <div className={S.assets.empty}>
            <Shield className="w-8 h-8 text-gray-700 mx-auto mb-2" />
            <p>No equipment currently borrowed by this personnel.</p>
          </div>
        ) : (
          <div className={S.assets.list}>
            {assets.map(eq => (
              <div key={eq.id} className={S.assets.item}>
                <div>
                  <div className={S.assets.itemName}>{eq.equipment_name || eq.item_name}</div>
                  <div className={S.assets.itemQty}>Qty: {eq.quantity}</div>
                </div>
                <span className={S.assets.badge}>Borrowed</span>
              </div>
            ))}
          </div>
        )}
        <div className="h-2" />
      </div>

      {/* ── Deploy to Incident Modal ───────────────────────────────────── */}
      {showDeploy && (
        <div className={S.modal.overlay}>
          <div className={S.modal.box}>

            {/* Header */}
            <div className={S.modal.header}>
              <h2 className={S.modal.title}>
                <Send className={S.modal.titleIcon} />
                Deploy to Incident
              </h2>
              <button onClick={() => setShowDeploy(false)} className={S.modal.closeBtn}>
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Success state */}
            {deploySuccess ? (
              <div className={S.modal.successBox}>
                <CheckCheck className={S.modal.successIcon} />
                <div className={S.modal.successTitle}>Deployment Successful</div>
                <div className={S.modal.successSub}>
                  <strong className="text-white">{deploySuccess.personnel.full_name}</strong> has been
                  deployed to<br />
                  <strong className="text-white">{deploySuccess.incident?.location_text}</strong>
                </div>
                {assets.length > 0 && (
                  <div className="text-xs text-gray-500 mt-2">
                    {assets.length} piece{assets.length > 1 ? 's' : ''} of equipment also logged to incident record.
                  </div>
                )}
                <span className={S.modal.successBadge}>✓ Check-in logged as "Manual"</span>
                <div className={S.modal.footer} style={{ border: 0, padding: 0, marginTop: '1rem' }}>
                  <button onClick={() => setShowDeploy(false)} className={S.modal.cancelBtn}>
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className={S.modal.body}>
                  {deployError && (
                    <div className={S.modal.errorBox}>{deployError}</div>
                  )}

                  <div>
                    <label className={S.modal.label}>Select Active Incident</label>
                    {!activeInc.length ? (
                      <div className="text-gray-500 text-sm">No active incidents found.</div>
                    ) : (
                      <select value={selectedInc}
                        onChange={e => { setSelectedInc(e.target.value); }}
                        className={S.modal.select}>
                        <option value="">— Choose an incident —</option>
                        {activeInc.map(inc => (
                          <option key={inc.id} value={inc.id}>
                            {inc.location_text}
                            {inc.alarm_status ? ` (${inc.alarm_status})` : ''}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  {selectedInc && (
                    <div className={S.modal.summaryBox}>
                      <div className={S.modal.summaryTitle}>Deployment Summary</div>

                      <div className={S.modal.summaryRow}>
                        <UserCheck className={S.modal.summaryIcon} />
                        <div>
                          <span className={S.modal.summaryText}>{person.full_name}</span>
                          <span className={S.modal.summaryGray}> · {person.rank}</span>
                        </div>
                      </div>

                      {selectedIncObj && (
                        <div className={S.modal.summaryRow}>
                          <AlertTriangle className={S.modal.summaryIcon} />
                          <div>
                            <span className={S.modal.summaryText}>{selectedIncObj.location_text}</span>
                            {selectedIncObj.alarm_status && (
                              <span className={S.modal.summaryGray}> · {selectedIncObj.alarm_status}</span>
                            )}
                          </div>
                        </div>
                      )}

                      {assets.length > 0 && (
                        <div>
                          <div className={S.modal.summaryRow}>
                            <Package className={S.modal.summaryIcon} />
                            <span className={S.modal.summaryText}>
                              {assets.length} Equipment piece{assets.length > 1 ? 's' : ''} linked
                            </span>
                          </div>
                          {assets.map(eq => (
                            <div key={eq.id} className={S.modal.eqItem}>
                              <span>• {eq.equipment_name || eq.item_name}</span>
                              <span className="text-gray-600">×{eq.quantity}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div className={S.modal.footer}>
                  <button onClick={() => setShowDeploy(false)} className={S.modal.cancelBtn}>
                    Cancel
                  </button>
                  <button
                    onClick={handleDeploy}
                    disabled={deploying || !selectedInc}
                    className={S.modal.submitBtn}
                  >
                    <Send className="w-4 h-4" />
                    {deploying ? 'Deploying…' : 'Confirm Deployment'}
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

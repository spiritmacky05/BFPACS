/**
 * features/dutyPersonnel/services/dutyPersonnelForm.service.js
 *
 * Pure helper functions for Duty Personnel form behavior.
 */

const MAX_SKILLS = 5;

export function parseCertification(certificationText) {
  if (!certificationText) {
    return [];
  }

  return certificationText
    .split(',')
    .map((value) => value.trim())
    .filter(Boolean);
}

export function joinCertification(skills) {
  return (skills ?? []).join(', ');
}

export function toggleSkillWithLimit(previousSkills, skill) {
  if (previousSkills.includes(skill)) {
    return previousSkills.filter((item) => item !== skill);
  }

  if (previousSkills.length >= MAX_SKILLS) {
    return previousSkills;
  }

  return [...previousSkills, skill];
}

export function buildSavePayload({ form, skills }) {
  return {
    ...form,
    certification: joinCertification(skills),
    station_id: form.station_id || null,
  };
}

export function buildEditFormFromPersonnel(personnel) {
  return {
    full_name: personnel.full_name,
    rank: personnel.rank,
    shift: personnel.shift ?? 'Shift A',
    duty_status: personnel.duty_status,
    certification: personnel.certification ?? '',
    station_id: personnel.station_id ?? '',
  };
}

export function getNextDutyStatus(currentDutyStatus) {
  return currentDutyStatus === 'On Duty' ? 'Off Duty' : 'On Duty';
}

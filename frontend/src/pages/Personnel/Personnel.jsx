/**
 * pages/Personnel.jsx
 * Redirects to DutyPersonnel (they're the same resource in the Go backend).
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Personnel() {
  const navigate = useNavigate();
  useEffect(() => { navigate('/DutyPersonnel', { replace: true }); }, [navigate]);
  return null;
}
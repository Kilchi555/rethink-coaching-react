// src/hooks/useAppointments.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export function useAppointments(role = 'customer', isFuture = true) {
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (authLoading || !user?.id) return;

    const endpoint = isFuture
      ? '/api/future-appointments'
      : '/api/past-appointments';

    const fetchAppointments = async () => {
      setLoading(true);
      try {
        const res = await axios.get(endpoint, { withCredentials: true });
        setAppointments(res.data.listData || res.data || []);
      } catch (err) {
        setError(err.response?.data?.error || 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [authLoading, user?.id, role, isFuture]);

  return { appointments, loading, error };
}

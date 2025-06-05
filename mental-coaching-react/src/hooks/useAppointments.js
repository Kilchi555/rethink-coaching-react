import { useState, useEffect } from 'react';
import axios from 'axios';

export function useAppointments(role = 'customer', isFuture = true) {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const endpoint =
      role === 'staff'
        ? `/api/staff/appointments/${isFuture ? 'future' : 'past'}`
        : `/api/customer/appointments/${isFuture ? 'future' : 'past'}`;

    const fetchAppointments = async () => {
      try {
        const res = await axios.get(endpoint, { withCredentials: true });
        setAppointments(res.data);
      } catch (err) {
        setError(err.response?.data?.error || 'Fehler beim Laden');
      } finally {
        setLoading(false);
      }
    };

    fetchAppointments();
  }, [role, isFuture]);

  return { appointments, loading, error };
}

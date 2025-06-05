// src/components/dashboards/StaffDashboard.jsx
import React, { useEffect, useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import CalendarComponent from '../CalendarComponent';
import LoadingSpinner from '../LoadingSpinner';
import './StaffDashboard.css';

const StaffDashboard = () => {
  const { user } = useAuth();
  const [appointments, setAppointments] = useState([]);
  const [allCustomers, setAllCustomers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCalendarModalOpen, setIsCalendarModalOpen] = useState(false);

  useEffect(() => {
    console.log('🧠 StaffDashboard render startet');
    if (user?.role === 'staff') {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [appointmentsRes, customersRes] = await Promise.all([
        fetch('/api/future-appointments', { credentials: 'include' }),
        fetch('/api/all-customers', { credentials: 'include' }),
      ]);
      const appointmentsData = await appointmentsRes.json();
      const customersData = await customersRes.json();
      setAppointments(appointmentsData.listData || []);
      setAllCustomers(customersData || []);
    } catch (err) {
      console.error('❌ Fehler beim Laden der Daten:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <section className="dashboard-section staff-dashboard">
      <h2>👨‍🏫 Mitarbeiter-Dashboard</h2>
      {isLoading ? (
        <LoadingSpinner message="Lade Daten..." />
      ) : (
        <>
          <p>📅 Geplante Sitzungen: <strong>{appointments.length}</strong></p>
          <button
            className="open-calendar-button"
            onClick={() => setIsCalendarModalOpen(true)}
          >
            ➕ Termin erstellen
          </button>
          <div className="staff-appointment-preview">
            {appointments.length === 0 ? (
              <p>Keine kommenden Termine.</p>
            ) : (
              appointments.map((a) => (
                <div key={a.id} className="staff-appointment">
                  <strong>{a.customer_first_name} {a.customer_last_name}</strong><br />
                  🧠 Thema: {a.title} <br />
                  🕒 {new Date(a.start_time).toLocaleString('de-CH')} <br />
                  📍 {a.location}
                </div>
              ))
            )}
          </div>
        </>
      )}
      {isCalendarModalOpen && (
        <CalendarComponent
          user={user}
          setIsCalendarModalOpen={setIsCalendarModalOpen}
          onEventClick={() => {}}
        />
      )}
    </section>
  );
};

export default StaffDashboard;

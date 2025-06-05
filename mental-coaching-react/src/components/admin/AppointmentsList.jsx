import React, { useEffect, useState } from 'react';

const AppointmentsList = () => {
  const [appointments, setAppointments] = useState([]);

  useEffect(() => {
    fetch('/api/admin/appointments')
      .then(res => res.json())
      .then(setAppointments)
      .catch(err => console.error('Fehler beim Laden der Termine:', err));
  }, []);

  return (
    <div>
      <h3>Alle Termine</h3>
      <ul>
        {appointments.map(appt => (
          <li key={appt.id}>
            {appt.start_time} – {appt.title} <br />
            🧑 Kunde: {appt.customer_name} | 👨‍⚕️ Mitarbeiter: {appt.staff_name}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default AppointmentsList;

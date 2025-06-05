import React, { useEffect, useState } from 'react';

const StatsPanel = () => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(setStats)
      .catch(err => console.error('Fehler beim Laden der Stats:', err));
  }, []);

  if (!stats) return <p>Lade Statistiken...</p>;

  return (
    <div>
      <h3>📊 Statistik</h3>
      <p>Anzahl Benutzer: {stats.userCount}</p>
      <p>Anzahl Termine: {stats.appointmentCount}</p>
    </div>
  );
};

export default StatsPanel;

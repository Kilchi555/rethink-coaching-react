import React, { useEffect, useState } from 'react';

const UserList = () => {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/admin/users')
      .then(res => res.json())
      .then(data => setUsers(data))
      .catch(err => console.error('Fehler beim Laden der Benutzer:', err));
  }, []);

  return (
    <div>
      <h3>Benutzerliste</h3>
      <ul>
        {users.map(user => (
          <li key={user.id}>
            {user.first_name} {user.last_name} ({user.email}) – {user.role}
          </li>
        ))}
      </ul>
    </div>
  );
};

export default UserList;

export async function fetchStaffLocations() {
    try {
      const response = await fetch('/api/staff/locations', {
        method: 'GET',
        credentials: 'include'
      });
  
      if (!response.ok) {
        throw new Error(`Fehler beim Abrufen der Orte: ${response.statusText}`);
      }
  
      const locations = await response.json();
      return locations;
    } catch (error) {
      console.error('Fehler beim Laden der Staff-Orte:', error);
      return [];
    }
  }
  
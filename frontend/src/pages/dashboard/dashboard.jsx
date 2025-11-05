import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import useNavigation from '../../hooks/useNavigation';

function Dashboard() {
  const [roles, setRoles] = useState([]);
  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const token = localStorage.getItem('access_token');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const response = await useApi('GET', '/api/roles', {
          Authorization: `Bearer ${token}`,
        });
        if (response.ok) {
          const data = await response.json();
          setRoles(data.roles || []);
        } else {
          console.error('Failed to fetch roles');
        }
      } catch (err) {
        console.error('Error fetching roles:', err);
      }
    };
    fetchRoles();
  }, []);
  const handleLogout = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useNavigation('/');
  };
  return (
    <div className='flex gap-2 flex-col pl-2'>
      <h1>Dashboard</h1>
      <p>User Roles: {roles.join(', ')}</p>
      {roles.includes('writer') && <div className='mb-4 w-24 h-24 rounded bg-blue-500 flex items-center justify-center text-white'>
        Admin Panel
      </div>}
      <button className='bg-red-500 text-white rounded w-24' onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
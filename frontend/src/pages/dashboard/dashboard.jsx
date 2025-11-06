import { useEffect, useState } from 'react';
import { useApi } from '../../hooks/useApi';
import useNavigation from '../../hooks/useNavigation';
import Modal from '@mui/material/Modal';

function Dashboard() {
  const [roles, setRoles] = useState([]);
  const [firstName, setFirstName] = useState('');
  const [newFirstName, setNewFirstName] = useState('');
  const [newLastName, setNewLastName] = useState('');
  const [error, setError] = useState(null);
  const [lastName, setLastName] = useState('');
  const [edit, setEdit] = useState(false);
  
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

    const fetchProfile = async () => {
      try {
        const token = localStorage.getItem('access_token');
        // eslint-disable-next-line react-hooks/rules-of-hooks
        const response = await useApi('GET', '/api/get-profile', {
          Authorization: `Bearer ${token}`,
        });
        if (response.ok) {
          const data = await response.json();
          const nameParts = data.full_name ? data.full_name.split(' ') : [];
          setFirstName(nameParts[0] || '');
          setLastName(nameParts.length > 1 ? nameParts.slice(1).join(' ') : '');
        } else {
          console.error('Failed to fetch profile');
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
      }
    };

    fetchProfile();
    fetchRoles();
  }, []);
  const handleLogout = async () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('id_token');
    // eslint-disable-next-line react-hooks/rules-of-hooks
    useNavigation('/');
  };
  const handleEdit = async () => {
    if (newFirstName.trim() === '') {
      setError('First name cannot be empty.');
      setTimeout(() => setError(null), 5000);
      return;
    }
    try {
      const token = localStorage.getItem('access_token');
      // eslint-disable-next-line react-hooks/rules-of-hooks
      const response = await useApi(
        'POST',
        '/api/edit-profile',
        { Authorization: `Bearer ${token}` },
        { first_name: newFirstName, last_name: newLastName }
      );
      if (!response.ok) {
        const data = await response.json();
        setError(data.message || 'Profile update failed. Please try again.');
        setTimeout(() => setError(null), 5000);
        return;
      }
      const data = await response.json();
      setFirstName(data.first_name);
      setLastName(data.last_name);
      setEdit(false);
    } catch (err) {
      setError('Server error. Please try again later.');
      setTimeout(() => setError(null), 5000);
    }
  }
  return (
    <div className='flex gap-2 flex-col pl-2'>
      <h1>Dashboard</h1>
      <div className='flex gap-2 flex-row'>
        <p>Name: {`${firstName} ${lastName}`}</p>
        {roles.includes('writer') && (
          
          <button className='bg-blue-500 text-white rounded w-24' aria-label='edit name' onClick={() => 
          {
            setEdit(true)
            setNewFirstName(firstName);
            setNewLastName(lastName);
          }
          }>
            Edit Profile
          </button>
        )}
        <Modal
          open={edit}
          onClose={() => setEdit(false)}
          aria-labelledby="modal-modal-title"
          aria-describedby="modal-modal-description"
        >
          <div className='fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded shadow-lg'>
            <h2 className='text-xl font-bold mb-4'>Edit Profile</h2>
            <div className='mb-4'>
              <label className='block text-lg font-semibold text-gray-900'>First Name</label>
              <input
                type="text"
                name='first_name'
                value={newFirstName}
                onChange={(e) => setNewFirstName(e.target.value)}
                placeholder="Enter your first name..."
                className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all'
              />
            </div>
            <div className='mb-4'>
              <label className='block text-lg font-semibold text-gray-900'>Last Name</label>
              <input
                type="text"
                name='last_name'
                value={newLastName}
                onChange={(e) => setNewLastName(e.target.value)}
                placeholder="Enter your last name..."
                className='w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent transition-all'
              />
            </div>
            <div className={'text-red-500 text-center mb-4' + (error ? '' : ' hidden')}>{error}</div>
            <div className='flex justify-end gap-2'>
              <button
                onClick={() => setEdit(false)}
                className="bg-red-300 text-white-700 py-2 px-4 rounded hover:bg-red-400 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleEdit}
                className='bg-green-300 text-white-700 py-2 px-4 rounded hover:bg-green-400 transition-colors'
                >
                Save
                </button>
            </div>
          </div>
          </Modal> 
      </div>
      <p>User Roles: {roles.join(', ')}</p>
      <button className='bg-red-500 text-white rounded w-24' onClick={handleLogout}>
        Logout
      </button>
    </div>
  );
}

export default Dashboard;
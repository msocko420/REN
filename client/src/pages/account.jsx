import React, { useState, useEffect, useContext } from 'react'; // Added useContext
import axios from 'axios';
import { UserContext } from '../components'; // Import UserContext (adjust the path as needed)

const Account = () => {
  const { username: usernameValue } = useContext(UserContext); // Retrieve username from context

  const [accountInfo, setAccountInfo] = useState({
    username: '',
    email: '' // Add other fields as needed
  });
  const [error, setError] = useState('');

  useEffect(() => {
    // Fetch the user's account information from your backend using the username from context
    axios.get(`http://localhost:8080/api/user/account/${usernameValue}`)
      .then(response => {
        setAccountInfo({
          username: response.data.user.username,
          email: response.data.user.email
        });
      })
      .catch(err => setError(err.message || 'Failed to fetch account information'));
  }, [usernameValue]); // Added dependency on usernameValue

  const handleUpdateAccount = () => {
    // Logic to update the user's account information
    axios.put('http://localhost:8080/api/account/:username', accountInfo) // Replace with your endpoint
      .then(response => {
        if (!response.data.success) {
          setError(response.data.error || 'Failed to update account information');
        }
      })
      .catch(err => setError(err.message || 'Failed to update account information'));
  };

  return (
    <div>
      <h1>Account Page</h1>
      <div>
        <label>Username:</label>
        <input type="text" value={accountInfo.username} onChange={(e) => setAccountInfo({...accountInfo, username: e.target.value})} />
        <label>Email:</label>
        <input type="email" value={accountInfo.email} onChange={(e) => setAccountInfo({...accountInfo, email: e.target.value})} />
        {/* Repeat for other fields like email, etc. */}
      </div>
      {error && <div className="error-message text-red-600 text-sm mb-2">{error}</div>}
      <button onClick={handleUpdateAccount}>Update Account</button>
    </div>
  );
};

export default Account;

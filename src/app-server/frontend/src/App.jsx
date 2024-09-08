import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Route, Routes, Navigate, useNavigate, useLocation} from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/authContext';

import axios from 'axios';

import Welcome from './pages/Welcome';
import SetAdminPassword from './pages/SetAdminPassword';
import UpdateAdminPassword from './pages/UpdateAdminPassword';
import Login from './pages/Login';
import Chat from './pages/Chat';
import Agents from './pages/Agents';
import Agent from './pages/Agent';
import Logout from './pages/Logout'
import Invalid from './pages/Invalid'
import Loading from './pages/Loading';

const AppContent = () => {

  const navigate = useNavigate();
  const location = useLocation();

  //console.log('Current Path:', location.pathname);

  const { isAdminPasswordSet, isLoggedIn, setIsAdminPasswordSet, setIsLoggedIn, baseUrl, X_REQUEST_STR } = useAuth();
  const [loading, setLoading] = useState(true); // Add loading state

  // checks on first load
  useEffect(() => {
    // Check if the admin password is set on the first load
    async function checkAdminPasswordStatus() {
      try {
        const response = await axios.get(`${baseUrl}/api/auth/is-admin-password-set`, {headers: {'X-Requested-With':  X_REQUEST_STR}});
        const data = response.data;
        if (data.admin_password_set) {
          setIsAdminPasswordSet(true);
          await checkJWTToken(); // Check JWT token after confirming admin password is set
        }
      } catch (error) {
        // Handle Errors
        if (error.response) {
          // Server responded with a status other than 200 range
          console.error('Error response:', error.response); // Response data from the server
        } else if (error.request) {
          // The request was made but no response was received
          console.error('No response received:', error.request);
        } else {
          // Something else happened in setting up the request
          console.error('Error:', error.message);
        }
      } finally {
        setLoading(false)
      }
    }
    // Function to check the JWT token via the cookie
    async function checkJWTToken() {
      try {
        const response = await axios.get(`${baseUrl}/api/auth/check-token`,  { withCredentials: true , headers: {'X-Requested-With': X_REQUEST_STR}});
        const data = response.data;
        setIsLoggedIn(true);
      } catch (e) {
        console.error(e.toString())
      }
    }

    checkAdminPasswordStatus();
  }, [setIsAdminPasswordSet, setIsLoggedIn]);

  // If still loading, don't render any routes
  if (loading) {
    return <Loading/>;
  }

  return (
    <Routes>
      {!isAdminPasswordSet ? (
        <>
          <Route path="/welcome" element={<Welcome />} />
          <Route path="/set-admin-password" element={<SetAdminPassword />} />
          <Route path="*" element={<Navigate to="/welcome" />} />
        </>
      ) : !isLoggedIn ? (
        <>
          <Route path="/" element={<Navigate to="/login"/>} />
          <Route path="/login" element={<Login />} />
          <Route path="/chat/:aagentname" element={<Chat />} />
          <Route path="*" element={<Navigate to="/login"/>} />
        </>
      ) : (
        <>
          <Route path="/" element={<Navigate to="/agents" replace/>} />
          <Route path="/agents/" element={<Agents />} />
          <Route path="/agent/:agentname" element={<Agent />} />
          <Route path="/agent/" element={<Agent />} />
          <Route path="/update-admin-password" element={<UpdateAdminPassword />} />
          <Route path="/chat/:agentname" element={<Chat />} />
          <Route path="/logout" element={<Logout />} />
          <Route path="*" element={<Invalid/>} />
        </>
      )}
    </Routes>
  );
};

const App = () => {
  return (
    <AuthProvider>
      <Router>
        <AppContent />
      </Router>
    </AuthProvider>
  )
}

export default App;

import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Apply from './pages/Apply';
import UploadDocuments from './pages/UploadDocuments';
import PostalRequestForm from './pages/PostalRequestForm';
import PostalRequestTrack from './pages/PostalRequestTrack';
import PostalRequestDashboard from './pages/PostalRequestDashboard';

const ProtectedRoute = ({ children }) => {
  const { isAuthenticated } = React.useContext(AuthContext);
  if (!isAuthenticated) {
    return <Navigate to="/admin" replace />;
  }
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/apply" element={<Apply />} />
          <Route path="/upload-documents/:applicationId" element={<UploadDocuments />} />
          <Route path="/postal-request" element={<PostalRequestForm />} />
          <Route path="/postal-request/track" element={<PostalRequestTrack />} />
          <Route path="/postal-request/dashboard/:id" element={<PostalRequestDashboard />} />
          <Route path="/admin" element={<Login />} />
          <Route 
            path="/dashboard" 
            element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

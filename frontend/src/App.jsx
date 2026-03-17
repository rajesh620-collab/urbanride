import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useWebSocket } from './hooks/useWebSocket';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import PostRide from './pages/PostRide';
import SearchRide from './pages/SearchRide';
import RideDetail from './pages/Ridedetail';
import MyRides from './pages/MyRides';
import LandingPage from './pages/LandingPage';

// Show nothing while the auth token is being validated
function AuthGate({ children }) {
  const { loading } = useAuth();
  if (loading) return (
    <div style={{
      minHeight: '100vh', display: 'flex',
      alignItems: 'center', justifyContent: 'center',
      background: 'var(--cream)'
    }}>
      <div className="spinner" />
    </div>
  );
  return children;
}

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/search" replace /> : children;
}

function AppContent() {
  useWebSocket();

  return (
    <AuthGate>
      <Navbar />
      <Routes>
        <Route path="/"          element={<GuestRoute><LandingPage /></GuestRoute>} />
        <Route path="/login"     element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register"  element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/search"    element={<ProtectedRoute><SearchRide /></ProtectedRoute>} />
        <Route path="/post-ride" element={<ProtectedRoute><PostRide /></ProtectedRoute>} />
        <Route path="/ride/:id"  element={<ProtectedRoute><RideDetail /></ProtectedRoute>} />
        <Route path="/my-rides"  element={<ProtectedRoute><MyRides /></ProtectedRoute>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </AuthGate>
  );
}

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <AppContent />
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
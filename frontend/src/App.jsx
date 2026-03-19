import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { useWebSocket } from './hooks/useWebSocket';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import PostRide from './pages/PostRide';
import SearchRide from './pages/SearchRide';
import RideDetail from './pages/Ridedetail';
import MyRides from './pages/MyRides';
import LandingPage from './pages/LandingPage';
import RateRide from './pages/RateRide';

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
    <>
      <Navbar />
      <Routes>
        <Route path="/"          element={<GuestRoute><LandingPage /></GuestRoute>} />
        <Route path="/login"     element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register"  element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/search"    element={<ProtectedRoute><SearchRide /></ProtectedRoute>} />
        <Route path="/post-ride" element={<ProtectedRoute><PostRide /></ProtectedRoute>} />
        <Route path="/ride/:id"  element={<ProtectedRoute><RideDetail /></ProtectedRoute>} />
        <Route path="/my-rides"  element={<ProtectedRoute><MyRides /></ProtectedRoute>} />
        <Route path="/rate/:id"  element={<ProtectedRoute><RateRide /></ProtectedRoute>} />
        <Route path="*"          element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <AppContent />
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
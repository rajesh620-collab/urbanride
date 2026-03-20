import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
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
import DriverNavigation from './pages/DriverNavigation';
import PoolDetail from './pages/PoolDetail';
import DriverPools from './pages/DriverPools';

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" replace />;
}

function GuestRoute({ children }) {
  const { user } = useAuth();
  return user ? <Navigate to="/search" replace /> : children;
}

// Full-screen pages that hide the Navbar
const FULLSCREEN_PATHS = ['/navigate/'];

function AppContent() {
  useWebSocket();
  const location = useLocation();
  const isFullscreen = FULLSCREEN_PATHS.some(p => location.pathname.startsWith(p)) || location.pathname === '/';

  return (
    <>
      {!isFullscreen && <Navbar />}
      <Routes>
        <Route path="/"              element={<LandingPage />} />
        <Route path="/login"         element={<GuestRoute><Login /></GuestRoute>} />
        <Route path="/register"      element={<GuestRoute><Register /></GuestRoute>} />
        <Route path="/search"        element={<ProtectedRoute><SearchRide /></ProtectedRoute>} />
        <Route path="/post-ride"     element={<ProtectedRoute><PostRide /></ProtectedRoute>} />
        <Route path="/ride/:id"      element={<ProtectedRoute><RideDetail /></ProtectedRoute>} />
        <Route path="/my-rides"      element={<ProtectedRoute><MyRides /></ProtectedRoute>} />
        <Route path="/rate/:id"      element={<ProtectedRoute><RateRide /></ProtectedRoute>} />
        <Route path="/navigate/:id"  element={<ProtectedRoute><DriverNavigation /></ProtectedRoute>} />
        <Route path="/pool/:id"      element={<ProtectedRoute><PoolDetail /></ProtectedRoute>} />
        <Route path="/driver/pools"  element={<ProtectedRoute><DriverPools /></ProtectedRoute>} />
        <Route path="*"              element={<Navigate to="/" replace />} />
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
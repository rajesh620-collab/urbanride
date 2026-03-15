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


function ProtectedRoute({ children }) {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
}

// Initializes WebSocket connection once user is logged in
function AppContent() {
  useWebSocket();
  const { user } = useAuth();

  return (
    <>
      <Navbar />
      <Routes>
        <Route path="/login"     element={<Login />} />
        <Route path="/register"  element={<Register />} />
        <Route path="/search"    element={<ProtectedRoute><SearchRide /></ProtectedRoute>} />
        <Route path="/post-ride" element={<ProtectedRoute><PostRide /></ProtectedRoute>} />
        <Route path="/ride/:id"  element={<ProtectedRoute><RideDetail /></ProtectedRoute>} />
        <Route path="/my-rides"  element={<ProtectedRoute><MyRides /></ProtectedRoute>} />
        <Route path="/"          element={<Navigate to={user ? '/search' : '/login'} />} />
        <Route path="/"  element={<LandingPage />} />
<Route path="/login"    element={<Login />} />
<Route path="/register" element={<Register />} />
      </Routes>
    </>
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
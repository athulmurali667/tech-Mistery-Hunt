import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameProvider, GameContext } from './context/GameContext';
import { useContext } from 'react';
import Login from './pages/Login';
import MissionActivation from './pages/MissionActivation';
import Dashboard from './pages/Dashboard';
import Checkpoint from './pages/Checkpoint';
import Volunteer from './pages/Volunteer';
import Leaderboard from './pages/Leaderboard';
import Admin from './pages/Admin';

const ProtectedRoute = ({ children }) => {
  const { team } = useContext(GameContext);
  if (!team) return <Navigate to="/" />;
  return children;
};

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route 
        path="/activation" 
        element={
          <ProtectedRoute>
            <MissionActivation />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/dashboard" 
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        } 
      />
      <Route 
        path="/checkpoint/:id" 
        element={
          <ProtectedRoute>
            <Checkpoint />
          </ProtectedRoute>
        } 
      />
      <Route path="/volunteer" element={<Volunteer />} />
      <Route path="/leaderboard" element={<Leaderboard />} />
      <Route path="/admin" element={<Admin />} />
    </Routes>
  );
}

function App() {
  return (
    <GameProvider>
      <BrowserRouter>
        <AppRoutes />
      </BrowserRouter>
    </GameProvider>
  );
}

export default App;

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import EmployeeDashboard from './pages/EmployeeDashboard';
import AdminDashboard from './pages/AdminDashboard';
import ManagerDashboard from './pages/ManagerDashboard';
import EmployeeProfile from './pages/EmployeeProfile';
import MyAttendance from './pages/MyAttendance';
import LeaveRequest from './pages/LeaveRequest';
import TeamDirectory from './pages/TeamDirectory';
import Payroll from './pages/Payroll';
import { AuthProvider, useAuth } from './context/AuthContext';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useAuth();
  
  if (loading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
  if (!user) return <Navigate to="/login" />;
  if (roles && !roles.includes(user.role)) return <Navigate to="/" />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster position="top-right" richColors />
        <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/login" element={<Login />} />
          
          <Route path="/employee/*" element={
            <PrivateRoute roles={['employee']}>
              <Routes>
                <Route path="dashboard" element={<EmployeeDashboard />} />
                <Route path="profile" element={<EmployeeProfile />} />
                <Route path="attendance" element={<MyAttendance />} />
                <Route path="leave" element={<LeaveRequest />} />
                <Route path="team" element={<TeamDirectory />} />
                <Route path="payroll" element={<Payroll />} />
              </Routes>
            </PrivateRoute>
          } />
          
          <Route path="/admin/*" element={
            <PrivateRoute roles={['admin']}>
              <Routes>
                <Route path="dashboard" element={<AdminDashboard />} />
                <Route path="team" element={<TeamDirectory />} />
              </Routes>
            </PrivateRoute>
          } />
          
          <Route path="/manager/*" element={
            <PrivateRoute roles={['manager']}>
              <Routes>
                <Route path="dashboard" element={<ManagerDashboard />} />
                <Route path="team" element={<TeamDirectory />} />
              </Routes>
            </PrivateRoute>
          } />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;

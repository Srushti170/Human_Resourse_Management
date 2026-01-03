import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Button } from '../components/ui/button';
import { CheckCircle, Calendar, FileText, Coffee, LogOut as LogOutIcon, Clock, Briefcase } from 'lucide-react';
import { toast } from 'sonner';
import axios from 'axios';
import { Link } from 'react-router-dom';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const EmployeeDashboard = () => {
  const { user } = useAuth();
  const [attendance, setAttendance] = useState(null);
  const [leaveBalance, setLeaveBalance] = useState({});
  const [announcements, setAnnouncements] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [attendanceRes, leaveRes, announcementsRes] = await Promise.all([
        axios.get(`${API_URL}/attendance/today`),
        axios.get(`${API_URL}/leave/balance`),
        axios.get(`${API_URL}/announcements`)
      ]);
      setAttendance(attendanceRes.data);
      setLeaveBalance(leaveRes.data);
      setAnnouncements(announcementsRes.data.slice(0, 3));
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAttendanceAction = async (action) => {
    setLoading(true);
    try {
      await axios.post(`${API_URL}/attendance/action`, { action });
      toast.success(`${action.replace('_', ' ')} successful!`);
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Action failed');
    } finally {
      setLoading(false);
    }
  };

  const hoursWorked = attendance ? parseFloat(attendance.hours_worked || 0) : 0;
  const currentTime = new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });

  return (
    <Layout>
      <div className="space-y-6" data-testid="employee-dashboard">
        <div>
          <h1 className="text-4xl font-extrabold mb-2" style={{ fontFamily: 'Manrope' }}>
            Welcome back, {user?.name?.split(' ')[0]}! 👋
          </h1>
          <p className="text-slate-600">Here's what's happening with your work today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
          <div className="md:col-span-4">
            <Card className="border-slate-200 shadow-sm" data-testid="employee-profile-card">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-2xl font-bold">
                    {user?.name?.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg">{user?.name}</h3>
                    <p className="text-sm text-slate-600">{user?.designation}</p>
                  </div>
                </div>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-slate-600">Team:</span>
                    <span className="font-medium">{user?.team}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Employee ID:</span>
                    <span className="font-medium">{user?.employee_id}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-slate-600">Join Date:</span>
                    <span className="font-medium">{user?.join_date}</span>
                  </div>
                </div>
                <Link to="/employee/profile">
                  <Button variant="outline" className="w-full mt-4" data-testid="view-profile-button">
                    View Full Profile
                  </Button>
                </Link>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm mt-6" data-testid="leave-balance-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Leave Balance</CardTitle>
                  <Link to="/employee/leave" className="text-sm text-primary hover:underline">
                    Apply Leave
                  </Link>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Calendar className="h-5 w-5 text-blue-600" />
                    <span className="font-medium">Annual Leave</span>
                  </div>
                  <span className="text-2xl font-bold text-blue-600">{leaveBalance.annual}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-red-600" />
                    <span className="font-medium">Sick Leave</span>
                  </div>
                  <span className="text-2xl font-bold text-red-600">{leaveBalance.sick}</span>
                </div>
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-5 w-5 text-green-600" />
                    <span className="font-medium">WFH</span>
                  </div>
                  <span className="text-2xl font-bold text-green-600">{leaveBalance.wfh}</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="md:col-span-8 space-y-6">
            <Card className="border-slate-200 shadow-sm" data-testid="attendance-card">
              <CardHeader>
                <CardTitle className="text-xl">Today's Attendance</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center mb-6">
                  <div className="text-6xl font-bold text-primary mb-2">
                    {hoursWorked.toFixed(2)}
                  </div>
                  <p className="text-slate-600">hours worked</p>
                  {attendance?.check_in && (
                    <p className="text-sm text-slate-500 mt-2">
                      Checked in at {attendance.check_in}
                    </p>
                  )}
                </div>
                <div className="flex gap-3">
                  {!attendance ? (
                    <Button
                      onClick={() => handleAttendanceAction('check_in')}
                      disabled={loading}
                      className="flex-1 bg-green-600 hover:bg-green-700"
                      data-testid="check-in-button"
                    >
                      <CheckCircle className="mr-2 h-4 w-4" />
                      Check In
                    </Button>
                  ) : (
                    <>
                      <Button
                        onClick={() => handleAttendanceAction('break_start')}
                        disabled={loading || attendance.break_start}
                        variant="outline"
                        className="flex-1"
                        data-testid="break-button"
                      >
                        <Coffee className="mr-2 h-4 w-4" />
                        Break
                      </Button>
                      <Button
                        onClick={() => handleAttendanceAction('check_out')}
                        disabled={loading || attendance.check_out}
                        className="flex-1 bg-red-600 hover:bg-red-700"
                        data-testid="check-out-button"
                      >
                        <LogOutIcon className="mr-2 h-4 w-4" />
                        Check Out
                      </Button>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm" data-testid="announcements-card">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="text-xl">Announcements & Activity</CardTitle>
                  <span className="text-sm text-slate-500">View All</span>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {announcements.length > 0 ? (
                    announcements.map((announcement) => (
                      <div key={announcement.id} className="flex gap-3 p-4 bg-slate-50 rounded-lg">
                        <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <FileText className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <h4 className="font-semibold mb-1">{announcement.title}</h4>
                          <p className="text-sm text-slate-600">{announcement.content}</p>
                          <p className="text-xs text-slate-500 mt-1">{new Date(announcement.date).toLocaleDateString()}</p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-center text-slate-500 py-8">No announcements yet</p>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-purple-50 to-blue-50">
              <CardContent className="p-6">
                <div className="flex items-start gap-4">
                  <div className="text-4xl">💡</div>
                  <div>
                    <p className="text-lg font-semibold text-slate-800 mb-2">
                      "Success is not final, failure is not fatal: it is the courage to continue that counts."
                    </p>
                    <p className="text-sm text-slate-600">- Winston Churchill</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default EmployeeDashboard;

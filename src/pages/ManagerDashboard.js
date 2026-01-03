import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Users, Calendar, Search, CheckCircle, XCircle, Clock } from 'lucide-react';
import { Button } from '../components/ui/button';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const ManagerDashboard = () => {
  const [employees, setEmployees] = useState([]);
  const [stats, setStats] = useState({ total_employees: 0, present_today: 0, last_7_days: [] });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [employeesRes, statsRes, leaveRes] = await Promise.all([
        axios.get(`${API_URL}/users`),
        axios.get(`${API_URL}/attendance/stats`),
        axios.get(`${API_URL}/leave/requests`)
      ]);
      setEmployees(employeesRes.data.filter(u => u.role === 'employee'));
      setStats(statsRes.data);
      setLeaveRequests(leaveRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleLeaveAction = async (leaveId, status) => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/leave/requests/${leaveId}`, { status });
      toast.success(`Leave request ${status}`);
      fetchData();
    } catch (error) {
      toast.error('Action failed');
    } finally {
      setLoading(false);
    }
  };

  const filteredEmployees = employees.filter(emp => 
    emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.employee_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const attendanceData = stats.last_7_days.map(day => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    count: day.count
  }));

  const pendingLeaves = leaveRequests.filter(r => r.status === 'pending');
  const presentPercentage = stats.total_employees > 0 
    ? Math.round((stats.present_today / stats.total_employees) * 100) 
    : 0;

  return (
    <Layout>
      <div className="space-y-6" data-testid="manager-dashboard">
        <div>
          <h1 className="text-4xl font-extrabold mb-2" style={{ fontFamily: 'Manrope' }}>
            Manager Dashboard
          </h1>
          <p className="text-slate-600">Track your team's attendance, leave requests, and performance.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="border-slate-200 shadow-sm" data-testid="total-employees-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Employees</p>
                  <p className="text-3xl font-bold text-primary">{employees.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm" data-testid="present-today-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Present Today</p>
                  <p className="text-3xl font-bold text-green-600">{stats.present_today}</p>
                  <p className="text-xs text-slate-500 mt-1">{presentPercentage}% attendance</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm" data-testid="pending-leaves-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Pending Leaves</p>
                  <p className="text-3xl font-bold text-orange-600">{pendingLeaves.length}</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <Clock className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm" data-testid="attendance-chart-card">
          <CardHeader>
            <CardTitle className="text-xl">Weekly Attendance Trend</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="day" stroke="#64748b" style={{ fontSize: '12px' }} />
                <YAxis stroke="#64748b" style={{ fontSize: '12px' }} />
                <Tooltip />
                <Bar dataKey="count" fill="#7c3aed" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm" data-testid="leave-requests-card">
          <CardHeader>
            <CardTitle className="text-xl">Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Employee</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Dates</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Status</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.slice(0, 10).map((request) => (
                    <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="py-3 px-4 font-medium">{request.user_name}</td>
                      <td className="py-3 px-4">
                        <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                          {request.leave_type}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-sm text-slate-600">{request.start_date} - {request.end_date}</td>
                      <td className="py-3 px-4">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded ${
                          request.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          request.status === 'approved' ? 'bg-green-100 text-green-700' :
                          'bg-red-100 text-red-700'
                        }`}>
                          {request.status}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {request.status === 'pending' && (
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLeaveAction(request.id, 'approved')}
                              disabled={loading}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLeaveAction(request.id, 'rejected')}
                              disabled={loading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm" data-testid="employees-list-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl">All Employees</CardTitle>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search employees..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9 w-64"
                  data-testid="search-employees-input"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Employee</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Employee ID</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Designation</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Team</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Join Date</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredEmployees.map((employee) => (
                    <tr key={employee.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`employee-row-${employee.id}`}>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold">
                            {employee.name?.charAt(0)}
                          </div>
                          <div>
                            <p className="font-medium">{employee.name}</p>
                            <p className="text-xs text-slate-500">{employee.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm">{employee.employee_id}</td>
                      <td className="py-3 px-4 text-sm">{employee.designation}</td>
                      <td className="py-3 px-4 text-sm">{employee.team}</td>
                      <td className="py-3 px-4 text-sm text-slate-600">{employee.join_date}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default ManagerDashboard;

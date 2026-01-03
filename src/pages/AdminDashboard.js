import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Users, Calendar, TrendingUp, AlertCircle, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Legend } from 'recharts';
import { Button } from '../components/ui/button';
import axios from 'axios';
import { toast } from 'sonner';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const AdminDashboard = () => {
  const [stats, setStats] = useState({ total_employees: 0, present_today: 0, last_7_days: [] });
  const [leaveRequests, setLeaveRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [statsRes, leaveRes] = await Promise.all([
        axios.get(`${API_URL}/attendance/stats`),
        axios.get(`${API_URL}/leave/requests`)
      ]);
      setStats(statsRes.data);
      setLeaveRequests(leaveRes.data.filter(r => r.status === 'pending').slice(0, 5));
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

  const attendanceData = stats.last_7_days.map(day => ({
    day: new Date(day.date).toLocaleDateString('en-US', { weekday: 'short' }),
    count: day.count
  }));

  const wellbeingData = [
    { name: 'High Engagement', value: 60, color: '#22c55e' },
    { name: 'At Risk', value: 15, color: '#ef4444' },
    { name: 'Neutral', value: 25, color: '#eab308' }
  ];

  const presentPercentage = stats.total_employees > 0 
    ? Math.round((stats.present_today / stats.total_employees) * 100) 
    : 0;

  return (
    <Layout>
      <div className="space-y-6" data-testid="admin-dashboard">
        <div>
          <h1 className="text-4xl font-extrabold mb-2" style={{ fontFamily: 'Manrope' }}>
            Good Morning, Olivia! 👋
          </h1>
          <p className="text-slate-600">Here's your HR overview for today.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid="total-present-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Total Present</p>
                  <p className="text-3xl font-bold text-green-600">{stats.present_today}</p>
                  <p className="text-xs text-slate-500 mt-1">{presentPercentage}% of employees</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-green-100 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid="on-leave-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">On Leave</p>
                  <p className="text-3xl font-bold text-blue-600">{leaveRequests.length}</p>
                  <p className="text-xs text-slate-500 mt-1">Today</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-blue-100 flex items-center justify-center">
                  <Calendar className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid="new-recruits-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">New Recruits</p>
                  <p className="text-3xl font-bold text-purple-600">3</p>
                  <p className="text-xs text-slate-500 mt-1">this week</p>
                </div>
                <div className="h-12 w-12 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Users className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-slate-200 shadow-sm hover:shadow-md transition-shadow" data-testid="pending-actions-card">
            <CardContent className="p-6">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm text-slate-600 mb-1">Pending Actions</p>
                  <p className="text-3xl font-bold text-orange-600">{leaveRequests.length}</p>
                  <span className="inline-block mt-1 px-2 py-0.5 text-xs font-semibold bg-red-100 text-red-700 rounded">Urgent</span>
                </div>
                <div className="h-12 w-12 rounded-lg bg-orange-100 flex items-center justify-center">
                  <AlertCircle className="h-6 w-6 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="border-slate-200 shadow-sm" data-testid="attendance-overview-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Attendance Overview</CardTitle>
                <select className="text-sm border border-slate-200 rounded-lg px-3 py-1">
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>This Month</option>
                </select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={250}>
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

          <Card className="border-slate-200 shadow-sm" data-testid="health-monitor-card">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="text-xl">Employee Morale Tracker</CardTitle>
                <a href="#" className="text-sm text-primary hover:underline">View Report</a>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-center mb-4">
                <div className="relative">
                  <ResponsiveContainer width={200} height={200}>
                    <PieChart>
                      <Pie
                        data={wellbeingData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {wellbeingData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <span className="text-3xl font-bold text-primary">75%</span>
                    <span className="text-xs text-slate-600">Well-being</span>
                  </div>
                </div>
              </div>
              <div className="space-y-2">
                {wellbeingData.map((item) => (
                  <div key={item.name} className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      <div className="h-3 w-3 rounded-full" style={{ backgroundColor: item.color }}></div>
                      <span className="text-slate-600">{item.name}</span>
                    </div>
                    <span className="font-semibold">{item.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="border-slate-200 shadow-sm" data-testid="pending-leave-requests-card">
          <CardHeader>
            <CardTitle className="text-xl">Pending Leave Requests</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200">
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Employee</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Leave Type</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Dates</th>
                    <th className="text-left py-3 px-4 font-semibold text-sm text-slate-600">Reason</th>
                    <th className="text-right py-3 px-4 font-semibold text-sm text-slate-600">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {leaveRequests.length > 0 ? (
                    leaveRequests.map((request) => (
                      <tr key={request.id} className="border-b border-slate-100 hover:bg-slate-50" data-testid={`leave-request-${request.id}`}>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="h-8 w-8 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                              {request.user_name?.charAt(0)}
                            </div>
                            <span className="font-medium">{request.user_name}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className="inline-block px-2 py-1 text-xs font-semibold bg-blue-100 text-blue-700 rounded">
                            {request.leave_type}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600">
                          {request.start_date} - {request.end_date}
                        </td>
                        <td className="py-3 px-4 text-sm text-slate-600 max-w-xs truncate">
                          {request.reason}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <div className="flex items-center justify-end gap-2">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLeaveAction(request.id, 'approved')}
                              disabled={loading}
                              className="text-green-600 hover:text-green-700 hover:bg-green-50"
                              data-testid={`approve-leave-${request.id}`}
                            >
                              <CheckCircle className="h-4 w-4" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleLeaveAction(request.id, 'rejected')}
                              disabled={loading}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              data-testid={`reject-leave-${request.id}`}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan="5" className="py-8 text-center text-slate-500">
                        No pending leave requests
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default AdminDashboard;

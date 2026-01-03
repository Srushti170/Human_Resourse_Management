import { Link, useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard, Users, Calendar, FileText, Settings, LogOut, Menu, Bell, Moon } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { Button } from './ui/button';
import { useState } from 'react';

const Layout = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const getNavItems = () => {
    const baseRole = user?.role || 'employee';
    const commonItems = [
      { icon: LayoutDashboard, label: 'Dashboard', path: `/${baseRole}/dashboard` },
      { icon: Users, label: 'Team Directory', path: `/${baseRole}/team` },
    ];

    if (baseRole === 'employee') {
      return [
        ...commonItems.slice(0, 1),
        { icon: Calendar, label: 'My Attendance', path: '/employee/attendance' },
        { icon: FileText, label: 'Leave Request', path: '/employee/leave' },
        { icon: FileText, label: 'Payroll & Payslip', path: '/employee/payroll' },
        ...commonItems.slice(1),
      ];
    }
    
    return commonItems;
  };

  const navItems = getNavItems();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-slate-50">
      <aside className={`fixed left-0 top-0 z-50 h-full bg-slate-900 text-white transition-all duration-300 ${sidebarOpen ? 'w-64' : 'w-0 md:w-20'} overflow-hidden`} data-testid="sidebar">
        <div className="flex h-full flex-col">
          <div className="flex items-center justify-between border-b border-slate-800 p-4">
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-xl font-bold">D</span>
              </div>
              {sidebarOpen && <span className="text-xl font-bold" style={{ fontFamily: 'Manrope' }}>DAYFLOW</span>}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto py-6">
            <div className="space-y-1 px-3">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    data-testid={`nav-${item.label.toLowerCase().replace(/ /g, '-')}-link`}
                    className={`flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                      isActive
                        ? 'bg-primary text-white'
                        : 'text-slate-300 hover:bg-slate-800 hover:text-white'
                    }`}
                  >
                    <item.icon className="h-5 w-5" />
                    {sidebarOpen && <span>{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          <div className="border-t border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10">
                <AvatarImage src={user?.profile_image} />
                <AvatarFallback className="bg-primary text-white">
                  {user?.name?.charAt(0) || 'U'}
                </AvatarFallback>
              </Avatar>
              {sidebarOpen && (
                <div className="flex-1 overflow-hidden">
                  <p className="text-sm font-medium truncate">{user?.name}</p>
                  <p className="text-xs text-slate-400 truncate">{user?.email}</p>
                </div>
              )}
              <Button
                variant="ghost"
                size="icon"
                onClick={handleLogout}
                className="text-slate-400 hover:text-white"
                data-testid="logout-button"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </aside>

      <div className={`flex-1 transition-all duration-300 ${sidebarOpen ? 'ml-64' : 'ml-0 md:ml-20'}`}>
        <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/80 backdrop-blur-md">
          <div className="flex h-16 items-center justify-between px-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setSidebarOpen(!sidebarOpen)}
              data-testid="sidebar-toggle-button"
            >
              <Menu className="h-5 w-5" />
            </Button>
            
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" data-testid="notifications-button">
                <Bell className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" data-testid="theme-toggle-button">
                <Moon className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </header>

        <main className="p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default Layout;

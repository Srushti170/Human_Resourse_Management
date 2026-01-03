import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { toast } from 'sonner';
import { Lock } from 'lucide-react';

const Login = () => {
  const [searchParams] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const roleParam = searchParams.get('role');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const user = await login(email, password);
      toast.success('Login successful!');
      
      const roleRoutes = {
        employee: '/employee/dashboard',
        admin: '/admin/dashboard',
        manager: '/manager/dashboard'
      };
      
      navigate(roleRoutes[user.role] || '/employee/dashboard');
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Login failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-violet-600 via-purple-600 to-indigo-600 p-12 text-white flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-8">
            <div className="h-12 w-12 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center">
              <span className="text-2xl font-bold">D</span>
            </div>
            <span className="text-2xl font-bold" style={{ fontFamily: 'Manrope' }}>DAYFLOW</span>
          </div>
          <h1 className="text-5xl font-extrabold mb-6" style={{ fontFamily: 'Manrope' }}>
            Welcome Back
          </h1>
          <p className="text-xl text-white/90 max-w-md">
            Access your workspace and manage your HR operations efficiently.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Lock className="h-5 w-5" />
          <span className="text-sm">Secure and encrypted connection</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8 bg-slate-50">
        <div className="w-full max-w-md">
          <div className="bg-white rounded-2xl shadow-xl p-8 border border-slate-200">
            <div className="mb-8">
              <h2 className="text-3xl font-bold mb-2" style={{ fontFamily: 'Manrope' }}>
                Sign In
              </h2>
              <p className="text-slate-600">
                {roleParam === 'admin' ? 'Admin & HR Console' : 'Employee Portal'}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-6" data-testid="login-form">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="your.email@company.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  data-testid="email-input"
                  className="h-11"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  data-testid="password-input"
                  className="h-11"
                />
              </div>

              <Button
                type="submit"
                className="w-full bg-primary hover:bg-primary/90 h-11"
                disabled={loading}
                data-testid="login-submit-button"
              >
                {loading ? 'Signing in...' : 'Sign In'}
              </Button>
            </form>

            <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm font-medium text-blue-900 mb-2">Demo Credentials:</p>
              <div className="space-y-1 text-sm text-blue-800">
                <p><strong>Employee:</strong> sarah@dayflow.com / password123</p>
                <p><strong>Admin:</strong> admin@dayflow.com / admin123</p>
                <p><strong>Manager:</strong> manager@dayflow.com / manager123</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;

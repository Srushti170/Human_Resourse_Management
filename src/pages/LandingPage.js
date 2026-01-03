import { Link } from 'react-router-dom';
import { Lock, Users, BarChart3, Shield } from 'lucide-react';
import { Button } from '../components/ui/button';
import { motion } from 'framer-motion';

const LandingPage = () => {
  return (
    <div className="min-h-screen relative">
      {/* Background Image */}
      <div 
        className="absolute inset-0 bg-cover bg-center bg-no-repeat -z-10"
        style={{ backgroundImage: 'url(/3b7797db-3b2c-4c30-9649-fa4d3e2f8e9f.jpg)' }}
      >
        {/* Optional: Add overlay for better text readability */}
        <div className="absolute inset-0 bg-white/80 backdrop-blur-sm"></div>
      </div>

      <header className="border-b border-slate-200 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto flex h-16 items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="h-10 w-10 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-xl font-bold text-white">D</span>
            </div>
            <span className="text-xl font-bold" style={{ fontFamily: 'Manrope' }}>DAYFLOW</span>
          </div>
          <nav className="flex items-center gap-6">
            <a href="#platform" className="text-sm font-medium text-slate-600 hover:text-slate-900">Platform</a>
            <a href="#solutions" className="text-sm font-medium text-slate-600 hover:text-slate-900">Solutions</a>
            <a href="#about" className="text-sm font-medium text-slate-600 hover:text-slate-900">About Us</a>
          </nav>
        </div>
      </header>

      <main className="container mx-auto px-6 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl font-extrabold tracking-tight mb-6" style={{ fontFamily: 'Manrope' }}>
            Work Smarter with an all-in-one HR Solution
          </h1>
          <p className="text-lg text-slate-600 max-w-2xl mx-auto mb-12">
            Unifying people, pay, and potential. Select your role below to securely access your dedicated workspace.
          </p>
        </motion.div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto mb-20">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.2 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-violet-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-2xl transition-all duration-300" data-testid="employee-portal-card">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-16 w-16 rounded-xl bg-violet-100 flex items-center justify-center">
                    <Users className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">RESTRICTED ACCESS</span>
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Manrope' }}>Employee Portal</h2>
                <p className="text-slate-600 mb-6">
                  Access your attendance, leave requests, payslips, and team directory. Manage your work-life balance with ease.
                </p>
                <Link to="/login?role=employee">
                  <Button className="w-full bg-primary hover:bg-primary/90" size="lg" data-testid="employee-login-button">
                    <Lock className="mr-2 h-4 w-4" />
                    Employee Login
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.6, delay: 0.4 }}
          >
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/20 rounded-2xl blur-xl group-hover:blur-2xl transition-all"></div>
              <div className="relative bg-white rounded-2xl border border-slate-200 p-8 hover:shadow-2xl transition-all duration-300" data-testid="admin-portal-card">
                <div className="flex justify-between items-start mb-6">
                  <div className="h-16 w-16 rounded-xl bg-indigo-100 flex items-center justify-center">
                    <BarChart3 className="h-8 w-8 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-slate-400 bg-slate-100 px-3 py-1 rounded-full">RESTRICTED ACCESS</span>
                </div>
                <h2 className="text-2xl font-bold mb-3" style={{ fontFamily: 'Manrope' }}>Admin & HR Console</h2>
                <p className="text-slate-600 mb-6">
                  Monitor attendance, approve leave requests, manage employees, and access comprehensive HR analytics.
                  Login to streamline your administrative tasks.
                </p>
                <Link to="/login?role=admin">
                  <Button className="w-full bg-primary hover:bg-primary/90" size="lg" data-testid="admin-login-button">
                    <Shield className="mr-2 h-4 w-4" />
                    Admin / HR Login
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-2 bg-white rounded-full border border-slate-200 px-6 py-3 shadow-sm">
            <Lock className="h-5 w-5 text-green-600" />
            <span className="text-sm font-medium">Secure SSL Connection • ISO 27001 Certified</span>
          </div>
        </motion.div>
      </main>

      <footer className="border-t border-slate-200 bg-white relative z-10">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4 text-sm text-slate-600">
            <p>© 2026 DAYFLOW Systems Inc. All rights reserved.</p>
            <div className="flex gap-6">
              <a href="#privacy" className="hover:text-slate-900">Privacy Policy</a>
              <a href="#terms" className="hover:text-slate-900">Terms of Service</a>
              <a href="#support" className="hover:text-slate-900">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { DollarSign, Download, Eye } from 'lucide-react';
import { Button } from '../components/ui/button';
import axios from 'axios';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const Payroll = () => {
  const [payslips, setPayslips] = useState([]);

  useEffect(() => {
    fetchPayslips();
  }, []);

  const fetchPayslips = async () => {
    try {
      const response = await axios.get(`${API_URL}/payslips`);
      setPayslips(response.data);
    } catch (error) {
      console.error('Error fetching payslips:', error);
    }
  };

  const demoPayslip = {
    month: 'November',
    year: 2024,
    gross_pay: 5000,
    deductions: 750,
    net_pay: 4250
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="payroll-page">
        <div>
          <h1 className="text-4xl font-extrabold mb-2" style={{ fontFamily: 'Manrope' }}>Payroll & Payslip</h1>
          <p className="text-slate-600">View and download your payslips</p>
        </div>

        <Card className="border-slate-200 shadow-sm bg-gradient-to-br from-primary/5 to-purple-50">
          <CardHeader>
            <CardTitle className="text-xl">Latest Payslip</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Gross Pay</p>
                <p className="text-2xl font-bold text-slate-900">${demoPayslip.gross_pay}</p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Deductions</p>
                <p className="text-2xl font-bold text-red-600">-${demoPayslip.deductions}</p>
              </div>
              <div className="p-4 bg-white rounded-lg">
                <p className="text-sm text-slate-600 mb-1">Net Pay</p>
                <p className="text-2xl font-bold text-green-600">${demoPayslip.net_pay}</p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button variant="outline" className="flex-1">
                <Eye className="mr-2 h-4 w-4" />
                View Payslip
              </Button>
              <Button className="flex-1">
                <Download className="mr-2 h-4 w-4" />
                Download PDF
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Payslip History
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-slate-500">
              <DollarSign className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>No payslip history available</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default Payroll;

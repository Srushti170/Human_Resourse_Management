import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Calendar } from 'lucide-react';

const MyAttendance = () => {
  return (
    <Layout>
      <div className="space-y-6" data-testid="my-attendance-page">
        <div>
          <h1 className="text-4xl font-extrabold mb-2" style={{ fontFamily: 'Manrope' }}>My Attendance</h1>
          <p className="text-slate-600">View your attendance history and records</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Attendance Records
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center py-12 text-slate-500">
              <Calendar className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <p>Attendance history will be displayed here</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default MyAttendance;

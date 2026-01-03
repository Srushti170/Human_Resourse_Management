import { useState, useEffect } from 'react';
import Layout from '../components/Layout';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Button } from '../components/ui/button';
import { useAuth } from '../context/AuthContext';
import axios from 'axios';
import { toast } from 'sonner';
import { User, Mail, Phone, MapPin, GraduationCap, Briefcase, CreditCard } from 'lucide-react';

const API_URL = process.env.REACT_APP_BACKEND_URL + '/api';

const EmployeeProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState({});
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setProfile(user);
    }
  }, [user]);

  const handleUpdate = async (section, data) => {
    setLoading(true);
    try {
      await axios.put(`${API_URL}/users/${user.id}`, { [section]: data });
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Update failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <div className="space-y-6" data-testid="employee-profile-page">
        <div>
          <h1 className="text-4xl font-extrabold mb-2" style={{ fontFamily: 'Manrope' }}>Employee Profile</h1>
          <p className="text-slate-600">View and manage your personal information</p>
        </div>

        <Card className="border-slate-200 shadow-sm">
          <CardContent className="p-6">
            <div className="flex items-center gap-6 mb-6">
              <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold">
                {user?.name?.charAt(0)}
              </div>
              <div>
                <h2 className="text-2xl font-bold mb-1">{user?.name}</h2>
                <p className="text-slate-600">{user?.designation}</p>
                <p className="text-sm text-slate-500 mt-1">Employee ID: {user?.employee_id}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="personal" className="w-full">
          <TabsList className="grid w-full grid-cols-5 mb-6">
            <TabsTrigger value="personal" data-testid="tab-personal">Personal</TabsTrigger>
            <TabsTrigger value="contact" data-testid="tab-contact">Contact</TabsTrigger>
            <TabsTrigger value="education" data-testid="tab-education">Education</TabsTrigger>
            <TabsTrigger value="professional" data-testid="tab-professional">Professional</TabsTrigger>
            <TabsTrigger value="banking" data-testid="tab-banking">Banking</TabsTrigger>
          </TabsList>

          <TabsContent value="personal">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Full Name</Label>
                    <Input value={user?.name} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Email</Label>
                    <Input value={user?.email} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Date of Birth</Label>
                    <Input type="date" placeholder="Select date" />
                  </div>
                  <div className="space-y-2">
                    <Label>Gender</Label>
                    <select className="w-full h-10 rounded-lg border border-slate-200 px-3">
                      <option>Select gender</option>
                      <option>Male</option>
                      <option>Female</option>
                      <option>Other</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Marital Status</Label>
                    <select className="w-full h-10 rounded-lg border border-slate-200 px-3">
                      <option>Select status</option>
                      <option>Single</option>
                      <option>Married</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Nationality</Label>
                    <Input placeholder="Enter nationality" />
                  </div>
                </div>
                <Button className="mt-6" disabled={loading}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="contact">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Phone className="h-5 w-5" />
                  Contact & Address
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Phone Number</Label>
                    <Input type="tel" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-2">
                    <Label>Emergency Contact</Label>
                    <Input type="tel" placeholder="+1 (555) 000-0000" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Address</Label>
                    <Input placeholder="Street address" />
                  </div>
                  <div className="space-y-2">
                    <Label>City</Label>
                    <Input placeholder="City" />
                  </div>
                  <div className="space-y-2">
                    <Label>State / Province</Label>
                    <Input placeholder="State" />
                  </div>
                  <div className="space-y-2">
                    <Label>Postal Code</Label>
                    <Input placeholder="ZIP / Postal code" />
                  </div>
                  <div className="space-y-2">
                    <Label>Country</Label>
                    <Input placeholder="Country" />
                  </div>
                </div>
                <Button className="mt-6" disabled={loading}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="education">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5" />
                  Education Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Highest Qualification</Label>
                    <select className="w-full h-10 rounded-lg border border-slate-200 px-3">
                      <option>Select qualification</option>
                      <option>High School</option>
                      <option>Bachelor's Degree</option>
                      <option>Master's Degree</option>
                      <option>PhD</option>
                    </select>
                  </div>
                  <div className="space-y-2">
                    <Label>Field of Study</Label>
                    <Input placeholder="e.g., Computer Science" />
                  </div>
                  <div className="space-y-2">
                    <Label>University / Institution</Label>
                    <Input placeholder="Name of institution" />
                  </div>
                  <div className="space-y-2">
                    <Label>Graduation Year</Label>
                    <Input type="number" placeholder="YYYY" />
                  </div>
                  <div className="space-y-2 md:col-span-2">
                    <Label>Certifications</Label>
                    <Input placeholder="List any relevant certifications" />
                  </div>
                </div>
                <Button className="mt-6" disabled={loading}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="professional">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Professional & Office Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Designation</Label>
                    <Input value={user?.designation} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Department / Team</Label>
                    <Input value={user?.team} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Employee ID</Label>
                    <Input value={user?.employee_id} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Join Date</Label>
                    <Input value={user?.join_date} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Office Location</Label>
                    <Input placeholder="Office location" />
                  </div>
                  <div className="space-y-2">
                    <Label>Work Email</Label>
                    <Input value={user?.email} readOnly />
                  </div>
                  <div className="space-y-2">
                    <Label>Manager</Label>
                    <Input placeholder="Manager name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Employment Type</Label>
                    <select className="w-full h-10 rounded-lg border border-slate-200 px-3">
                      <option>Full-time</option>
                      <option>Part-time</option>
                      <option>Contract</option>
                    </select>
                  </div>
                </div>
                <Button className="mt-6" disabled={loading}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="banking">
            <Card className="border-slate-200 shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  Banking Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Bank Name</Label>
                    <Input placeholder="Enter bank name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Holder Name</Label>
                    <Input placeholder="As per bank account" />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Number</Label>
                    <Input type="password" placeholder="••••••••••" />
                  </div>
                  <div className="space-y-2">
                    <Label>IFSC / Routing Number</Label>
                    <Input placeholder="Enter IFSC/Routing number" />
                  </div>
                  <div className="space-y-2">
                    <Label>Branch</Label>
                    <Input placeholder="Branch name" />
                  </div>
                  <div className="space-y-2">
                    <Label>Account Type</Label>
                    <select className="w-full h-10 rounded-lg border border-slate-200 px-3">
                      <option>Savings</option>
                      <option>Current</option>
                    </select>
                  </div>
                </div>
                <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
                  <p className="text-sm text-amber-900">
                    <strong>Security Note:</strong> Your banking information is encrypted and securely stored. Only HR personnel have access to this information.
                  </p>
                </div>
                <Button className="mt-6" disabled={loading}>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </Layout>
  );
};

export default EmployeeProfile;

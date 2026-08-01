'use client';

import { useEffect, useState } from 'react';
import {
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Loader2,
  Shield,
  Briefcase
} from 'lucide-react';
import { motion, LayoutGroup } from 'framer-motion';

import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Button } from '@/app/warden/Template/components/ui/button';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from '@/app/warden/Template/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/warden/Template/components/ui/dialog';
import { Field, FieldLabel } from '@/app/warden/Template/components/ui/field';
import { Input } from '@/app/warden/Template/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/warden/Template/components/ui/select';
import { Alert, AlertDescription } from '@/app/warden/Template/components/ui/alert';

// ============ TYPES ============
type AdminProfile = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  address: string;
  department: string;
  joiningDate: string;
  status: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  profilePic: string;
  officeLocation: string;
  profileVisibility: 'public' | 'private';
};

const defaultAdminProfile: AdminProfile = {
  _id: 'admin_1',
  name: 'System Admin',
  email: 'admin@bwf.org',
  phone: '+91 9876543210',
  gender: 'male',
  dob: '1985-06-15',
  address: 'BWF Headquarters, Main Office',
  department: 'IT & Administration',
  joiningDate: '2020-01-01',
  status: 'Active',
  emergencyName: 'Emergency Contact',
  emergencyPhone: '+91 9876500000',
  emergencyRelation: 'Spouse',
  profilePic: 'https://ui-avatars.com/api/?name=System+Admin&background=3b82f6&color=fff&rounded=true&bold=true',
  officeLocation: 'HQ - Block A',
  profileVisibility: 'private',
};

const displayDate = (value?: string) => {
  if (!value) return 'N/A';
  const d = new Date(value);
  if (isNaN(d.getTime())) return 'N/A';
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(d);
};

export default function AdminProfilePage() {
  const [admin, setAdmin] = useState<AdminProfile | null>(null);
  const [editedData, setEditedData] = useState<AdminProfile>(defaultAdminProfile);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [modalActiveTab, setModalActiveTab] = useState('personal');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  // Fetch from localStorage to mock API
  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 600));
      
      const stored = localStorage.getItem('adminProfileData');
      if (stored) {
        const parsed = JSON.parse(stored);
        setAdmin(parsed);
        setEditedData(parsed);
      } else {
        setAdmin(defaultAdminProfile);
        setEditedData(defaultAdminProfile);
      }
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError('Failed to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, []);

  const handleSaveProfile = async () => {
    try {
      setSaving(true);
      setError('');
      setSuccessMessage('');

      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 800));

      const updated = { ...editedData };
      
      // Ensure profile pic matches name change logic if needed, but we'll leave it as is
      if (updated.name !== admin?.name && updated.profilePic.includes('ui-avatars')) {
        updated.profilePic = `https://ui-avatars.com/api/?name=${encodeURIComponent(updated.name)}&background=3b82f6&color=fff&rounded=true&bold=true`;
      }

      localStorage.setItem('adminProfileData', JSON.stringify(updated));
      setAdmin(updated);
      setEditedData(updated);
      setIsEditingProfile(false);
      
      setSuccessMessage('Profile updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
      
      // Dispatch event so top-nav could re-render if it was listening, though a reload is fine
      window.dispatchEvent(new Event('profileUpdated'));
    } catch (err: any) {
      setError('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) return;
    setSuccessMessage('Password updated successfully!');
    setPasswordData({ oldPassword: '', newPassword: '' });
    setTimeout(() => setSuccessMessage(''), 3000);
  };

  const handleEditClick = () => {
    setEditedData(admin || defaultAdminProfile);
    setIsEditingProfile(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen bg-[#F4F5F7]">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p className="text-slate-500 font-medium">Loading admin profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-8 space-y-6 max-w-6xl mx-auto bg-[#F4F5F7] min-h-screen">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800 font-medium">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {admin ? (
        <>
          {/* Profile Header Card */}
          <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden rounded-[32px]">
            <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-white pointer-events-none" />
            <CardContent className="flex flex-col md:flex-row gap-8 pt-8 pb-8 relative z-10 px-6 md:px-10">
              
              {/* Avatar Section */}
              <div className="flex flex-col items-center">
                <div className="w-24 h-24 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-700 text-2xl font-bold shadow-sm p-1">
                  <img
                    src={admin.profilePic}
                    alt={admin.name}
                    className="w-full h-full object-cover rounded-full"
                  />
                </div>
                <h2 className="mt-4 font-bold text-xl text-slate-900">{admin.name}</h2>
                <Badge
                  variant={admin.status === 'Active' ? 'default' : 'secondary'}
                  className={`mt-2 ${admin.status === 'Active' ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-100 border-none' : ''}`}
                >
                  {admin.status}
                </Badge>
              </div>

              {/* Info Grid */}
              <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
                <InfoItem label="Email" value={admin.email} icon={<Mail className="w-4 h-4" />} />
                <InfoItem label="Phone" value={admin.phone} icon={<Phone className="w-4 h-4" />} />
                <InfoItem label="Gender" value={admin.gender ? admin.gender.charAt(0).toUpperCase() + admin.gender.slice(1) : 'N/A'} icon={<User className="w-4 h-4" />} />
                <InfoItem label="Department" value={admin.department} icon={<Briefcase className="w-4 h-4" />} />
                <InfoItem label="Office Location" value={admin.officeLocation} icon={<MapPin className="w-4 h-4" />} />
                <InfoItem label="System Role" value="Super Admin" icon={<Shield className="w-4 h-4" />} />
              </div>

              <div className="flex md:flex-col justify-end items-start pt-2">
                <Button onClick={handleEditClick} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full h-10 px-6 font-medium shadow-sm w-full md:w-auto">
                  Edit Profile
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Detailed Info Tabs */}
          <div className="w-full space-y-6 mt-8">
            <div className="flex items-center bg-white p-1.5 rounded-full w-full md:w-max border border-slate-200/60 shadow-sm">
              {['personal', 'professional', 'emergency'].map((tab) => {
                const isActive = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`relative flex-1 md:flex-none flex items-center justify-center px-6 py-2 rounded-full text-[13.5px] font-bold transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-50'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="profile-tab-pill-admin"
                        className="absolute inset-0 bg-slate-100 rounded-full"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2 capitalize">
                      {tab}
                    </span>
                  </button>
                );
              })}
            </div>

            {activeTab === 'personal' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="bg-white border-slate-200 shadow-sm rounded-[32px]">
                  <CardHeader className="pb-4 border-b border-slate-100/50 px-8 pt-8">
                    <CardTitle className="text-lg font-bold">Personal Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 p-8">
                    <DetailField label="Full Name" value={admin.name} />
                    <DetailField label="Email" value={admin.email} />
                    <DetailField label="Phone" value={admin.phone} />
                    <DetailField label="Gender" value={admin.gender ? admin.gender.charAt(0).toUpperCase() + admin.gender.slice(1) : 'N/A'} />
                    <DetailField label="Date of Birth" value={displayDate(admin.dob)} />
                    <DetailField label="Address" value={admin.address} />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'professional' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="bg-white border-slate-200 shadow-sm rounded-[32px]">
                  <CardHeader className="pb-4 border-b border-slate-100/50 px-8 pt-8">
                    <CardTitle className="text-lg font-bold">Professional Information</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 p-8">
                    <DetailField label="Department" value={admin.department} />
                    <DetailField label="Office Location" value={admin.officeLocation} />
                    <DetailField label="System Role" value="Super Admin" />
                    <DetailField label="Joining Date" value={displayDate(admin.joiningDate)} />
                    <DetailField label="Account Status" value={admin.status} />
                  </CardContent>
                </Card>
              </div>
            )}

            {activeTab === 'emergency' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
                <Card className="bg-white border-slate-200 shadow-sm rounded-[32px]">
                  <CardHeader className="pb-4 border-b border-slate-100/50 px-8 pt-8">
                    <CardTitle className="text-lg font-bold">Emergency Contact</CardTitle>
                  </CardHeader>
                  <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 p-8">
                    <DetailField label="Contact Name" value={admin.emergencyName} />
                    <DetailField label="Contact Phone" value={admin.emergencyPhone} />
                    <DetailField label="Relation" value={admin.emergencyRelation} />
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </>
      ) : null}

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white sm:rounded-3xl flex flex-col p-0 border border-slate-200">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Profile</DialogTitle>
            <DialogDescription className="text-[14px] text-slate-500">
              Update your system administrator profile information below
            </DialogDescription>
          </DialogHeader>

          <LayoutGroup id="profile-modal-tabs-group">
            <div className="flex items-center bg-slate-100/80 p-1 rounded-full mx-6 mt-4 mb-2 border border-slate-200/60 shadow-inner">
              {['personal', 'professional', 'emergency', 'security'].map((tab) => {
                const isActive = modalActiveTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setModalActiveTab(tab)}
                    className={`relative flex-1 flex items-center justify-center px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="modal-tab-pill-admin-edit"
                        className="absolute inset-0 bg-white rounded-full shadow-sm border border-slate-200/50"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <span className="relative z-10 flex items-center gap-2 capitalize">
                      {tab}
                    </span>
                  </button>
                );
              })}
            </div>
          </LayoutGroup>

          <div className="flex-1 overflow-y-auto px-6 pb-6 min-h-[400px]">
            {modalActiveTab === 'personal' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <TextField label="Full Name" value={editedData.name} onChange={(v) => setEditedData({ ...editedData, name: v })} />
                <TextField label="Email Address" value={editedData.email} type="email" onChange={(v) => setEditedData({ ...editedData, email: v })} />
                <TextField label="Phone Number" value={editedData.phone} type="tel" onChange={(v) => setEditedData({ ...editedData, phone: v })} />
                <SelectField
                  label="Gender"
                  value={editedData.gender || 'male'}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  onChange={(v) => setEditedData({ ...editedData, gender: v })}
                />
                <TextField label="Date of Birth" type="date" value={editedData.dob} onChange={(v) => setEditedData({ ...editedData, dob: v })} />
                <TextField label="Address" value={editedData.address} onChange={(v) => setEditedData({ ...editedData, address: v })} />
              </div>
            )}

            {modalActiveTab === 'professional' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <TextField label="Department" value={editedData.department} onChange={(v) => setEditedData({ ...editedData, department: v })} />
                <TextField label="Office Location" value={editedData.officeLocation} onChange={(v) => setEditedData({ ...editedData, officeLocation: v })} />
                <TextField label="Joining Date" type="date" value={editedData.joiningDate} onChange={(v) => setEditedData({ ...editedData, joiningDate: v })} />
                <SelectField
                  label="Status"
                  value={editedData.status || 'Active'}
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'On Leave', label: 'On Leave' },
                    { value: 'Inactive', label: 'Inactive' },
                  ]}
                  onChange={(v) => setEditedData({ ...editedData, status: v })}
                />
              </div>
            )}

            {modalActiveTab === 'emergency' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <TextField label="Contact Name" value={editedData.emergencyName} onChange={(v) => setEditedData({ ...editedData, emergencyName: v })} />
                <TextField label="Contact Phone" value={editedData.emergencyPhone} onChange={(v) => setEditedData({ ...editedData, emergencyPhone: v })} />
                <TextField label="Relation" value={editedData.emergencyRelation} onChange={(v) => setEditedData({ ...editedData, emergencyRelation: v })} />
              </div>
            )}

            {modalActiveTab === 'security' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4 pt-4 max-w-md mx-auto">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm text-slate-600 mb-4 text-center font-medium">
                  Update your password to keep your administrator account secure.
                </div>
                <TextField label="Current Password" type="password" value={passwordData.oldPassword} onChange={(v) => setPasswordData({ ...passwordData, oldPassword: v })} />
                <TextField label="New Password" type="password" value={passwordData.newPassword} onChange={(v) => setPasswordData({ ...passwordData, newPassword: v })} />
                <div className="pt-2 flex justify-end">
                  <Button onClick={handlePasswordChange} className="bg-slate-900 text-white rounded-full font-medium">
                    Update Password
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-5 bg-slate-50/50 border-t border-slate-100 flex justify-end gap-3 mt-auto rounded-b-3xl">
            <Button
              variant="outline"
              onClick={() => setIsEditingProfile(false)}
              className="rounded-full px-6 h-10 text-[13px] font-medium text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-sm"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSaveProfile}
              disabled={saving}
              className="rounded-full px-8 h-10 text-[13px] font-medium bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
            >
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ HELPER COMPONENTS ============

function InfoItem({ label, value, icon }: { label: string; value?: string; icon: React.ReactNode }) {
  return (
    <div className="flex gap-3">
      <div className="w-9 h-9 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100 shadow-sm">
        {icon}
      </div>
      <div>
        <p className="text-[12px] font-bold text-slate-400 flex items-center gap-1.5 mb-0.5 uppercase tracking-wider">
          {label}
        </p>
        <p className="font-semibold text-slate-900 text-[14px] leading-tight">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1.5">
      <p className="text-[12px] font-bold text-slate-400 uppercase tracking-wider">{label}</p>
      <p className="font-bold text-slate-900 text-[15px]">{value || 'N/A'}</p>
    </div>
  );
}

function TextField({
  label,
  value,
  onChange,
  type = 'text',
  placeholder,
}: {
  label: string;
  value?: string;
  onChange: (value: string) => void;
  type?: string;
  placeholder?: string;
}) {
  return (
    <Field>
      <FieldLabel className="font-bold text-slate-700">{label}</FieldLabel>
      <Input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="rounded-xl border-slate-200 focus:border-blue-500 focus:ring-blue-500/20 transition-all bg-slate-50 hover:bg-white focus:bg-white"
      />
    </Field>
  );
}

function SelectField({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <Field>
      <FieldLabel className="font-bold text-slate-700">{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger className="rounded-xl border-slate-200 bg-slate-50 hover:bg-white focus:bg-white transition-all">
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent className="rounded-xl border-slate-100 shadow-lg">
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value} className="rounded-lg font-medium cursor-pointer focus:bg-slate-100 py-2">
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}

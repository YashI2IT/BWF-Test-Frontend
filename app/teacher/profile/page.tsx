'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Calendar,
  Mail,
  MapPin,
  Phone,
  User,
  Users,
  AlertCircle,
  Loader2,
  GraduationCap,
  Activity,
} from 'lucide-react';
import { getAvatarUrl } from '@/app/lib/avatar';
import { motion, LayoutGroup } from 'framer-motion';
import api from '@/app/lib/api';

import { Badge } from '@/app/teacher/Template/components/ui/badge';
import { Button } from '@/app/teacher/Template/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/app/teacher/Template/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/app/teacher/Template/components/ui/dialog';
import { Field, FieldGroup, FieldLabel } from '@/app/teacher/Template/components/ui/field';
import { Input } from '@/app/teacher/Template/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/teacher/Template/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/teacher/Template/components/ui/tabs';
import { Alert, AlertDescription } from '@/app/teacher/Template/components/ui/alert';

// ============ TYPES ============
type TeacherProfile = {
  _id: string;
  name: string;
  email: string;
  phone: string;
  gender: string;
  dob: string;
  address: string;
  qualification: string;
  joiningDate: string;
  status: string;
  emergencyName: string;
  emergencyPhone: string;
  emergencyRelation: string;
  profilePic: string;
  hostel: string;
  hostelLocation: string;
  profileVisibility: 'public' | 'private';
  createdAt?: string;
  updatedAt?: string;
};

const emptyProfile: TeacherProfile = {
  _id: '',
  name: '',
  email: '',
  phone: '',
  gender: 'male',
  dob: '',
  address: '',
  qualification: '',
  joiningDate: '',
  status: 'Active',
  emergencyName: '',
  emergencyPhone: '',
  emergencyRelation: '',
  profilePic: '',
  hostel: '',
  hostelLocation: '',
  profileVisibility: 'public',
};

const normalizeProfile = (data: any): TeacherProfile => {
  const safeDate = (d: any) => {
    if (!d) return '';
    const date = new Date(d);
    return isNaN(date.getTime()) ? '' : date.toISOString().split('T')[0];
  };

  return {
    _id: data?._id || '',
    name: data?.name || '',
    email: data?.email || '',
    phone: data?.phone || '',
    gender: data?.gender || 'male',
    dob: safeDate(data?.dob),
    address: data?.address || '',
    qualification: data?.qualification || '',
    joiningDate: safeDate(data?.joiningDate),
    status: data?.status || 'Active',
    emergencyName: data?.emergencyName || '',
    emergencyPhone: data?.emergencyPhone || '',
    emergencyRelation: data?.emergencyRelation || '',
    profilePic: data?.profilePic || '',
    hostel: data?.hostel || '',
    hostelLocation: data?.hostelLocation || '',
    profileVisibility: data?.profileVisibility || 'public',
  };
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



export default function ProfilePage() {
  const [teacher, setTeacher] = useState<TeacherProfile | null>(null);
  const [editedData, setEditedData] = useState<TeacherProfile>(emptyProfile);
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [modalActiveTab, setModalActiveTab] = useState('personal');
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      
      const res = await api.get('/teacher/profile');
      const normalized = normalizeProfile(res.data);
      setTeacher(normalized);
      setEditedData(normalized);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to fetch profile. Please try again.');
      setTeacher(null);
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

      const payload: any = {
        name: editedData.name || '',
        email: editedData.email || '',
        phone: editedData.phone || '',
        gender: editedData.gender || 'male',
        address: editedData.address || '',
        qualification: editedData.qualification || '',
        status: editedData.status || 'Active',
        hostel: editedData.hostel || '',
        hostelLocation: editedData.hostelLocation || '',
        profileVisibility: editedData.profileVisibility || 'public'
      };

      if (editedData.dob) payload.dob = editedData.dob;
      if (editedData.joiningDate) payload.joiningDate = editedData.joiningDate;
      if (editedData.profilePic) payload.profilePic = editedData.profilePic;

      if (editedData.emergencyName || editedData.emergencyPhone || editedData.emergencyRelation) {
        payload.emergencyName = editedData.emergencyName;
        payload.emergencyPhone = editedData.emergencyPhone;
        payload.emergencyRelation = editedData.emergencyRelation;
      }

      const res = await api.patch('/teacher/profile', payload);

      const normalized = normalizeProfile(res.data);
      setTeacher(normalized);
      setEditedData(normalized);
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated successfully!');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.response?.data?.message || err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) return;
    try {
      await api.patch('/teacher/profile/password', passwordData);
      setPasswordData({ oldPassword: '', newPassword: '' });
      setSuccessMessage('Password updated successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error(err);
      setError(err.response?.data?.message || 'Failed to update password.');
    }
  };

  const handleEditClick = () => {
    setEditedData(teacher || emptyProfile);
    setIsEditingProfile(true);
  };

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center min-h-screen">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
          <p>Loading profile...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6 max-w-6xl mx-auto">
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {successMessage && (
        <Alert className="bg-green-50 border-green-200">
          <AlertDescription className="text-green-800">
            {successMessage}
          </AlertDescription>
        </Alert>
      )}

      {teacher ? (
        <>
          {/* Profile Header Card */}
          <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background pattern/gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-white pointer-events-none" />
        <CardContent className="flex flex-col md:flex-row gap-8 pt-8 pb-8 relative z-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-700 text-2xl font-bold shadow-sm p-1">
              {teacher?.profilePic ? (
                <img
                  src={teacher.profilePic}
                  alt={teacher?.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <img
                  src={getAvatarUrl(teacher?.name || 'Teacher')}
                  alt={teacher?.name || 'Teacher'}
                  className="w-full h-full object-cover rounded-full bg-slate-50"
                />
              )}
            </div>
            <h2 className="mt-4 font-bold text-xl text-slate-900">{teacher?.name}</h2>
            <Badge
              variant={
                teacher?.status === 'Active'
                  ? 'default'
                  : teacher?.status === 'On Leave'
                    ? 'secondary'
                    : 'destructive'
              }
              className="mt-2"
            >
              {teacher?.status}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
            <InfoItem
              label="Email"
              value={teacher?.email}
              icon={<Mail className="w-4 h-4" />}
            />
            <InfoItem
              label="Phone"
              value={teacher?.phone}
              icon={<Phone className="w-4 h-4" />}
            />
            <InfoItem
              label="Gender"
              value={teacher?.gender ? teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1) : 'N/A'}
              icon={<User className="w-4 h-4" />}
            />
            <InfoItem
              label="Hostel"
              value={teacher?.hostel || 'N/A'}
              icon={<MapPin className="w-4 h-4" />}
            />
            <InfoItem
              label="Location"
              value={teacher?.hostelLocation || 'N/A'}
              icon={<MapPin className="w-4 h-4" />}
            />
            <InfoItem
              label="Joining Date"
              value={displayDate(teacher?.joiningDate)}
              icon={<CalendarDays className="w-4 h-4" />}
            />
          </div>

          <div className="flex md:flex-col justify-end">
            <Button onClick={handleEditClick} className="bg-slate-900 hover:bg-slate-800 text-white rounded-full h-10 px-6 font-medium shadow-sm w-full md:w-auto">
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Detailed Info Tabs */}
      <div className="w-full space-y-6 mt-8">
        <div className="flex items-center bg-slate-100/80 p-1 rounded-full w-full md:w-max border border-slate-200/60 shadow-inner">
          {['personal', 'professional', 'emergency'].map((tab) => {
            const isActive = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`relative flex-1 md:flex-none flex items-center justify-center px-6 py-1.5 rounded-full text-[13.5px] font-bold transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
              >
                {isActive && (
                  <motion.div
                    layoutId="profile-tab-pill-v2"
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

        {activeTab === 'personal' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100/50">
                <CardTitle className="text-lg">Personal Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 pt-6">
                <DetailField label="Full Name" value={teacher?.name} />
                <DetailField label="Email" value={teacher?.email} />
                <DetailField label="Phone" value={teacher?.phone} />
                <DetailField label="Gender" value={teacher?.gender ? teacher.gender.charAt(0).toUpperCase() + teacher.gender.slice(1) : 'N/A'} />
                <DetailField label="Date of Birth" value={displayDate(teacher?.dob)} />
                <DetailField label="Address" value={teacher?.address} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'professional' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100/50">
                <CardTitle className="text-lg">Professional Information</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 pt-6">
                <DetailField
                  label="Hostel"
                  value={teacher?.hostel || 'N/A'}
                />
                <DetailField
                  label="Hostel Location"
                  value={teacher?.hostelLocation || 'N/A'}
                />
                <DetailField label="Qualification" value={teacher?.qualification} />
                <DetailField
                  label="Joining Date"
                  value={displayDate(teacher?.joiningDate)}
                />
                <DetailField label="Status" value={teacher?.status} />
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === 'emergency' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <Card className="bg-white border-slate-200 shadow-sm">
              <CardHeader className="pb-4 border-b border-slate-100/50">
                <CardTitle className="text-lg">Emergency Contact</CardTitle>
              </CardHeader>
              <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12 pt-6">
                <DetailField
                  label="Contact Name"
                  value={teacher?.emergencyName}
                />
                <DetailField
                  label="Contact Phone"
                  value={teacher?.emergencyPhone}
                />
                <DetailField
                  label="Relation"
                  value={teacher?.emergencyRelation}
                />
              </CardContent>
            </Card>
          </div>
        )}
      </div>
      </>
      ) : (
        <div className="p-8 flex items-center justify-center bg-white border border-slate-200 rounded-xl shadow-sm">
          <p className="text-slate-500">Failed to load profile. Please refresh the page.</p>
        </div>
      )}

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden bg-white sm:rounded-2xl flex flex-col p-0 border border-slate-200">
          <DialogHeader className="px-6 pt-6 pb-4 border-b border-slate-100">
            <DialogTitle className="text-xl font-bold text-slate-900">Edit Profile</DialogTitle>
            <DialogDescription className="text-[14px] text-slate-500">
              Update your profile information below
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
                        layoutId="modal-tab-pill-teacher"
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
                <TextField
                  label="Full Name"
                  value={editedData.name}
                  onChange={(v) => setEditedData({ ...editedData, name: v })}
                />
                <TextField
                  label="Email Address"
                  value={editedData.email}
                  type="email"
                  onChange={(v) => setEditedData({ ...editedData, email: v })}
                />
                <TextField
                  label="Phone Number"
                  value={editedData.phone}
                  type="tel"
                  onChange={(v) => setEditedData({ ...editedData, phone: v })}
                />
                <SelectField
                  label="Gender"
                  value={editedData.gender || 'male'}
                  options={[
                    { value: 'male', label: 'Male' },
                    { value: 'female', label: 'Female' },
                    { value: 'other', label: 'Other' },
                  ]}
                  onChange={(v) =>
                    setEditedData({
                      ...editedData,
                      gender: v,
                    })
                  }
                />
                <TextField
                  label="Date of Birth"
                  type="date"
                  value={editedData.dob}
                  onChange={(v) =>
                    setEditedData({ ...editedData, dob: v })
                  }
                />
                <TextField
                  label="Address"
                  value={editedData.address}
                  onChange={(v) =>
                    setEditedData({ ...editedData, address: v })
                  }
                />
                <SelectField
                  label="Profile Visibility"
                  value={editedData.profileVisibility || 'public'}
                  options={[
                    { value: 'public', label: 'Public' },
                    { value: 'private', label: 'Private' },
                  ]}
                  onChange={(v) =>
                    setEditedData({
                      ...editedData,
                      profileVisibility: v as 'public' | 'private',
                    })
                  }
                />
              </div>
            )}

            {modalActiveTab === 'professional' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <TextField
                  label="Qualification"
                  value={editedData.qualification}
                  onChange={(v) =>
                    setEditedData({ ...editedData, qualification: v })
                  }
                />
                <TextField
                  label="Joining Date"
                  type="date"
                  value={editedData.joiningDate}
                  onChange={(v) =>
                    setEditedData({ ...editedData, joiningDate: v })
                  }
                />
                <SelectField
                  label="Status"
                  value={editedData.status || 'Active'}
                  options={[
                    { value: 'Active', label: 'Active' },
                    { value: 'On Leave', label: 'On Leave' },
                    { value: 'Inactive', label: 'Inactive' },
                  ]}
                  onChange={(v) =>
                    setEditedData({
                      ...editedData,
                      status: v,
                    })
                  }
                />
                <TextField
                  label="Hostel"
                  value={editedData.hostel}
                  onChange={(v) =>
                    setEditedData({ ...editedData, hostel: v })
                  }
                />
                <TextField
                  label="Hostel Location"
                  value={editedData.hostelLocation}
                  onChange={(v) =>
                    setEditedData({ ...editedData, hostelLocation: v })
                  }
                />
              </div>
            )}

            {modalActiveTab === 'emergency' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 grid grid-cols-1 md:grid-cols-2 gap-4 pt-4">
                <TextField
                  label="Contact Name"
                  value={editedData.emergencyName}
                  onChange={(v) =>
                    setEditedData({ ...editedData, emergencyName: v })
                  }
                />
                <TextField
                  label="Contact Phone"
                  value={editedData.emergencyPhone}
                  onChange={(v) =>
                    setEditedData({ ...editedData, emergencyPhone: v })
                  }
                />
                <TextField
                  label="Relation"
                  value={editedData.emergencyRelation}
                  onChange={(v) =>
                    setEditedData({ ...editedData, emergencyRelation: v })
                  }
                />
              </div>
            )}

            {modalActiveTab === 'security' && (
              <div className="animate-in fade-in slide-in-from-bottom-2 duration-300 space-y-4 pt-4 max-w-md mx-auto">
                <div className="bg-slate-50 border border-slate-100 p-4 rounded-xl text-sm text-slate-600 mb-4 text-center">
                  Update your password to keep your account secure.
                </div>
                <TextField
                  label="Current Password"
                  type="password"
                  value={passwordData.oldPassword}
                  onChange={(v) =>
                    setPasswordData({ ...passwordData, oldPassword: v })
                  }
                />
                <TextField
                  label="New Password"
                  type="password"
                  value={passwordData.newPassword}
                  onChange={(v) =>
                    setPasswordData({ ...passwordData, newPassword: v })
                  }
                />
                <div className="pt-2 flex justify-end">
                  <Button onClick={handlePasswordChange} className="bg-slate-900 text-white rounded-full">
                    Update Password
                  </Button>
                </div>
              </div>
            )}
          </div>

          <div className="px-6 py-5 bg-white border-t border-slate-100 flex justify-end gap-3 mt-auto rounded-b-2xl">
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
      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center text-slate-500 shrink-0 border border-slate-100">
        {icon}
      </div>
      <div>
        <p className="text-[13px] font-medium text-slate-500 flex items-center gap-1.5 mb-0.5">
          {icon} {label}
        </p>
        <p className="font-semibold text-slate-900 text-sm leading-tight">{value || 'N/A'}</p>
      </div>
    </div>
  );
}

function DetailField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="space-y-1">
      <p className="text-[13px] font-medium text-slate-500">{label}</p>
      <p className="font-medium text-slate-900 text-[15px]">{value || 'N/A'}</p>
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
      <FieldLabel>{label}</FieldLabel>
      <Input
        type={type}
        value={value || ''}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
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
      <FieldLabel>{label}</FieldLabel>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger>
          <SelectValue placeholder="Select an option" />
        </SelectTrigger>
        <SelectContent>
          {options.map((opt) => (
            <SelectItem key={opt.value} value={opt.value}>
              {opt.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </Field>
  );
}
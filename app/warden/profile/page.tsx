'use client';

import { useEffect, useMemo, useState } from 'react';
import {
  CalendarDays,
  Mail,
  MapPin,
  Phone,
  User,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { getAvatarUrl } from '@/app/lib/avatar';
import { motion, LayoutGroup, AnimatePresence } from 'framer-motion';
import api from '@/app/lib/api';

import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Button } from '@/app/warden/Template/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { Field, FieldGroup, FieldLabel } from '@/app/warden/Template/components/ui/field';
import { Input } from '@/app/warden/Template/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/app/warden/Template/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/app/warden/Template/components/ui/tabs';
import { Alert, AlertDescription } from '@/app/warden/Template/components/ui/alert';

type HostelRef = {
  _id: string;
  name: string;
  location: string;
};

type EmergencyContact = {
  name?: string;
  phone?: string;
  relation?: string;
};

type WardenProfile = {
  _id: string;
  name?: string;
  email?: string;
  phone?: string;
  gender?: 'male' | 'female' | 'other';
  DOB?: string;
  address?: string;
  qualification?: string;
  joiningDate?: string;
  status?: 'Active' | 'On Leave' | 'Inactive';
  emergencyContact?: EmergencyContact;
  profilePic?: string;
  hostelName?: HostelRef | string;
  createdAt?: string;
  updatedAt?: string;
};

const normalizeProfile = (data: any): WardenProfile => {
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
    DOB: safeDate(data?.DOB),
    address: data?.address || '',
    qualification: data?.qualification || '',
    joiningDate: safeDate(data?.joiningDate),
    status: data?.status || 'Active',
    emergencyContact: data?.emergencyContact || {
      name: '',
      phone: '',
      relation: '',
    },
    profilePic: data?.profilePic || '',
    hostelName: data?.hostelName || '',
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

const getHostelName = (hostel?: HostelRef | string) => {
  if (!hostel) return 'N/A';
  if (typeof hostel === 'string') return hostel;
  return hostel.name || 'N/A';
};

const getHostelLocation = (hostel?: HostelRef | string) => {
  if (!hostel) return 'N/A';
  if (typeof hostel === 'string') return 'N/A'; // Can't get location from ID
  return hostel.location || 'N/A';
};

const emptyProfile: WardenProfile = {
  _id: '',
  name: '',
  email: '',
  phone: '',
  gender: 'male',
  DOB: '',
  address: '',
  qualification: '',
  joiningDate: '',
  status: 'Active',
  emergencyContact: { name: '', phone: '', relation: '' },
  profilePic: '',
};

export default function ProfilePage() {
  const [warden, setWarden] = useState<WardenProfile | null>(null);
  const [editedData, setEditedData] = useState<WardenProfile>(emptyProfile);
  const [hostels, setHostels] = useState<HostelRef[]>([]);
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
      
      const res = await api.get('/warden/profile');
      const normalized = normalizeProfile(res.data);
      setWarden(normalized);
      setEditedData(normalized);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.response?.data?.message || 'Failed to fetch profile. Please try again.');
      setWarden(null);
    } finally {
      setLoading(false);
    }
  };

  const fetchHostels = async () => {
    try {
      const res = await api.get('/warden/hostels');
      setHostels(res.data || []);
    } catch (err) {
      // Failed to fetch hostels silently
    }
  };

  useEffect(() => {
    fetchProfile();
    fetchHostels();
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
      };

      if (editedData.hostelName) {
        payload.hostelName = typeof editedData.hostelName === 'string' 
          ? editedData.hostelName 
          : editedData.hostelName._id;
      }

      if (editedData.DOB) payload.DOB = editedData.DOB;
      if (editedData.joiningDate) payload.joiningDate = editedData.joiningDate;
      if (editedData.profilePic) payload.profilePic = editedData.profilePic;

      if (
        editedData.emergencyContact?.name ||
        editedData.emergencyContact?.phone ||
        editedData.emergencyContact?.relation
      ) {
        payload.emergencyContact = editedData.emergencyContact;
      }

      const res = await api.put('/warden/profile', payload);

      const normalized = normalizeProfile(res.data);
      setWarden(normalized);
      setEditedData(normalized);
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated successfully!');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      const backendError = err.response?.data?.error || err.response?.data?.message;
      setError(backendError ? `Backend Error: ${backendError}` : err.message || 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handleEditClick = () => {
    setEditedData(warden || emptyProfile);
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

      {warden ? (
        <>
          {/* Profile Header Card */}
          <Card className="bg-white border-slate-200 shadow-sm relative overflow-hidden">
        {/* Subtle decorative background pattern/gradient */}
        <div className="absolute inset-0 bg-gradient-to-br from-slate-50/50 to-white pointer-events-none" />
        <CardContent className="flex flex-col md:flex-row gap-8 pt-8 pb-8 relative z-10">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-white border border-slate-200 rounded-full flex items-center justify-center text-slate-700 text-2xl font-bold shadow-sm p-1">
              {warden?.profilePic ? (
                <img
                  src={warden.profilePic}
                  alt={warden?.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <img
                  src={getAvatarUrl(warden?.name || 'Warden')}
                  alt={warden?.name || 'Warden'}
                  className="w-full h-full object-cover rounded-full bg-slate-50"
                />
              )}
            </div>
            <h2 className="mt-4 font-bold text-xl text-slate-900">{warden?.name}</h2>
            <Badge
              variant={
                warden?.status === 'Active'
                  ? 'default'
                  : warden?.status === 'On Leave'
                    ? 'secondary'
                    : 'destructive'
              }
              className="mt-2"
            >
              {warden?.status}
            </Badge>
          </div>

          {/* Info Grid */}
          <div className="flex-1 grid grid-cols-2 md:grid-cols-3 gap-6">
            <InfoItem
              label="Email"
              value={warden?.email}
              icon={<Mail className="w-4 h-4" />}
            />
            <InfoItem
              label="Phone"
              value={warden?.phone}
              icon={<Phone className="w-4 h-4" />}
            />
            <InfoItem
              label="Gender"
              value={warden?.gender ? warden.gender.charAt(0).toUpperCase() + warden.gender.slice(1) : 'N/A'}
              icon={<User className="w-4 h-4" />}
            />
            <InfoItem
              label="Hostel"
              value={warden?.hostelName ? getHostelName(warden.hostelName) : 'N/A'}
              icon={<MapPin className="w-4 h-4" />}
            />
            <InfoItem
              label="Location"
              value={warden?.hostelName ? getHostelLocation(warden.hostelName) : 'N/A'}
              icon={<MapPin className="w-4 h-4" />}
            />
            <InfoItem
              label="Joining Date"
              value={displayDate(warden?.joiningDate)}
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
                <DetailField label="Full Name" value={warden?.name} />
                <DetailField label="Email" value={warden?.email} />
                <DetailField label="Phone" value={warden?.phone} />
                <DetailField label="Gender" value={warden?.gender ? warden.gender.charAt(0).toUpperCase() + warden.gender.slice(1) : 'N/A'} />
                <DetailField label="Date of Birth" value={displayDate(warden?.joiningDate)} />
                <DetailField label="Address" value={warden?.address} />
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
                  value={warden?.hostelName ? getHostelName(warden.hostelName) : 'N/A'}
                />
                <DetailField
                  label="Hostel Location"
                  value={warden?.hostelName ? getHostelLocation(warden.hostelName) : 'N/A'}
                />
                <DetailField label="Qualification" value={warden?.qualification} />
                <DetailField
                  label="Joining Date"
                  value={displayDate(warden?.joiningDate)}
                />
                <DetailField label="Status" value={warden?.status} />
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
                  value={warden?.emergencyContact?.name}
                />
                <DetailField
                  label="Contact Phone"
                  value={warden?.emergencyContact?.phone}
                />
                <DetailField
                  label="Relation"
                  value={warden?.emergencyContact?.relation}
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
              {['personal', 'professional', 'emergency'].map((tab) => {
                const isActive = modalActiveTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setModalActiveTab(tab)}
                    className={`relative flex-1 flex items-center justify-center px-4 py-1.5 rounded-full text-[13px] font-bold transition-colors duration-300 ${isActive ? 'text-slate-900' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-200/50'}`}
                  >
                    {isActive && (
                      <motion.div
                        layoutId="modal-tab-pill-v2"
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

          <div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-6 h-[420px]">
            <AnimatePresence mode="wait">
            {modalActiveTab === 'personal' && (
              <motion.div
                key="personal"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
              <TextField
                label="Full Name"
                value={editedData.name}
                onChange={(v) =>
                  setEditedData({ ...editedData, name: v })
                }
              />
              <TextField
                label="Email"
                type="email"
                value={editedData.email}
                onChange={(v) =>
                  setEditedData({ ...editedData, email: v })
                }
              />
              <TextField
                label="Phone"
                type="tel"
                value={editedData.phone}
                onChange={(v) =>
                  setEditedData({ ...editedData, phone: v })
                }
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
                    gender: v as 'male' | 'female' | 'other',
                  })
                }
              />
              <TextField
                label="Date of Birth"
                type="date"
                value={editedData.DOB}
                onChange={(v) =>
                  setEditedData({ ...editedData, DOB: v })
                }
              />
              <TextField
                label="Address"
                value={editedData.address}
                onChange={(v) =>
                  setEditedData({ ...editedData, address: v })
                }
              />
              </motion.div>
            )}

            {modalActiveTab === 'professional' && (
              <motion.div
                key="professional"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
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
                    status: v as 'Active' | 'On Leave' | 'Inactive',
                  })
                }
              />
              <SelectField
                label="Assigned Hostel"
                value={typeof editedData.hostelName === 'string' ? editedData.hostelName : (editedData.hostelName?._id || '')}
                options={hostels.map(h => ({ value: h._id, label: h.name }))}
                onChange={(v) =>
                  setEditedData({
                    ...editedData,
                    hostelName: v,
                  })
                }
              />
              {warden?.hostelName && (
                <>
                  <DetailField
                    label="Hostel Location"
                    value={getHostelLocation(warden.hostelName)}
                  />
                </>
              )}
              </motion.div>
            )}

            {modalActiveTab === 'emergency' && (
              <motion.div
                key="emergency"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
              <TextField
                label="Emergency Contact Name"
                value={editedData.emergencyContact?.name}
                onChange={(v) =>
                  setEditedData({
                    ...editedData,
                    emergencyContact: {
                      ...editedData.emergencyContact,
                      name: v,
                    },
                  })
                }
              />
              <TextField
                label="Emergency Contact Phone"
                type="tel"
                value={editedData.emergencyContact?.phone}
                onChange={(v) =>
                  setEditedData({
                    ...editedData,
                    emergencyContact: {
                      ...editedData.emergencyContact,
                      phone: v,
                    },
                  })
                }
              />
              <TextField
                label="Relation"
                value={editedData.emergencyContact?.relation}
                onChange={(v) =>
                  setEditedData({
                    ...editedData,
                    emergencyContact: {
                      ...editedData.emergencyContact,
                      relation: v,
                    },
                  })
                }
              />
              </motion.div>
            )}
            </AnimatePresence>
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

function InfoItem({
  label,
  value,
  icon,
}: {
  label: string;
  value?: string;
  icon?: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex gap-2 text-sm text-gray-600 font-medium mb-1">
        {icon}
        {label}
      </div>
      <div className="text-base font-semibold text-gray-900">
        {value || 'N/A'}
      </div>
    </div>
  );
}

function DetailField({
  label,
  value,
}: {
  label: string;
  value?: string;
}) {
  return (
    <div>
      <p className="text-sm text-gray-600 font-medium mb-1">{label}</p>
      <p className="text-base text-gray-900">{value || 'N/A'}</p>
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
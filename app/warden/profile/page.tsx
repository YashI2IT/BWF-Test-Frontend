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

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL ?? 'http://localhost:5000';

const emptyProfile: WardenProfile = {
  _id: '',
  name: 'Demo Warden',
  email: 'warden@demo.com',
  phone: '9999999999',
  gender: 'male',
  DOB: '',
  address: 'Demo Address',
  qualification: 'N/A',
  joiningDate: '',
  status: 'Active',
  emergencyContact: { name: '', phone: '', relation: '' },
  profilePic: '',
};

const toDateInput = (value?: string) =>
  value ? new Date(value).toISOString().slice(0, 10) : '';

const displayDate = (value?: string) =>
  value
    ? new Intl.DateTimeFormat('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }).format(new Date(value))
    : 'N/A';

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

const normalizeProfile = (profile: WardenProfile): WardenProfile => ({
  ...emptyProfile,
  ...profile,
  DOB: profile.DOB ? toDateInput(profile.DOB) : '',
  joiningDate: profile.joiningDate ? toDateInput(profile.joiningDate) : '',
  emergencyContact: {
    ...emptyProfile.emergencyContact,
    ...profile.emergencyContact,
  },
});

export default function ProfilePage() {
  const [warden, setWarden] = useState<WardenProfile | null>(null);
  const [editedData, setEditedData] = useState<WardenProfile>(emptyProfile);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const initials = useMemo(() => {
    return (warden?.name || 'W')
      .split(' ')
      .map((p) => p[0])
      .join('')
      .slice(0, 2)
      .toUpperCase();
  }, [warden?.name]);

  const fetchProfile = async () => {
    try {
      setLoading(true);
      setError('');
      const token = localStorage.getItem('accessToken');

      if (!token) {
        // ✅ fallback if no token
        const fallback = normalizeProfile(emptyProfile);
        setWarden(fallback);
        setEditedData(fallback);
        return;
      }

      const res = await fetch(`${API_BASE_URL}/warden/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!res.ok) {
        throw new Error(`Failed to fetch profile: ${res.status}`);
      }

      const text = await res.text();
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);
      console.log('Fetched warden data:', data);
      const normalized = normalizeProfile(data);
      setWarden(normalized);
      setEditedData(normalized);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      // ✅ fallback to demo data
      const fallback = normalizeProfile(emptyProfile);
      setWarden(fallback);
      setEditedData(fallback);
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

      const token = localStorage.getItem('accessToken');
      console.log('Token exists:', !!token);

      if (!token) {
        setError('Authentication required. Please login again.');
        return;
      }

      // Build payload - only include non-empty fields
      const payload: any = {
        name: editedData.name || '',
        email: editedData.email || '',
        phone: editedData.phone || '',
        gender: editedData.gender || 'male',
        address: editedData.address || '',
        qualification: editedData.qualification || '',
        status: editedData.status || 'Active',
      };

      // Only add date fields if they have values
      if (editedData.DOB) {
        payload.DOB = editedData.DOB;
      }
      if (editedData.joiningDate) {
        payload.joiningDate = editedData.joiningDate;
      }
      if (editedData.profilePic) {
        payload.profilePic = editedData.profilePic;
      }

      // Add emergency contact if it has data
      if (
        editedData.emergencyContact?.name ||
        editedData.emergencyContact?.phone ||
        editedData.emergencyContact?.relation
      ) {
        payload.emergencyContact = editedData.emergencyContact;
      }

      const url = `${API_BASE_URL}/warden/profile`;
      console.log('Saving to URL:', url);
      console.log('Payload:', payload);

      const res = await fetch(url, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      });

      console.log('Response status:', res.status, res.statusText);

      if (!res.ok) {
        const text = await res.text();
        console.log('Error response text:', text);
        let errorMessage = 'Failed to update profile';
        try {
          const errorData = JSON.parse(text);
          errorMessage = errorData.message || errorMessage;
        } catch {
          errorMessage = `Server error: ${res.status} ${res.statusText}`;
        }
        throw new Error(errorMessage);
      }

      const text = await res.text();
      console.log('Success response text:', text);
      if (!text) {
        throw new Error('Empty response from server');
      }

      const data = JSON.parse(text);
      console.log('Updated warden data:', data);
      const normalized = normalizeProfile(data);

      setWarden(normalized);
      setEditedData(normalized);
      setIsEditingProfile(false);
      setSuccessMessage('Profile updated successfully!');

      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err: any) {
      console.error('Error saving profile:', err);
      setError(err.message || 'Failed to update profile');
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

      {/* Profile Header Card */}
      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="flex gap-8 pt-6 pb-6">
          {/* Avatar Section */}
          <div className="flex flex-col items-center">
            <div className="w-24 h-24 bg-gradient-to-br from-blue-400 to-indigo-600 rounded-full flex items-center justify-center text-white text-2xl font-bold shadow-lg">
              {warden?.profilePic ? (
                <img
                  src={warden.profilePic}
                  alt={warden?.name}
                  className="w-full h-full object-cover rounded-full"
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <h2 className="mt-4 font-bold text-xl">{warden?.name}</h2>
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

          <Button onClick={handleEditClick} size="lg" className="h-fit">
            Edit Profile
          </Button>
        </CardContent>
      </Card>

      {/* Detailed Info Tabs */}
      <Tabs defaultValue="personal" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="personal">Personal</TabsTrigger>
          <TabsTrigger value="professional">Professional</TabsTrigger>
          <TabsTrigger value="emergency">Emergency</TabsTrigger>
        </TabsList>

        <TabsContent value="personal">
          <Card>
            <CardHeader>
              <CardTitle>Personal Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
              <DetailField label="Full Name" value={warden?.name} />
              <DetailField label="Email" value={warden?.email} />
              <DetailField label="Phone" value={warden?.phone} />
              <DetailField label="Gender" value={warden?.gender ? warden.gender.charAt(0).toUpperCase() + warden.gender.slice(1) : 'N/A'} />
              <DetailField label="Date of Birth" value={displayDate(warden?.joiningDate)} />
              <DetailField label="Address" value={warden?.address} />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="professional">
          <Card>
            <CardHeader>
              <CardTitle>Professional Information</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
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
        </TabsContent>

        <TabsContent value="emergency">
          <Card>
            <CardHeader>
              <CardTitle>Emergency Contact</CardTitle>
            </CardHeader>
            <CardContent className="grid grid-cols-2 gap-6">
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
        </TabsContent>
      </Tabs>

      {/* Edit Profile Dialog */}
      <Dialog open={isEditingProfile} onOpenChange={setIsEditingProfile}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Profile</DialogTitle>
            <DialogDescription>
              Update your profile information below
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="personal" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="personal">Personal</TabsTrigger>
              <TabsTrigger value="professional">Professional</TabsTrigger>
              <TabsTrigger value="emergency">Emergency</TabsTrigger>
            </TabsList>

            <TabsContent value="personal" className="space-y-4 mt-4">
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
            </TabsContent>

            <TabsContent value="professional" className="space-y-4 mt-4">
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
              {warden?.hostelName && (
                <>
                  <DetailField
                    label="Assigned Hostel"
                    value={getHostelName(warden.hostelName)}
                  />
                  <DetailField
                    label="Hostel Location"
                    value={getHostelLocation(warden.hostelName)}
                  />
                </>
              )}
            </TabsContent>

            <TabsContent value="emergency" className="space-y-4 mt-4">
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
            </TabsContent>
          </Tabs>

          <div className="flex gap-3 justify-end mt-6">
            <Button
              variant="outline"
              onClick={() => setIsEditingProfile(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={saving}>
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save Changes'
              )}
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
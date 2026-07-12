'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Plus, Search } from 'lucide-react';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/warden/Template/components/ui/alert-dialog';
import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Button } from '@/app/warden/Template/components/ui/button';
import { Card, CardContent } from '@/app/warden/Template/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/warden/Template/components/ui/dialog';
import { Field, FieldLabel } from '@/app/warden/Template/components/ui/field';
import { Input } from '@/app/warden/Template/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/warden/Template/components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/warden/Template/components/ui/table';
import { Textarea } from '@/app/warden/Template/components/ui/textarea';
import api from '@/app/lib/api';

const ITEMS_PER_PAGE = 10;
const STAFF_ROLES = ['Teacher', 'Academic Staff', 'Accountant', 'Driver', 'Cook', 'Guard', 'Cleaner', 'Warden Assistant', 'Maintenance', 'Other'];
const SHIFTS = ['Morning', 'Evening', 'Night', 'Rotational'];
const EMPLOYMENT_TYPES = ['Full-time', 'Part-time', 'Contract', 'Volunteer'];
const STATUSES = ['Active', 'On Leave', 'Inactive'];

type Gender = 'male' | 'female' | 'other';
type StaffStatus = 'Active' | 'On Leave' | 'Inactive';
type Shift = 'Morning' | 'Evening' | 'Night' | 'Rotational';
type EmploymentType = 'Full-time' | 'Part-time' | 'Contract' | 'Volunteer';

interface StaffMember {
  _id: string;
  userId?: string;
  auth_id?: string;
  password: string;
  role: 'staff';
  roleName: string;
  name: string;
  gender: Gender;
  DOB: string;
  email: string;
  contactNumber: string;
  address: string;
  hostelName: string | { _id: string; name?: string };
  department: string;
  employmentType: EmploymentType;
  shift: Shift;
  joiningDate: string;
  salary: string;
  status: StaffStatus;
  adhaarCard: string;
  panCard: string;
  emergencyContact: { name: string; phone: string; relation: string };
  notes: string;
}

interface StaffFormProps {
  data: StaffMember;
  onChange: (data: StaffMember) => void;
  wantsAccount: boolean;
  onAccountToggle: (wants: boolean) => void;
  isEdit?: boolean;
}

const emptyStaff: StaffMember = {
  _id: '',
  auth_id: '',
  password: '',
  role: 'staff',
  roleName: 'Teacher',
  name: '',
  gender: 'male',
  DOB: '',
  email: '',
  contactNumber: '',
  address: '',
  hostelName: 'BWF Hostel',
  department: 'Academic',
  employmentType: 'Full-time',
  shift: 'Morning',
  joiningDate: '',
  salary: '',
  status: 'Active',
  adhaarCard: '',
  panCard: '',
  emergencyContact: { name: '', phone: '', relation: '' },
  notes: '',
};

const normalizeRoleName = (value: string) => value.trim().toLowerCase().replace(/\b\w/g, (char) => char.toUpperCase());

type ApiError = {
  response?: { data?: { message?: string } };
  message?: string;
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError;
  return apiError.response?.data?.message || apiError.message || fallback;
};

const toDateInput = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
};

const hostelLabel = (hostelName: StaffMember['hostelName']) => {
  if (typeof hostelName === 'string') return hostelName;
  return hostelName?.name || 'BWF Hostel';
};

const normalizeStaff = (staff: Partial<StaffMember> & { _id: string }): StaffMember => ({
  ...emptyStaff,
  ...staff,
  _id: staff._id,
  auth_id: staff.auth_id || '',
  password: '',
  DOB: toDateInput(staff.DOB || ''),
  joiningDate: toDateInput(staff.joiningDate || ''),
  gender: (staff.gender || 'male') as Gender,
  employmentType: (staff.employmentType || 'Full-time') as EmploymentType,
  shift: (staff.shift || 'Morning') as Shift,
  status: (staff.status || 'Active') as StaffStatus,
  salary: staff.salary !== undefined ? String(staff.salary) : '',
  emergencyContact: {
    ...emptyStaff.emergencyContact,
    ...staff.emergencyContact,
  },
});

const buildStaffPayload = (data: StaffMember, includeCredentials = false, requirePassword = false) => {
  const payload: Record<string, unknown> = {
    roleName: normalizeRoleName(data.roleName),
    name: data.name.trim(),
    gender: data.gender,
    DOB: data.DOB || undefined,
    email: data.email?.trim() || undefined,
    contactNumber: data.contactNumber.trim(),
    address: data.address?.trim() || undefined,
    department: data.department?.trim() || undefined,
    employmentType: data.employmentType,
    shift: data.shift,
    joiningDate: data.joiningDate,
    salary: data.salary ? Number(data.salary) : undefined,
    status: data.status,
    adhaarCard: data.adhaarCard?.trim() || undefined,
    panCard: data.panCard?.trim() || undefined,
    emergencyContact: {
      name: data.emergencyContact?.name?.trim() || undefined,
      phone: data.emergencyContact?.phone?.trim() || undefined,
      relation: data.emergencyContact?.relation?.trim() || undefined,
    },
    notes: data.notes?.trim() || undefined,
  };

  if (includeCredentials && data.auth_id?.trim()) {
    payload.auth_id = data.auth_id.trim();

    if (requirePassword || data.password?.trim()) {
      payload.password = data.password.trim();
    }
  }

  return payload;
};

const buildStaffCredentialsPayload = (data: StaffMember, selectedStaff: StaffMember) => {
  const payload: Record<string, string> = {};
  const nextAuthId = data.auth_id?.trim();

  if (nextAuthId && nextAuthId !== selectedStaff.auth_id) {
    payload.auth_id = nextAuthId;
  }

  if (data.password?.trim()) {
    payload.password = data.password.trim();
  }

  return payload;
};

const statusColor = (status: StaffStatus) => {
  if (status === 'Active') return 'bg-emerald-50 text-emerald-700 border-none';
  if (status === 'On Leave') return 'bg-amber-50 text-amber-700 border-none';
  return 'bg-slate-100 text-slate-600 border-none';
};

const StaffForm = ({ 
  data, 
  onChange, 
  wantsAccount, 
  onAccountToggle,
  isEdit = false
}: StaffFormProps) => (
  <div className="p-6 space-y-8 text-[13px]">
    {!isEdit && (
      <div className="bg-slate-50/50 p-4 rounded-2xl border border-slate-100 mb-2">
        <div className="flex items-center justify-between px-2">
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-bold text-slate-700 uppercase tracking-tight">Login Account</span>
            <span className="text-[10px] text-slate-400 font-medium">Enable login access (ID & Password) for this staff?</span>
          </div>
          <Button
            type="button"
            size="sm"
            variant={wantsAccount ? 'default' : 'outline'}
            onClick={() => onAccountToggle(!wantsAccount)}
            className={`h-9 px-6 rounded-xl text-[10px] font-bold transition-all ${wantsAccount ? 'bg-indigo-600 shadow-md shadow-indigo-100' : 'text-slate-400 border-slate-200'}`}
          >
            {wantsAccount ? 'Account Enabled' : 'No Account'}
          </Button>
        </div>
      </div>
    )}

    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Full Name *</FieldLabel><Input value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} placeholder="e.g. Meera Kapoor" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" /></Field>
      
      {wantsAccount && (
        <>
          <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Auth ID *</FieldLabel><Input value={data.auth_id} onChange={(e) => onChange({ ...data, auth_id: e.target.value })} placeholder="Staff login ID" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" /></Field>
          <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Password *</FieldLabel><Input type="password" value={data.password} onChange={(e) => onChange({ ...data, password: e.target.value })} placeholder="Staff login password" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" /></Field>
        </>
      )}

      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Role / Designation *</FieldLabel>
        <Select 
          value={data.roleName} 
          onValueChange={(value) => {
            const updates: Partial<StaffMember> = { roleName: value };
            if (value === 'Teacher' || value === 'Academic Staff') {
              updates.department = 'Academics';
            }
            onChange({ ...data, ...updates });
          }}
        >
          <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-bold text-xs">
            <SelectValue placeholder="Select Role" />
          </SelectTrigger>
          <SelectContent className="rounded-xl">
            {STAFF_ROLES.map((role) => <SelectItem key={role} value={role}>{role}</SelectItem>)}
          </SelectContent>
        </Select>
      </Field>

      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Department (Optional)</FieldLabel>
        <Input 
          value={data.department} 
          onChange={(e) => onChange({ ...data, department: e.target.value })} 
          placeholder="e.g. Science, Kitchen..." 
          className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" 
        />
      </Field>

      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Gender *</FieldLabel><Select value={data.gender} onValueChange={(value) => onChange({ ...data, gender: value as Gender })}><SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl"><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent></Select></Field>
      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Phone *</FieldLabel><Input value={data.contactNumber} onChange={(e) => onChange({ ...data, contactNumber: e.target.value })} placeholder="10-digit number" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" /></Field>
      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Email *</FieldLabel><Input type="email" value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} placeholder="Staff email address" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" /></Field>
      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Date of Birth</FieldLabel><Input type="date" value={data.DOB} onChange={(e) => onChange({ ...data, DOB: e.target.value })} className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" /></Field>
      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Joining Date *</FieldLabel><Input type="date" value={data.joiningDate} onChange={(e) => onChange({ ...data, joiningDate: e.target.value })} className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" /></Field>
      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Employment Type</FieldLabel><Select value={data.employmentType} onValueChange={(value) => onChange({ ...data, employmentType: value as EmploymentType })}><SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl">{EMPLOYMENT_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></Field>
      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Shift</FieldLabel><Select value={data.shift} onValueChange={(value) => onChange({ ...data, shift: value as Shift })}><SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl">{SHIFTS.map((shift) => <SelectItem key={shift} value={shift}>{shift}</SelectItem>)}</SelectContent></Select></Field>
      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Status</FieldLabel><Select value={data.status} onValueChange={(value) => onChange({ ...data, status: value as StaffStatus })}><SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-bold text-xs"><SelectValue /></SelectTrigger><SelectContent className="rounded-xl">{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent></Select></Field>
      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Monthly Salary</FieldLabel><Input value={data.salary} onChange={(e) => onChange({ ...data, salary: e.target.value })} placeholder="Amount" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" /></Field>
      <Field className="md:col-span-2"><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Address</FieldLabel><Input value={data.address} onChange={(e) => onChange({ ...data, address: e.target.value })} className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" /></Field>
      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Aadhaar</FieldLabel><Input value={data.adhaarCard} onChange={(e) => onChange({ ...data, adhaarCard: e.target.value })} className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" /></Field>
      <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">PAN</FieldLabel><Input value={data.panCard} onChange={(e) => onChange({ ...data, panCard: e.target.value })} className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" /></Field>
    </div>

    <div className="pt-6 border-t border-slate-100">
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Emergency Contact</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[9px] uppercase">Contact Name</FieldLabel><Input value={data.emergencyContact.name} onChange={(e) => onChange({ ...data, emergencyContact: { ...data.emergencyContact, name: e.target.value } })} className="h-9 rounded-lg bg-slate-50/50 text-xs font-medium border-none" /></Field>
        <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[9px] uppercase">Contact Phone</FieldLabel><Input value={data.emergencyContact.phone} onChange={(e) => onChange({ ...data, emergencyContact: { ...data.emergencyContact, phone: e.target.value } })} className="h-9 rounded-lg bg-slate-50/50 text-xs font-medium border-none" /></Field>
        <Field><FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[9px] uppercase">Relation</FieldLabel><Input value={data.emergencyContact.relation} onChange={(e) => onChange({ ...data, emergencyContact: { ...data.emergencyContact, relation: e.target.value } })} className="h-9 rounded-lg bg-slate-50/50 text-xs font-medium border-none" /></Field>
      </div>
    </div>

    <Field>
      <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Notes</FieldLabel>
      <Textarea
        value={data.notes}
        onChange={(e) => onChange({ ...data, notes: e.target.value })}
        maxLength={250}
        wrap="soft"
        className="h-24 min-h-24 max-h-24 w-full max-w-full min-w-0 resize-none overflow-x-hidden overflow-y-auto rounded-xl bg-slate-50 border-none whitespace-pre-wrap break-all font-medium text-xs leading-5 focus-visible:ring-1 focus-visible:ring-indigo-100"
        style={{
          overflowWrap: 'anywhere',
          wordBreak: 'break-word',
        }}
      />
    </Field>
  </div>
);

export default function StaffPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [roleSearch, setRoleSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<StaffMember | null>(null);
  const [staffMembers, setStaffMembers] = useState<StaffMember[]>([]);
  const [wantsAccount, setWantsAccount] = useState(false);
  const [formData, setFormData] = useState<StaffMember>(emptyStaff);

  useEffect(() => {
    const fetchStaff = async () => {
      try {
        const res = await api.get('/warden/staff');
        setStaffMembers(res.data.map(normalizeStaff));
      } catch (error: unknown) {
        alert(getErrorMessage(error, 'Failed to load staff.'));
      }
    };

    fetchStaff();
  }, []);

  const filteredStaff = useMemo(() => {
    return staffMembers
      .filter((staff) => {
        const query = searchTerm.toLowerCase();
        const matchesSearch = staff.name.toLowerCase().includes(query) || staff.contactNumber.includes(query) || staff.roleName.toLowerCase().includes(query);
        const matchesRole = !roleSearch.trim() || staff.roleName.toLowerCase().includes(roleSearch.trim().toLowerCase());
        const matchesStatus = statusFilter === 'all' || staff.status === statusFilter;
        return matchesSearch && matchesRole && matchesStatus;
      })
      .sort((a, b) => a.name.localeCompare(b.name) || a.roleName.localeCompare(b.roleName));
  }, [staffMembers, searchTerm, roleSearch, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filteredStaff.length / ITEMS_PER_PAGE));
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStaff = filteredStaff.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const resetFiltersPage = () => setCurrentPage(1);

  const openAddDialog = () => {
    setWantsAccount(false);
    setFormData({ 
      ...emptyStaff, 
      role: 'staff', 
      roleName: 'Teacher', 
      department: 'Academics' 
    });
    setIsAddOpen(true);
  };

  const handleRowClick = (staff: StaffMember) => {
    setSelectedStaff(staff);
    setFormData({ ...emptyStaff, ...staff, password: '', emergencyContact: staff.emergencyContact || emptyStaff.emergencyContact });
    setIsDetailOpen(true);
  };

  const validateForm = (requirePassword = false) => {
    if (!formData.name || !formData.contactNumber || !formData.roleName || !formData.joiningDate || !formData.email) {
      alert('Required fields missing.');
      return false;
    }

    if (wantsAccount && requirePassword) {
      if (!formData.auth_id || !formData.password) {
        alert('Auth ID and Password are required for accounts.');
        return false;
      }
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert('Invalid email format.');
      return false;
    }
    if (formData.contactNumber.length < 10) {
      alert('Invalid contact number.');
      return false;
    }
    return true;
  };

  const handleRegister = async () => {
    if (!validateForm(wantsAccount)) return;

    try {
      const res = await api.post('/warden/staff', buildStaffPayload(formData, wantsAccount, wantsAccount));
      setStaffMembers((current) => [normalizeStaff(res.data.staff), ...current]);
      setIsAddOpen(false);
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to register staff.'));
    }
  };

  const handleSave = async () => {
    if (!selectedStaff || !validateForm()) return;

    try {
      const profileRes = await api.put(`/warden/staff/${selectedStaff._id}`, buildStaffPayload(formData));
      let updatedStaff = normalizeStaff(profileRes.data);

      const credentialsPayload = buildStaffCredentialsPayload(formData, selectedStaff);
      if (Object.keys(credentialsPayload).length > 0) {
        const credentialsRes = await api.put(
          `/warden/staff/${selectedStaff._id}/credentials`,
          credentialsPayload
        );
        updatedStaff = normalizeStaff(credentialsRes.data.staff);
      }

      setStaffMembers((current) => current.map((staff) => (staff._id === selectedStaff._id ? updatedStaff : staff)));
      setSelectedStaff(updatedStaff);
      setIsDetailOpen(false);
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to update staff.'));
    }
  };

  const handleDelete = async () => {
    if (!selectedStaff) return;

    try {
      await api.delete(`/warden/staff/${selectedStaff._id}`);
      setStaffMembers((current) => current.filter((staff) => staff._id !== selectedStaff._id));
      setIsDeleteConfirmOpen(false);
      setIsDetailOpen(false);
      setSelectedStaff(null);
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to delete staff.'));
    }
  };

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#f8fafc] min-h-screen text-[13px]">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Staff Management</h1>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-medium">
            <span>Home</span> <span className="text-slate-300">/</span> <span className="text-indigo-500 font-semibold">Staff</span>
          </div>
        </div>
        <Button onClick={openAddDialog} className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-8 text-xs font-bold shadow-md transition-all active:scale-95">
          <Plus className="w-4 h-4 mr-2" /> Add Staff
        </Button>
      </div>

      <Card className="border border-slate-200/60 shadow-none rounded-4xl bg-white overflow-hidden animate-scale-in">
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-700">Staff List</h2>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-none font-bold px-2 py-0.5 rounded-md text-[10px]">{filteredStaff.length} Staff</Badge>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <Input placeholder="Search name, phone or role..." className="pl-10 h-10 bg-slate-50/50 border-slate-200 rounded-xl text-[12px] placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium transition-all" value={searchTerm} onChange={(e) => { setSearchTerm(e.target.value); resetFiltersPage(); }} />
            </div>
            <div className="relative w-full md:w-40 group">
              <Input placeholder="Search role..." className="h-10 bg-white border-slate-200 rounded-xl text-[12px] placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium transition-all" value={roleSearch} onChange={(e) => { setRoleSearch(e.target.value); resetFiltersPage(); }} />
            </div>

            <Select value={statusFilter} onValueChange={(value) => { setStatusFilter(value); resetFiltersPage(); }}>
              <SelectTrigger className="h-10 w-36 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors px-4"><SelectValue placeholder="All Status" /></SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl"><SelectItem value="all">All Status</SelectItem>{STATUSES.map((status) => <SelectItem key={status} value={status}>{status}</SelectItem>)}</SelectContent>
            </Select>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/10">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none">Name</TableHead>
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none">Role</TableHead>
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none">Department</TableHead>                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none">Shift</TableHead>
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none">Status</TableHead>
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none">Phone</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStaff.length > 0 ? (
                paginatedStaff.map((staff) => (
                  <TableRow key={staff._id} onClick={() => handleRowClick(staff)} className="border-b border-slate-50/50 bg-white hover:bg-indigo-50/40 transition-colors duration-150 cursor-pointer group">
                    <TableCell className="py-4 px-8 font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{staff.name}</TableCell>
                    <TableCell className="py-4 px-8 text-slate-700 font-semibold">{staff.roleName}</TableCell>
                    <TableCell className="py-4 px-8 text-slate-600">{staff.department}</TableCell>                    <TableCell className="py-4 px-8 text-slate-600">{staff.shift}</TableCell>
                    <TableCell className="py-4 px-8"><Badge variant="outline" className={`${statusColor(staff.status)} font-bold px-2 py-0.5 rounded-md text-[10px]`}>{staff.status}</Badge></TableCell>
                    <TableCell className="py-4 px-8 text-slate-600 tracking-wider">{staff.contactNumber}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={6} className="py-20 text-center text-black font-medium italic">No staff found matching your criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-50">
            <div className="text-[11px] text-slate-400 font-bold tracking-tight uppercase">Showing {filteredStaff.length > 0 ? startIdx + 1 : 0} to {Math.min(startIdx + ITEMS_PER_PAGE, filteredStaff.length)} of {filteredStaff.length} staff</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))} disabled={currentPage === 1} className="w-9 h-9 rounded-xl hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></Button>
              <div className="flex items-center gap-1.5">{Array.from({ length: totalPages }).map((_, i) => <Button key={i + 1} variant={currentPage === i + 1 ? 'default' : 'ghost'} className={`w-9 h-9 rounded-xl text-[11px] font-bold p-0 transition-all ${currentPage === i + 1 ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'text-slate-500 hover:bg-slate-100'}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Button>)}</div>
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="w-9 h-9 rounded-xl hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-0 bg-white">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
            <DialogHeader><DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Manage Staff Entry</DialogTitle></DialogHeader>
            <div className="flex gap-2"><Button variant="outline" onClick={() => setIsDeleteConfirmOpen(true)} className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 h-10 px-6 font-bold text-xs transition-all">Delete Account</Button><Button onClick={handleSave} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-8 font-bold text-xs shadow-md transition-all">Update Staff</Button></div>
          </div>
          <StaffForm 
            data={formData} 
            onChange={setFormData} 
            wantsAccount={!!formData.userId}
            onAccountToggle={() => {}} // Disabled in edit
            isEdit={true}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-0 bg-white">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
            <DialogHeader><DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Register New Staff</DialogTitle></DialogHeader>
            <div className="flex gap-2"><Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl h-10 px-6 text-xs font-bold text-slate-400 hover:bg-slate-50">Cancel</Button><Button onClick={handleRegister} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-10 font-bold text-xs shadow-lg shadow-indigo-100 transition-all">Complete Registration</Button></div>
          </div>
          <StaffForm 
            data={formData} 
            onChange={setFormData} 
            wantsAccount={wantsAccount}
            onAccountToggle={setWantsAccount}
          />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl border-none p-8">
          <AlertDialogHeader><AlertDialogTitle className="text-xl font-heavy">Permanent Deletion?</AlertDialogTitle><AlertDialogDescription className="text-slate-500 font-medium">Are you sure you want to remove {selectedStaff?.name}? This cannot be reverted.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3"><AlertDialogCancel className="rounded-xl border-none bg-slate-100 text-slate-600 font-bold">Nevermind</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-8">Confirm Deletion</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}





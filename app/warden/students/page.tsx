/* eslint-disable @next/next/no-img-element */
'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { motion, type Variants } from 'framer-motion';
import { Card, CardContent } from '@/app/warden/Template/components/ui/card';
import { Button } from '@/app/warden/Template/components/ui/button';
import { Input } from '@/app/warden/Template/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/warden/Template/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/warden/Template/components/ui/dialog';
import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/warden/Template/components/ui/select';
import { Tabs, TabsList, TabsTrigger } from '@/app/warden/Template/components/ui/tabs';
import { Field, FieldLabel } from '@/app/warden/Template/components/ui/field';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/warden/Template/components/ui/alert-dialog';
import { Skeleton } from '@/app/warden/Template/components/ui/skeleton';
import api from '@/app/lib/api';
import { getAvatarUrl } from '@/app/lib/avatar';

const containerVariants: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.25, 0.46, 0.45, 0.94] } }
};

const ITEMS_PER_PAGE = 10;

type TrustedPerson = {
  name?: string;
  phone?: string;
  relation?: string;
};

type Student = {
  _id: string;
  userId?: string;
  auth_id?: string;
  name: string;
  class: string;
  gender: 'male' | 'female' | 'other' | 'N/A';
  contactNumber?: string;
  DOB: string;
  email?: string;
  address?: string;
  schoolName?: string;
  adhaarCard?: string;
  panCard?: string;
  hostelName?: { _id: string; name: string };
  trustedPerson: TrustedPerson;
};

type StudentFormData = Omit<Student, '_id' | 'userId'> & {
  password: string;
};

type StudentFormProps = {
  data: StudentFormData;
  onChange: (data: StudentFormData) => void;
};

type ApiError = {
  response?: {
    data?: {
      message?: string;
    };
  };
  message?: string;
};

const emptyStudentForm: StudentFormData = {
  auth_id: '',
  password: '',
  name: '',
  class: '1',
  gender: 'N/A',
  contactNumber: '',
  DOB: '',
  email: '',
  address: '',
  schoolName: '',
  adhaarCard: '',
  panCard: '',
  trustedPerson: { name: '', phone: '', relation: '' },
};

const toDateInput = (value: string) => {
  if (!value) return '';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toISOString().slice(0, 10);
};

const getErrorMessage = (error: unknown, fallback: string) => {
  const apiError = error as ApiError;
  return apiError.response?.data?.message || apiError.message || fallback;
};

const normalizeStudent = (student: Partial<Student> & { _id: string }): Student => ({
  ...emptyStudentForm,
  ...student,
  _id: student._id,
  DOB: toDateInput(student.DOB || ''),
  gender: (student.gender && student.gender.toUpperCase() === 'N/A' ? 'N/A' : (student.gender || 'N/A').toLowerCase()) as Student['gender'],
  trustedPerson: {
    ...emptyStudentForm.trustedPerson,
    ...student.trustedPerson,
  },
});

const buildStudentPayload = (data: StudentFormData, includeCredentials = false, requirePassword = false) => {
  const payload: Record<string, unknown> = {
    name: data.name.trim(),
    DOB: data.DOB,
    gender: data.gender,
    contactNumber: data.contactNumber?.trim() || undefined,
    class: data.class,
    email: data.email?.trim() || undefined,
    address: data.address?.trim() || undefined,
    schoolName: data.schoolName?.trim() || undefined,
    adhaarCard: data.adhaarCard?.trim() || undefined,
    panCard: data.panCard?.trim() || undefined,
    trustedPerson: {
      name: data.trustedPerson?.name?.trim() || undefined,
      phone: data.trustedPerson?.phone?.trim() || undefined,
      relation: data.trustedPerson?.relation?.trim() || undefined,
    },
  };

  if (includeCredentials) {
    payload.auth_id = data.auth_id?.trim();

    if (requirePassword || data.password?.trim()) {
      payload.password = data.password.trim();
    }
  }

  return payload;
};

const buildStudentCredentialsPayload = (data: StudentFormData, selectedStudent: Student) => {
  const payload: Record<string, string> = {};
  const nextAuthId = data.auth_id?.trim();

  if (nextAuthId && nextAuthId !== selectedStudent.auth_id) {
    payload.auth_id = nextAuthId;
  }

  if (data.password?.trim()) {
    payload.password = data.password.trim();
  }

  return payload;
};

// Age Calculation Helper
const calculateAge = (dob: string) => {
  if (!dob) return '-';
  const birthDate = new Date(dob);
  const today = new Date();
  let age = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) age--;
  return age;
};

// Reusable Form Content Helper
const StudentForm = ({ data, onChange }: StudentFormProps) => (
  <div className="p-6 space-y-8 text-[13px]">
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Full Name *</FieldLabel>
        <Input value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} placeholder="e.g. Eleanor Pena" className="h-10 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Auth ID *</FieldLabel>
        <Input value={data.auth_id} onChange={(e) => onChange({ ...data, auth_id: e.target.value })} placeholder="Student login ID" className="h-10 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Password *</FieldLabel>
        <Input type="password" value={data.password} onChange={(e) => onChange({ ...data, password: e.target.value })} placeholder="Student login password" className="h-10 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Class *</FieldLabel>
        <Select value={data.class} onValueChange={(v) => onChange({ ...data, class: v })}>
          <SelectTrigger className="h-10 rounded-full px-4 bg-slate-50 border-none focus:ring-1 focus:ring-slate-300 font-bold text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-3xl p-1.5 border-slate-100 shadow-xl">
            <SelectItem value="nursery" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Nursery</SelectItem>
            <SelectItem value="lkg" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">LKG</SelectItem>
            <SelectItem value="ukg" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">UKG</SelectItem>
            {[...Array(12)].map((_, i) => (<SelectItem key={i + 1} value={`${i + 1}`} className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Class {i + 1}</SelectItem>))}
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Date of Birth *</FieldLabel>
        <Input type="date" value={data.DOB} onChange={(e) => onChange({ ...data, DOB: e.target.value })} className="h-10 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Gender *</FieldLabel>
        <Select value={data.gender} onValueChange={(v) => onChange({ ...data, gender: v as StudentFormData['gender'] })}>
          <SelectTrigger className="h-10 rounded-full px-4 bg-slate-50 border-none focus:ring-1 focus:ring-slate-300 font-bold text-xs"><SelectValue placeholder="Select gender" /></SelectTrigger>
          <SelectContent className="rounded-3xl p-1.5 border-slate-100 shadow-xl">
            <SelectItem value="male" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Male</SelectItem>
            <SelectItem value="female" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Female</SelectItem>
            <SelectItem value="other" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">Other</SelectItem>
            <SelectItem value="N/A" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-xs py-2">N/A</SelectItem>
          </SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Phone (Optional)</FieldLabel>
        <Input value={data.contactNumber} onChange={(e) => onChange({ ...data, contactNumber: e.target.value })} placeholder="Optional phone" className="h-10 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Email (Optional)</FieldLabel>
        <Input type="email" value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} placeholder="Optional email" className="h-10 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-xs" />
      </Field>
      <Field className="sm:col-span-2">
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Address (Optional)</FieldLabel>
        <Input value={data.address} onChange={(e) => onChange({ ...data, address: e.target.value })} className="h-10 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Aadhaar (Optional)</FieldLabel>
        <Input value={data.adhaarCard} onChange={(e) => onChange({ ...data, adhaarCard: e.target.value })} className="h-10 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">PAN (Optional)</FieldLabel>
        <Input value={data.panCard} onChange={(e) => onChange({ ...data, panCard: e.target.value })} className="h-10 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 font-medium text-xs" />
      </Field>
    </div>

    <div className="pt-6 border-t border-slate-100">
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Trusted Person Details (Optional)</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Field>
          <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[9px] uppercase">Contact Name</FieldLabel>
          <Input value={data.trustedPerson.name} onChange={(e) => onChange({ ...data, trustedPerson: { ...data.trustedPerson, name: e.target.value } })} className="h-9 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 text-xs font-medium" />
        </Field>
        <Field>
          <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[9px] uppercase">Contact Phone</FieldLabel>
          <Input value={data.trustedPerson.phone} onChange={(e) => onChange({ ...data, trustedPerson: { ...data.trustedPerson, phone: e.target.value } })} className="h-9 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 text-xs font-medium" />
        </Field>
        <Field className="sm:col-span-2">
          <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[9px] uppercase">Relation</FieldLabel>
          <Input value={data.trustedPerson.relation} onChange={(e) => onChange({ ...data, trustedPerson: { ...data.trustedPerson, relation: e.target.value } })} className="h-9 rounded-full px-4 bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-slate-300 text-xs font-medium" />
        </Field>
      </div>
    </div>
  </div>
);

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [homeFilter, setHomeFilter] = useState('All');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [formData, setFormData] = useState<StudentFormData>(emptyStudentForm);

  useEffect(() => {
    const fetchStudents = async () => {
      setIsLoading(true);
      try {
        const res = await api.get('/warden/students');
        setStudents(res.data.map(normalizeStudent));
      } catch (error: unknown) {
        alert(getErrorMessage(error, 'Failed to load students.'));
      } finally {
        setTimeout(() => setIsLoading(false), 1000);
      }
    };

    fetchStudents();
  }, []);

  const sortedStudents = useMemo(() => {
    return [...students].sort((a, b) => {
      return a.name.localeCompare(b.name);
    });
  }, [students]);

  const filteredStudents = useMemo(() => {
    return sortedStudents.filter((student) => {
      const matchesSearch = student.name.toLowerCase().includes(searchTerm.toLowerCase()) || (student.contactNumber?.includes(searchTerm) ?? false);
      let matchesClass = true;
      if (classFilter !== 'all') {
        const dbClass = String(student.class || '').toLowerCase().trim();
        const filterVal = classFilter.toLowerCase();
        
        if (dbClass === filterVal) {
          matchesClass = true;
        } else if (filterVal === '1' && dbClass === 'ist') {
          matchesClass = true;
        } else if (dbClass.includes('year')) {
          matchesClass = false;
        } else {
          const numMatch = dbClass.match(/\d+/);
          const filterNumMatch = filterVal.match(/^\d+$/);
          if (numMatch && filterNumMatch) {
            matchesClass = parseInt(numMatch[0]) === parseInt(filterNumMatch[0]);
          } else {
            matchesClass = false;
          }
        }
      }
      const matchesGender = genderFilter === 'all' || student.gender.toLowerCase() === genderFilter.toLowerCase();
      
      let matchesHome = true;
      if (homeFilter !== 'All') {
        const searchHome = homeFilter.toLowerCase();
        matchesHome = student.hostelName?.name?.toLowerCase().includes(searchHome) ?? false;
      }
      
      return matchesSearch && matchesClass && matchesGender && matchesHome;
    });
  }, [sortedStudents, searchTerm, classFilter, genderFilter, homeFilter]);

  const totalPages = Math.ceil(filteredStudents.length / ITEMS_PER_PAGE);
  const startIdx = (currentPage - 1) * ITEMS_PER_PAGE;
  const paginatedStudents = filteredStudents.slice(startIdx, startIdx + ITEMS_PER_PAGE);

  const handleRowClick = (student: Student) => {
    setSelectedStudent(student);
    setFormData({ ...emptyStudentForm, ...student, gender: student.gender.toLowerCase() as StudentFormData['gender'], trustedPerson: student.trustedPerson || { name: '', phone: '', relation: '' } });
    setIsDetailOpen(true);
  };

  const validateForm = (requirePassword = false) => {
    if (!formData.name || !formData.auth_id || !formData.DOB || !formData.gender || !formData.class || (requirePassword && !formData.password)) {
      alert("Required fields missing.");
      return false;
    }
    // Simple Email/Phone validation
    if (formData.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      alert("Invalid email format.");
      return false;
    }
    if (formData.contactNumber && formData.contactNumber.length < 10) {
      alert("Invalid contact number.");
      return false;
    }
    return true;
  };

  const handleSave = async () => {
    if (!validateForm()) return;
    if (!selectedStudent?._id) return;

    try {
      const profileRes = await api.put(`/warden/students/${selectedStudent._id}`, buildStudentPayload(formData));
      let updatedStudent = normalizeStudent(profileRes.data);

      const credentialsPayload = buildStudentCredentialsPayload(formData, selectedStudent);
      if (Object.keys(credentialsPayload).length > 0) {
        const credentialsRes = await api.put(
          `/warden/students/${selectedStudent._id}/credentials`,
          credentialsPayload
        );
        updatedStudent = normalizeStudent(credentialsRes.data.student);
      }

      setStudents(prev => prev.map(s => s._id === selectedStudent._id ? updatedStudent : s));
      setSelectedStudent(updatedStudent);
      setIsDetailOpen(false);
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to update student.'));
    }
  };

  const handleRegister = async () => {
    if (!validateForm(true)) return;
    try {
      const res = await api.post('/warden/students', buildStudentPayload(formData, true, true));
      setStudents(prev => [...prev, normalizeStudent(res.data.student)]);
      setIsAddOpen(false);
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to register student.'));
    }
  };

  const handleDelete = async () => {
    if (!selectedStudent?._id) return;

    try {
      await api.delete(`/warden/students/${selectedStudent._id}`);
      setStudents(prev => prev.filter(s => s._id !== selectedStudent._id));
      setIsDeleteConfirmOpen(false);
      setIsDetailOpen(false);
      setSelectedStudent(null);
    } catch (error: unknown) {
      alert(getErrorMessage(error, 'Failed to delete student.'));
    }
  };

  if (isLoading) {
    return (
      <div className="flex-1 p-4 md:p-6 bg-[#f8fafc] min-h-screen">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div className="space-y-3">
            <Skeleton className="h-8 w-64 rounded-xl" />
            <Skeleton className="h-4 w-40 rounded-lg opacity-70" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-32 rounded-xl" />
            <Skeleton className="h-10 w-32 rounded-xl" />
          </div>
        </div>
        
        {/* Filters */}
        <div className="bg-white p-4 rounded-3xl border border-slate-200/60 shadow-sm mb-6 flex flex-col md:flex-row gap-4 items-center">
          <Skeleton className="h-10 flex-1 w-full rounded-2xl" />
          <Skeleton className="h-10 w-40 rounded-2xl" />
          <Skeleton className="h-10 w-40 rounded-2xl" />
        </div>

        {/* Table/List */}
        <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden">
          <div className="p-4 border-b border-slate-100 flex gap-4">
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
            <Skeleton className="h-4 w-1/4" />
          </div>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="p-4 border-b border-slate-50 flex gap-4 items-center">
               <Skeleton className="h-10 w-10 rounded-full shrink-0" />
               <Skeleton className="h-8 w-full rounded-md" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#f8fafc] min-h-screen text-[13px]">
      <motion.div variants={containerVariants} initial="hidden" animate="show">
        <div className="flex flex-col md:flex-row md:items-start justify-between gap-6 mb-8">
          <div>
            <motion.h1 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="text-xl md:text-2xl md:text-3xl font-bold tracking-tight text-slate-900"
            >
              Students Management
            </motion.h1>
            <motion.p 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="text-[15px] text-slate-500 mt-2 font-medium"
            >
              Manage and track student profiles and records.
            </motion.p>
          </div>
          <Button
            onClick={() => {
              setFormData(emptyStudentForm);
              setIsAddOpen(true);
            }}
            className="bg-slate-900 hover:bg-slate-800 text-white rounded-full h-10 px-8 text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <Plus className="w-4 h-4 mr-2" /> Add Students
          </Button>
        </div>

        <motion.div variants={itemVariants}>
          <Card className="border border-slate-200/60 shadow-none rounded-4xl bg-white overflow-hidden animate-scale-in">
            <div className="p-6 flex flex-wrap items-center justify-between gap-6 border-b border-slate-50">
              <div className="flex items-center gap-2 shrink-0">
                <h2 className="text-base font-bold text-slate-700 whitespace-nowrap">Students List</h2>
                <Badge variant="outline" className="bg-slate-100 text-slate-700 border border-slate-200 font-bold px-2 py-0.5 rounded-full text-[10px]">
                  {isLoading ? '...' : filteredStudents.length} Students
                </Badge>
              </div>
              
              <Tabs value={homeFilter} onValueChange={(val) => { setHomeFilter(val); setCurrentPage(1); }} suppressHydrationWarning className="hidden md:block overflow-x-auto max-w-full">
                <TabsList className="bg-slate-100 border border-slate-200/60 rounded-full h-[42px] p-1 flex items-center">
                  {['All', 'Kupwara', 'Anantnag', 'Beerwah', 'Outside'].map((home) => (
                    <TabsTrigger key={home} value={home} className="relative rounded-full h-full px-6 text-[12px] font-bold text-slate-500 data-[state=active]:text-slate-900 data-[state=inactive]:hover:text-slate-700 data-[state=inactive]:hover:bg-slate-200/50 transition-colors duration-300">
                      {homeFilter === home && (
                        <motion.div
                          layoutId="students-home-filter"
                          className="absolute inset-0 bg-white rounded-full shadow-sm"
                          transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                        />
                      )}
                      <span className="relative z-10">{home === 'All' ? 'All Homes' : (home === 'Outside' ? 'Outside' : `${home} Home`)}</span>
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>

          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-end w-full md:w-auto">
            <div className="relative w-full lg:w-64 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-slate-900 transition-colors" />
              <Input
                placeholder="Search name or phone..."
                className="pl-10 h-10 bg-slate-50/50 border-slate-200 rounded-full text-[12px] placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-slate-300 font-medium transition-all w-full"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <div className="grid gap-3 sm:grid-cols-2 lg:flex w-full lg:w-auto">
              <Select value={classFilter} onValueChange={(value) => {
                setClassFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="h-10 w-full lg:w-32 bg-white border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-50 focus:ring-1 focus:ring-slate-300 transition-colors px-4"><SelectValue placeholder="All Classes" /></SelectTrigger>
                <SelectContent className="rounded-3xl border-slate-100 shadow-xl p-1.5">
                  <SelectItem value="all" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">All Classes</SelectItem>
                  <SelectItem value="nursery" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Nursery</SelectItem>
                  <SelectItem value="lkg" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">LKG</SelectItem>
                  <SelectItem value="ukg" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">UKG</SelectItem>
                  {[...Array(12)].map((_, i) => (<SelectItem key={i + 1} value={`${i + 1}`} className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Class {i + 1}</SelectItem>))}
                  <SelectItem value="1st year" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">1st Year</SelectItem>
                  <SelectItem value="c.a" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">C.A</SelectItem>
                  <SelectItem value="fashion designing" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Fashion Designing</SelectItem>
                </SelectContent>
              </Select>

              <Select value={genderFilter} onValueChange={(value) => {
                setGenderFilter(value);
                setCurrentPage(1);
              }}>
                <SelectTrigger className="h-10 w-full lg:w-32 bg-white border-slate-200 rounded-full text-xs font-bold text-slate-500 hover:bg-slate-50 focus:ring-1 focus:ring-slate-300 transition-colors px-4"><SelectValue placeholder="All Genders" /></SelectTrigger>
                <SelectContent className="rounded-3xl border-slate-100 shadow-xl p-1.5">
                  <SelectItem value="all" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">All Genders</SelectItem>
                  <SelectItem value="male" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Male</SelectItem>
                  <SelectItem value="female" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Female</SelectItem>
                  <SelectItem value="other" className="focus:bg-slate-100 focus:text-slate-900 data-[state=checked]:bg-slate-100 transition-colors duration-200 cursor-pointer rounded-xl font-medium text-sm py-2">Other</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <CardContent className="p-0">
          <Table>
            <TableHeader className="bg-slate-50/10">
              <TableRow className="border-none hover:bg-transparent">
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none">Name</TableHead>
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none text-center">Class</TableHead>
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none text-center">Age</TableHead>
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none">Gender</TableHead>
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none">Phone</TableHead>
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none">Parentage</TableHead>
                <TableHead className="py-4 px-8 font-bold text-slate-400 text-[11px] uppercase tracking-widest border-none">Address</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                [...Array(5)].map((_, i) => (
                  <TableRow key={i} className="border-b border-slate-50/50 bg-white">
                    <TableCell className="py-4 px-8"><Skeleton className="h-5 w-[150px]" /></TableCell>
                    <TableCell className="py-4 px-8"><Skeleton className="h-5 w-[50px] mx-auto" /></TableCell>
                    <TableCell className="py-4 px-8"><Skeleton className="h-5 w-[40px] mx-auto" /></TableCell>
                    <TableCell className="py-4 px-8"><Skeleton className="h-5 w-[60px]" /></TableCell>
                    <TableCell className="py-4 px-8"><Skeleton className="h-5 w-[100px]" /></TableCell>
                    <TableCell className="py-4 px-8"><Skeleton className="h-5 w-[120px]" /></TableCell>
                    <TableCell className="py-4 px-8"><Skeleton className="h-5 w-[150px]" /></TableCell>
                  </TableRow>
                ))
              ) : paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <TableRow
                    key={student._id}
                    onClick={() => handleRowClick(student)}
                    className="border-b border-slate-50/50 bg-white hover:bg-slate-50/50 transition-colors duration-150 cursor-pointer group"
                  >
                    <TableCell className="py-4 px-8">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full overflow-hidden shrink-0 bg-slate-100 shadow-sm border border-slate-200/60">
                           <img src={getAvatarUrl(student.name)} alt={student.name} className="w-full h-full object-cover" />
                        </div>
                        <span className="font-bold text-slate-900 text-sm group-hover:text-slate-900 transition-colors uppercase tracking-tight">{student.name}</span>
                      </div>
                    </TableCell>
                    <TableCell className="py-4 px-8 text-center text-slate-600">{student.class}</TableCell>
                    <TableCell className="py-4 px-8 text-center text-slate-600">{calculateAge(student.DOB)}</TableCell>
                    <TableCell className="py-4 px-8 text-slate-600 capitalize">{student.gender}</TableCell>
                    <TableCell className="py-4 px-8 text-slate-600 tracking-wider">{student.contactNumber || 'N/A'}</TableCell>
                    <TableCell className="py-4 px-8 text-slate-600">{student.trustedPerson?.name || 'N/A'}</TableCell>
                    <TableCell className="py-4 px-8 text-slate-600 truncate max-w-[200px]" title={student.address || 'N/A'}>{student.address || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={7} className="py-20 text-center text-black font-medium italic">No students found matching your criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-50">
            <div className="text-[11px] text-slate-400 font-bold tracking-tight uppercase">Showing {filteredStudents.length > 0 ? startIdx + 1 : 0} to {Math.min(startIdx + ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} students</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="w-9 h-9 rounded-full hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></Button>
              <div className="flex items-center gap-1.5">
                {[...Array(totalPages)].map((_, i) => (
                  <Button key={i + 1} variant="ghost" className={`w-9 h-9 rounded-full text-[11px] font-bold p-0 transition-all ${currentPage === i + 1 ? "bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:text-white" : "text-slate-500 hover:bg-slate-100"}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Button>
                ))}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="w-9 h-9 rounded-full hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></Button>
            </div>
            </div>
          </CardContent>
        </Card>
        </motion.div>
      </motion.div>

      {/* Popups */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-0 bg-white">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
            <DialogHeader><DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Manage Student Entry</DialogTitle></DialogHeader>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(true)} className="rounded-full border-rose-200 text-rose-600 hover:bg-rose-50 h-10 px-6 font-bold text-xs transition-all">Delete Account</Button>
              <Button onClick={handleSave} className="rounded-full bg-slate-900 hover:bg-slate-800 text-white h-10 px-8 font-bold text-xs shadow-md transition-all">Update Student</Button>
            </div>
          </div>
          <StudentForm data={formData} onChange={setFormData} />
        </DialogContent>
      </Dialog>

      <Dialog open={isAddOpen} onOpenChange={setIsAddOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-0 bg-white">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
            <DialogHeader><DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Register New Student</DialogTitle></DialogHeader>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-full h-10 px-6 text-xs font-bold text-slate-400 hover:bg-slate-50">Cancel</Button>
              <Button onClick={handleRegister} className="rounded-full bg-slate-900 hover:bg-slate-800 text-white h-10 px-10 font-bold text-xs shadow-md transition-all">Complete Registration</Button>
            </div>
          </div>
          <StudentForm data={formData} onChange={setFormData} />
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteConfirmOpen} onOpenChange={setIsDeleteConfirmOpen}>
        <AlertDialogContent className="rounded-3xl border-none p-8">
          <AlertDialogHeader><AlertDialogTitle className="text-xl font-heavy">Permanent Deletion?</AlertDialogTitle><AlertDialogDescription className="text-slate-500 font-medium">Are you sure you want to remove {selectedStudent?.name}? This cannot be reverted.</AlertDialogDescription></AlertDialogHeader>
          <AlertDialogFooter className="mt-6 gap-3"><AlertDialogCancel className="rounded-xl border-none bg-slate-100 text-slate-600 font-bold">Nevermind</AlertDialogCancel><AlertDialogAction onClick={handleDelete} className="rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-bold px-8">Confirm Deletion</AlertDialogAction></AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}



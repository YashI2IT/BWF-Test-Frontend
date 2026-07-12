'use client';

import { useState, useEffect, useMemo } from 'react';
import { Search, Plus, ChevronLeft, ChevronRight } from 'lucide-react';
import { Card, CardContent } from '@/app/warden/Template/components/ui/card';
import { Button } from '@/app/warden/Template/components/ui/button';
import { Input } from '@/app/warden/Template/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/app/warden/Template/components/ui/table';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/warden/Template/components/ui/dialog';
import { Badge } from '@/app/warden/Template/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/warden/Template/components/ui/select';
import { Field, FieldLabel } from '@/app/warden/Template/components/ui/field';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/app/warden/Template/components/ui/alert-dialog';
import api from '@/app/lib/api';

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
  gender: 'male' | 'female' | 'other';
  contactNumber?: string;
  DOB: string;
  email?: string;
  address?: string;
  schoolName?: string;
  adhaarCard?: string;
  panCard?: string;
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
  gender: 'male',
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
  gender: (student.gender || 'male').toLowerCase() as Student['gender'],
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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Full Name *</FieldLabel>
        <Input value={data.name} onChange={(e) => onChange({ ...data, name: e.target.value })} placeholder="e.g. Eleanor Pena" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Auth ID *</FieldLabel>
        <Input value={data.auth_id} onChange={(e) => onChange({ ...data, auth_id: e.target.value })} placeholder="Student login ID" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Password *</FieldLabel>
        <Input type="password" value={data.password} onChange={(e) => onChange({ ...data, password: e.target.value })} placeholder="Student login password" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Class *</FieldLabel>
        <Select value={data.class} onValueChange={(v) => onChange({ ...data, class: v })}>
          <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-bold text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl">{[...Array(12)].map((_, i) => (<SelectItem key={i + 1} value={`${i + 1}`}>Class {i + 1}</SelectItem>))}</SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Date of Birth *</FieldLabel>
        <Input type="date" value={data.DOB} onChange={(e) => onChange({ ...data, DOB: e.target.value })} className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Gender *</FieldLabel>
        <Select value={data.gender} onValueChange={(v) => onChange({ ...data, gender: v as StudentFormData['gender'] })}>
          <SelectTrigger className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-bold text-xs"><SelectValue /></SelectTrigger>
          <SelectContent className="rounded-xl"><SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem></SelectContent>
        </Select>
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Phone (Optional)</FieldLabel>
        <Input value={data.contactNumber} onChange={(e) => onChange({ ...data, contactNumber: e.target.value })} placeholder="Optional phone" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Email (Optional)</FieldLabel>
        <Input type="email" value={data.email} onChange={(e) => onChange({ ...data, email: e.target.value })} placeholder="Optional email" className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" />
      </Field>
      <Field className="md:col-span-2">
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Address (Optional)</FieldLabel>
        <Input value={data.address} onChange={(e) => onChange({ ...data, address: e.target.value })} className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">Aadhaar (Optional)</FieldLabel>
        <Input value={data.adhaarCard} onChange={(e) => onChange({ ...data, adhaarCard: e.target.value })} className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" />
      </Field>
      <Field>
        <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[10px] uppercase tracking-wider">PAN (Optional)</FieldLabel>
        <Input value={data.panCard} onChange={(e) => onChange({ ...data, panCard: e.target.value })} className="h-10 rounded-xl bg-slate-50 border-none focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium text-xs" />
      </Field>
    </div>

    <div className="pt-6 border-t border-slate-100">
      <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-4">Trusted Person Details (Optional)</h4>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Field>
          <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[9px] uppercase">Contact Name</FieldLabel>
          <Input value={data.trustedPerson.name} onChange={(e) => onChange({ ...data, trustedPerson: { ...data.trustedPerson, name: e.target.value } })} className="h-9 rounded-lg bg-slate-50/50 text-xs font-medium border-none" />
        </Field>
        <Field>
          <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[9px] uppercase">Contact Phone</FieldLabel>
          <Input value={data.trustedPerson.phone} onChange={(e) => onChange({ ...data, trustedPerson: { ...data.trustedPerson, phone: e.target.value } })} className="h-9 rounded-lg bg-slate-50/50 text-xs font-medium border-none" />
        </Field>
        <Field>
          <FieldLabel className="text-slate-700 font-bold mb-1.5 block text-[9px] uppercase">Relation</FieldLabel>
          <Input value={data.trustedPerson.relation} onChange={(e) => onChange({ ...data, trustedPerson: { ...data.trustedPerson, relation: e.target.value } })} className="h-9 rounded-lg bg-slate-50/50 text-xs font-medium border-none" />
        </Field>
      </div>
    </div>
  </div>
);

export default function StudentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [classFilter, setClassFilter] = useState('all');
  const [genderFilter, setGenderFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [isAddOpen, setIsAddOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [students, setStudents] = useState<Student[]>([]);

  const [formData, setFormData] = useState<StudentFormData>(emptyStudentForm);

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/warden/students');
        setStudents(res.data.map(normalizeStudent));
      } catch (error: unknown) {
        alert(getErrorMessage(error, 'Failed to load students.'));
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
      const matchesClass = classFilter === 'all' || student.class === classFilter;
      const matchesGender = genderFilter === 'all' || student.gender.toLowerCase() === genderFilter.toLowerCase();
      return matchesSearch && matchesClass && matchesGender;
    });
  }, [sortedStudents, searchTerm, classFilter, genderFilter]);

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

  return (
    <div className="flex-1 p-4 md:p-6 bg-[#f8fafc] min-h-screen text-[13px]">
      <div className="flex items-center justify-between mb-6 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Students Management</h1>
          <div className="flex items-center gap-1 text-[11px] text-slate-400 mt-1 font-medium">
            <span>Home</span> <span className="text-slate-300">/</span> <span className="text-indigo-500 font-semibold">Students</span>
          </div>
        </div>
        <Button
          onClick={() => {
            setFormData(emptyStudentForm);
            setIsAddOpen(true);
          }}
          className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 px-8 text-xs font-bold shadow-md transition-all active:scale-95"
        >
          <Plus className="w-4 h-4 mr-2" /> Add Students
        </Button>
      </div>

      <Card className="border border-slate-200/60 shadow-none rounded-4xl bg-white overflow-hidden animate-scale-in">
        <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-6 border-b border-slate-50">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-slate-700">Students List</h2>
            <Badge variant="outline" className="bg-indigo-50 text-indigo-600 border-none font-bold px-2 py-0.5 rounded-md text-[10px]">
              {filteredStudents.length} Students
            </Badge>
          </div>

          <div className="flex flex-1 items-center justify-end gap-3 w-full md:w-auto">
            <div className="relative w-full md:w-64 group">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-indigo-600 transition-colors" />
              <Input
                placeholder="Search name or phone..."
                className="pl-10 h-10 bg-slate-50/50 border-slate-200 rounded-xl text-[12px] placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-100 font-medium transition-all"
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
              />
            </div>

            <Select value={classFilter} onValueChange={(value) => {
              setClassFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="h-10 w-32 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors px-4"><SelectValue placeholder="All Classes" /></SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all">All Classes</SelectItem>
                {[...Array(12)].map((_, i) => (<SelectItem key={i + 1} value={`${i + 1}`}>Class {i + 1}</SelectItem>))}
              </SelectContent>
            </Select>

            <Select value={genderFilter} onValueChange={(value) => {
              setGenderFilter(value);
              setCurrentPage(1);
            }}>
              <SelectTrigger className="h-10 w-32 bg-white border-slate-200 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-50 transition-colors px-4"><SelectValue placeholder="All Genders" /></SelectTrigger>
              <SelectContent className="rounded-xl border-slate-100 shadow-xl">
                <SelectItem value="all">All Genders</SelectItem>
                <SelectItem value="male">Male</SelectItem><SelectItem value="female">Female</SelectItem><SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
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
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedStudents.length > 0 ? (
                paginatedStudents.map((student) => (
                  <TableRow
                    key={student._id}
                    onClick={() => handleRowClick(student)}
                    className="border-b border-slate-50/50 bg-white hover:bg-indigo-50/40 transition-colors duration-150 cursor-pointer group"
                  >
                    <TableCell className="py-4 px-8 font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{student.name}</TableCell>
                    <TableCell className="py-4 px-8 text-center text-slate-600">{student.class}</TableCell>
                    <TableCell className="py-4 px-8 text-center text-slate-600">{calculateAge(student.DOB)}</TableCell>
                    <TableCell className="py-4 px-8 text-slate-600 capitalize">{student.gender}</TableCell>
                    <TableCell className="py-4 px-8 text-slate-600 tracking-wider">{student.contactNumber || 'N/A'}</TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow><TableCell colSpan={5} className="py-20 text-center text-black font-medium italic">No students found matching your criteria.</TableCell></TableRow>
              )}
            </TableBody>
          </Table>

          <div className="p-6 flex flex-col md:flex-row items-center justify-between gap-4 border-t border-slate-50">
            <div className="text-[11px] text-slate-400 font-bold tracking-tight uppercase">Showing {filteredStudents.length > 0 ? startIdx + 1 : 0} to {Math.min(startIdx + ITEMS_PER_PAGE, filteredStudents.length)} of {filteredStudents.length} students</div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))} disabled={currentPage === 1} className="w-9 h-9 rounded-xl hover:bg-slate-100"><ChevronLeft className="w-4 h-4" /></Button>
              <div className="flex items-center gap-1.5">
                {[...Array(totalPages)].map((_, i) => (
                  <Button key={i + 1} variant={currentPage === i + 1 ? "default" : "ghost"} className={`w-9 h-9 rounded-xl text-[11px] font-bold p-0 transition-all ${currentPage === i + 1 ? "bg-indigo-600 text-white shadow-lg shadow-indigo-100" : "text-slate-500 hover:bg-slate-100"}`} onClick={() => setCurrentPage(i + 1)}>{i + 1}</Button>
                ))}
              </div>
              <Button variant="ghost" size="icon" onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))} disabled={currentPage === totalPages} className="w-9 h-9 rounded-xl hover:bg-slate-100"><ChevronRight className="w-4 h-4" /></Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Popups */}
      <Dialog open={isDetailOpen} onOpenChange={setIsDetailOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto rounded-[2.5rem] border-none shadow-2xl p-0 bg-white">
          <div className="p-8 border-b border-slate-50 flex items-center justify-between sticky top-0 bg-white/90 backdrop-blur-md z-10">
            <DialogHeader><DialogTitle className="text-xl font-bold text-slate-800 tracking-tight">Manage Student Entry</DialogTitle></DialogHeader>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsDeleteConfirmOpen(true)} className="rounded-xl border-rose-200 text-rose-600 hover:bg-rose-50 h-10 px-6 font-bold text-xs transition-all">Delete Account</Button>
              <Button onClick={handleSave} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-8 font-bold text-xs shadow-md transition-all">Update Student</Button>
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
              <Button variant="ghost" onClick={() => setIsAddOpen(false)} className="rounded-xl h-10 px-6 text-xs font-bold text-slate-400 hover:bg-slate-50">Cancel</Button>
              <Button onClick={handleRegister} className="rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white h-10 px-10 font-bold text-xs shadow-lg shadow-indigo-100 transition-all">Complete Registration</Button>
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



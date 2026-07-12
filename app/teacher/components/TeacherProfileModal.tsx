/* eslint-disable @next/next/no-img-element */
'use client';

import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogTitle } from '@/app/teacher/Template/components/ui/dialog';
import { Button } from '@/app/teacher/Template/components/ui/button';
import { Input } from '@/app/teacher/Template/components/ui/input';
import { Camera, User, Briefcase, Phone, Shield, CalendarIcon } from 'lucide-react';
import api from '@/app/lib/api';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/app/teacher/Template/components/ui/select';
import { Popover, PopoverContent, PopoverTrigger } from '@/app/teacher/Template/components/ui/popover';
import { Calendar } from '@/app/teacher/Template/components/ui/calendar';
import { format } from 'date-fns';

type Tab = 'personal' | 'professional' | 'emergency' | 'security';

export function TeacherProfileModal({ isOpen, onClose, initialProfile }: { isOpen: boolean; onClose: () => void; initialProfile?: any }) {
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<Tab>('personal');
  
  const [profile, setProfile] = useState<any>({ 
    name: '', email: '', profilePic: '', phone: '', gender: '', dob: '', address: '',
    hostel: '', hostelLocation: '', qualification: '', joiningDate: '', status: 'Active',
    emergencyName: '', emergencyPhone: '', emergencyRelation: ''
  });
  
  const [visibility, setVisibility] = useState('public');
  const [passwordData, setPasswordData] = useState({ oldPassword: '', newPassword: '' });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      if (initialProfile) {
        setProfile({
          ...profile,
          ...initialProfile
        });
        if (initialProfile.profileVisibility) setVisibility(initialProfile.profileVisibility);
      } else {
        loadProfile();
      }
    }
  }, [isOpen, initialProfile]);

  const loadProfile = async () => {
    try {
      const res = await api.get('/teacher/profile');
      setProfile((prev: any) => ({
          ...prev,
          ...res.data
      }));
      if (res.data.profileVisibility) setVisibility(res.data.profileVisibility);
    } catch (err) {
      console.error(err);
    }
  };

  const handleSaveProfile = async () => {
    setLoading(true);
    try {
      await api.patch('/teacher/profile', {
        ...profile,
        profileVisibility: visibility
      });
      onClose();
    } catch (err: any) {
      console.error(err);
      alert(`API Error: ${err.response?.status} - ${err.response?.data?.message || err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handlePasswordChange = async () => {
    if (!passwordData.oldPassword || !passwordData.newPassword) return;
    try {
      await api.patch('/teacher/profile/password', passwordData);
      setPasswordData({ oldPassword: '', newPassword: '' });
      alert('Password updated successfully!');
    } catch (err) {
      console.error(err);
      alert('Failed to update password.');
    }
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setProfile({ ...profile, profilePic: reader.result as string });
      };
      reader.readAsDataURL(file);
    }
  };

  const tabs = [
    { id: 'personal', label: 'Profile details', icon: User },
    { id: 'professional', label: 'Professional details', icon: Briefcase },
    { id: 'emergency', label: 'Emergency contact', icon: Phone },
    { id: 'security', label: 'Security settings', icon: Shield },
  ];

  const inputClass = "bg-white border-slate-200 rounded-xl h-11 px-4 text-[14px] text-slate-900 shadow-sm focus-visible:ring-2 focus-visible:ring-slate-900/10 focus-visible:border-slate-900 transition-all";

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-white sm:rounded-2xl rounded-b-none rounded-t-2xl shadow-2xl flex flex-col md:flex-row h-[92dvh] sm:h-[85vh] sm:max-h-[750px] border border-slate-200 bottom-0 sm:bottom-auto top-auto sm:top-1/2 translate-y-0 sm:-translate-y-1/2 fixed !z-[9999]">
        <DialogTitle className="sr-only">Edit Profile</DialogTitle>
        
        {/* Left Sidebar — vertical on desktop, horizontal tabs on mobile */}
        <div className="md:w-[260px] bg-[#F9FAFB] border-b md:border-b-0 md:border-r border-slate-200 flex flex-col shrink-0">
          {/* Desktop: Account header */}
          <div className="hidden md:block p-6 pb-4">
            <h2 className="text-[18px] font-bold text-slate-900 tracking-tight">Account</h2>
            <p className="text-[13px] text-slate-500 mt-1">Manage your account info.</p>
          </div>
          {/* Mobile: compact header */}
          <div className="md:hidden px-4 pt-4 pb-2">
            <h2 className="text-[16px] font-bold text-slate-900">Account</h2>
          </div>

          {/* Desktop: vertical tab list */}
          <div className="hidden md:flex flex-1 overflow-y-auto px-3 flex-col space-y-1">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-[14px] font-medium transition-all ${
                  activeTab === tab.id 
                    ? 'bg-slate-200/50 text-slate-900' 
                    : 'text-slate-500 hover:bg-slate-100/50 hover:text-slate-900'
                }`}
              >
                <tab.icon className={`w-[18px] h-[18px] ${activeTab === tab.id ? 'stroke-[2.5px] text-slate-900' : 'stroke-[2px] text-slate-500'}`} />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Mobile: horizontal scrollable tab strip */}
          <div className="md:hidden flex overflow-x-auto [&::-webkit-scrollbar]:hidden gap-1 px-3 pb-3">
            {tabs.map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as Tab)}
                className={`flex items-center gap-2 px-3 py-2 rounded-full text-[13px] font-semibold whitespace-nowrap transition-all shrink-0 ${
                  activeTab === tab.id 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'
                }`}
              >
                <tab.icon className={`w-3.5 h-3.5 ${activeTab === tab.id ? 'text-white' : 'text-slate-500'}`} />
                {tab.label}
              </button>
            ))}
          </div>
          
          <div className="hidden md:block p-6 pt-4 text-xs font-medium text-slate-400">
            Secured by <span className="font-bold text-slate-500">BWF</span>
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex-1 flex flex-col overflow-hidden bg-white relative">
          <div className="px-4 md:px-8 py-4 md:py-5 border-b border-slate-100 shrink-0">
            <h3 className="text-[16px] font-bold text-slate-900">
              {tabs.find(t => t.id === activeTab)?.label}
            </h3>
          </div>

          <div className="flex-1 overflow-y-auto px-4 md:px-8 py-2">
            
            {/* PERSONAL TAB */}
            {activeTab === 'personal' && (
              <div className="animate-fade-in pb-8">
                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-4 sm:gap-8 sm:items-center">
                  <div className="w-full sm:w-[200px] shrink-0">
                    <span className="text-[14px] font-medium text-slate-900">Profile</span>
                  </div>
                  <div className="flex-1 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full overflow-hidden bg-slate-100 shrink-0 border border-slate-200 relative group">
                      <img src={profile.profilePic || "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix"} alt="Avatar" className="w-full h-full object-cover" />
                      <div onClick={() => fileInputRef.current?.click()} className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 cursor-pointer transition-opacity">
                        <Camera className="w-4 h-4 text-white" />
                      </div>
                    </div>
                    <div className="flex-1">
                      <p className="text-[14px] font-medium text-slate-900">{profile.name || 'No name set'}</p>
                    </div>
                    <Button variant="ghost" onClick={() => fileInputRef.current?.click()} className="text-slate-700 hover:text-black hover:bg-slate-100 font-medium text-[13px] h-8 px-4 rounded-full">
                      Update profile
                    </Button>
                    <input type="file" ref={fileInputRef} className="hidden" accept="image/png, image/jpeg, image/gif" onChange={handleImageUpload} />
                  </div>
                </div>

                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Full name</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input value={profile.name || ''} onChange={e => setProfile({...profile, name: e.target.value})} className={inputClass} />
                  </div>
                </div>
                
                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Email addresses</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input value={profile.email || ''} onChange={e => setProfile({...profile, email: e.target.value})} className={inputClass} />
                  </div>
                </div>

                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Phone numbers</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input value={profile.phone || ''} onChange={e => setProfile({...profile, phone: e.target.value})} className={inputClass} placeholder="+1 (555) 000-0000" />
                  </div>
                </div>

                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Gender</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Select value={profile.gender || ''} onValueChange={(value) => setProfile({...profile, gender: value})}>
                      <SelectTrigger className={`${inputClass} focus-visible:border-slate-400 focus-visible:ring-slate-200`}>
                        <SelectValue placeholder="Select Gender" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Male" className="focus:bg-slate-100 focus:text-slate-900">Male</SelectItem>
                        <SelectItem value="Female" className="focus:bg-slate-100 focus:text-slate-900">Female</SelectItem>
                        <SelectItem value="Other" className="focus:bg-slate-100 focus:text-slate-900">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Date of Birth</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={`${inputClass} flex items-center w-full justify-start text-left font-normal ${!profile.dob ? 'text-slate-500' : ''}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                          {profile.dob ? format(new Date(profile.dob), 'PPP') : <span>dd-mm-yyyy</span>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={profile.dob ? new Date(profile.dob) : undefined}
                          onSelect={(date) => setProfile({...profile, dob: date ? format(date, 'yyyy-MM-dd') : ''})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Address</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input value={profile.address || ''} onChange={e => setProfile({...profile, address: e.target.value})} className={inputClass} placeholder="Enter full address" />
                  </div>
                </div>

                <div className="py-6 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Profile visibility</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <div className="flex gap-2 bg-slate-100/50 p-1.5 rounded-xl border border-slate-200/60">
                      <button onClick={() => setVisibility('public')} className={`flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-all ${visibility === 'public' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}>Public</button>
                      <button onClick={() => setVisibility('private')} className={`flex-1 py-1.5 text-[13px] font-medium rounded-lg transition-all ${visibility === 'private' ? 'bg-white text-slate-900 shadow-sm border border-slate-200/60' : 'text-slate-500 hover:text-slate-700'}`}>Private</button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* PROFESSIONAL TAB */}
            {activeTab === 'professional' && (
              <div className="animate-fade-in pb-8">
                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Hostel</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input value={profile.hostel || ''} onChange={e => setProfile({...profile, hostel: e.target.value})} placeholder="Hostel Name" className={inputClass} />
                  </div>
                </div>
                
                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Hostel Location</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input value={profile.hostelLocation || ''} onChange={e => setProfile({...profile, hostelLocation: e.target.value})} placeholder="Location" className={inputClass} />
                  </div>
                </div>

                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Qualification</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input value={profile.qualification || ''} onChange={e => setProfile({...profile, qualification: e.target.value})} placeholder="E.g., MSc Computer Science" className={inputClass} />
                  </div>
                </div>

                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Joining Date</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Popover>
                      <PopoverTrigger asChild>
                        <button
                          className={`${inputClass} flex items-center w-full justify-start text-left font-normal ${!profile.joiningDate ? 'text-slate-500' : ''}`}
                        >
                          <CalendarIcon className="mr-2 h-4 w-4 opacity-70" />
                          {profile.joiningDate ? format(new Date(profile.joiningDate), 'PPP') : <span>dd-mm-yyyy</span>}
                        </button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar
                          mode="single"
                          selected={profile.joiningDate ? new Date(profile.joiningDate) : undefined}
                          onSelect={(date) => setProfile({...profile, joiningDate: date ? format(date, 'yyyy-MM-dd') : ''})}
                          initialFocus
                        />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>

                <div className="py-6 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-center">
                  <div className="w-full sm:w-[200px] shrink-0">
                    <span className="text-[14px] font-medium text-slate-900">Status</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <div className="h-11 inline-flex items-center px-4 rounded-xl bg-slate-50 border border-slate-200">
                      <span className="flex items-center gap-2 text-[14px] font-medium text-emerald-600">
                        <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-sm"></div>
                        {profile.status || 'Active'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* EMERGENCY TAB */}
            {activeTab === 'emergency' && (
              <div className="animate-fade-in pb-8">
                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Contact Name</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input value={profile.emergencyName || ''} onChange={e => setProfile({...profile, emergencyName: e.target.value})} placeholder="Emergency Contact Name" className={inputClass} />
                  </div>
                </div>

                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Contact Phone</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input value={profile.emergencyPhone || ''} onChange={e => setProfile({...profile, emergencyPhone: e.target.value})} placeholder="+1 (555) 000-0000" className={inputClass} />
                  </div>
                </div>

                <div className="py-6 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Relation</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input value={profile.emergencyRelation || ''} onChange={e => setProfile({...profile, emergencyRelation: e.target.value})} placeholder="E.g., Parent, Spouse" className={inputClass} />
                  </div>
                </div>
              </div>
            )}

            {/* SECURITY TAB */}
            {activeTab === 'security' && (
              <div className="animate-fade-in pb-8">
                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">Current Password</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input type="password" placeholder="••••••••" value={passwordData.oldPassword} onChange={e => setPasswordData({...passwordData, oldPassword: e.target.value})} className={inputClass} />
                  </div>
                </div>
                
                <div className="py-6 border-b border-slate-100 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0 sm:pt-2.5">
                    <span className="text-[14px] font-medium text-slate-900">New Password</span>
                  </div>
                  <div className="flex-1 w-full max-w-md">
                    <Input type="password" placeholder="••••••••" value={passwordData.newPassword} onChange={e => setPasswordData({...passwordData, newPassword: e.target.value})} className={inputClass} />
                  </div>
                </div>

                <div className="py-6 flex flex-col sm:flex-row gap-2 sm:gap-8 sm:items-start">
                  <div className="w-full sm:w-[200px] shrink-0"></div>
                  <div className="flex-1 w-full max-w-md">
                    <Button onClick={handlePasswordChange} className="h-9 rounded-full px-6 bg-white border border-slate-200 text-slate-900 hover:bg-slate-50 text-[13px] font-medium shadow-sm transition-all">
                      Update Password
                    </Button>
                  </div>
                </div>
              </div>
            )}

          </div>
          
          {/* Footer */}
          <div className="p-4 md:p-5 bg-white border-t border-slate-100 flex gap-3 shrink-0">
            <Button variant="outline" onClick={onClose} className="flex-1 md:flex-none rounded-full px-5 h-10 text-[13px] font-medium text-slate-700 border-slate-200 bg-white hover:bg-slate-50 shadow-sm">
              Cancel
            </Button>
            <Button onClick={handleSaveProfile} disabled={loading} className="flex-1 md:flex-none rounded-full px-6 h-10 text-[13px] font-medium bg-black hover:bg-slate-900 text-white shadow-sm">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

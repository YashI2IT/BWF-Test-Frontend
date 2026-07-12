const fs = require('fs');

const submissionsPage = `
'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/teacher/Template/components/ui/card';
import { Button } from '@/app/teacher/Template/components/ui/button';

export default function SubmissionsPage() {
  const mockSubmissions = [
    { id: 1, student: "Alice Smith (STU001)", assignment: "Chapter 4 Math", submittedAt: "Today, 10:30 AM", status: "Pending Review" },
    { id: 2, student: "Bob Jones (STU002)", assignment: "History Draft", submittedAt: "Yesterday, 4:15 PM", status: "Graded (A-)" },
    { id: 3, student: "Charlie Brown (STU003)", assignment: "Physics Lab Report", submittedAt: "Today, 8:00 AM", status: "Pending Review" }
  ];

  return (
    <main className="flex-1 overflow-auto bg-[#F8F9FB] min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900">Assignments & Submissions</h1>
        <p className="text-sm text-slate-500">Review and grade student assignment submissions.</p>
      </div>

      <div className="grid gap-4">
        {mockSubmissions.map(sub => (
          <Card key={sub.id} className="border-none shadow-sm rounded-2xl bg-white flex flex-row items-center justify-between p-4">
            <div>
              <h3 className="font-bold text-slate-800">{sub.assignment}</h3>
              <p className="text-sm text-slate-500">Submitted by {sub.student} • {sub.submittedAt}</p>
            </div>
            <div className="flex items-center gap-4">
              <span className={\`text-sm font-semibold \${sub.status.includes('Pending') ? 'text-amber-600 bg-amber-50' : 'text-emerald-600 bg-emerald-50'} px-3 py-1 rounded-full\`}>
                {sub.status}
              </span>
              <Button variant="outline" size="sm" className="border-slate-200">View File</Button>
              {sub.status.includes('Pending') && <Button size="sm" className="bg-emerald-600 hover:bg-emerald-700">Grade</Button>}
            </div>
          </Card>
        ))}
      </div>
    </main>
  );
}
`;

const schedulePage = `
'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/teacher/Template/components/ui/card';
import { Button } from '@/app/teacher/Template/components/ui/button';

export default function SchedulePage() {
  const mockSchedule = [
    { id: 1, time: "09:00 AM - 10:30 AM", title: "Advanced Calculus", type: "Class", room: "Room 302" },
    { id: 2, time: "11:00 AM - 12:00 PM", title: "1-on-1 Mentorship (STU001)", type: "Meeting", room: "Office 12" },
    { id: 3, time: "02:00 PM - 03:30 PM", title: "Physics Lab Setup", type: "Prep", room: "Lab 4" }
  ];

  return (
    <main className="flex-1 overflow-auto bg-[#F8F9FB] min-h-screen p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900">My Schedule</h1>
          <p className="text-sm text-slate-500">Manage your classes and mentorship meetings.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">+ Add Event</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1">
           <Card className="border-none shadow-sm rounded-2xl bg-white">
             <CardHeader><CardTitle>Mini Calendar</CardTitle></CardHeader>
             <CardContent>
                <div className="aspect-square bg-slate-50 rounded-xl border border-dashed border-slate-200 flex items-center justify-center text-slate-400">
                  Interactive Calendar View
                </div>
             </CardContent>
           </Card>
        </div>
        <div className="md:col-span-2 space-y-4">
          <h3 className="font-semibold text-slate-700">Today's Timeline</h3>
          {mockSchedule.map(event => (
            <Card key={event.id} className="border-none shadow-sm rounded-2xl bg-white p-4 flex gap-4 border-l-4 border-l-emerald-500">
              <div className="min-w-[120px] text-sm font-medium text-slate-500 pt-1">{event.time}</div>
              <div>
                <h4 className="font-bold text-slate-900">{event.title}</h4>
                <p className="text-sm text-slate-500">{event.type} • {event.room}</p>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
`;

const notesPage = `
'use client'
import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/app/teacher/Template/components/ui/card';
import { Button } from '@/app/teacher/Template/components/ui/button';

export default function NotesPage() {
  const mockNotes = [
    { id: 1, student: "Alice Smith (STU001)", date: "2026-06-18", text: "Alice has shown massive improvement in mathematics, specifically linear algebra. Keep challenging her." },
    { id: 2, student: "Bob Jones (STU002)", date: "2026-06-19", text: "Bob is struggling with focus during afternoon sessions. Recommended shifting heavy study to mornings." }
  ];

  return (
    <main className="flex-1 overflow-auto bg-[#F8F9FB] min-h-screen p-8">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-[28px] font-bold text-slate-900">Mentor Notes</h1>
          <p className="text-sm text-slate-500">Private observations and mentorship tracking.</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700">Write Note</Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {mockNotes.map(note => (
          <Card key={note.id} className="border-none shadow-sm rounded-2xl bg-white p-6 relative">
             <div className="absolute top-6 right-6 text-xs text-slate-400">{note.date}</div>
             <h3 className="font-bold text-slate-800 mb-2">{note.student}</h3>
             <p className="text-slate-600 text-sm italic">"{note.text}"</p>
          </Card>
        ))}
      </div>
    </main>
  );
}
`;

fs.writeFileSync('app/teacher/submissions/page.tsx', submissionsPage);
fs.writeFileSync('app/teacher/schedule/page.tsx', schedulePage);
fs.writeFileSync('app/teacher/notes/page.tsx', notesPage);

console.log("Mock pages generated.");

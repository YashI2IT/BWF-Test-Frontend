const fs = require('fs');
const path = require('path');

const basePath = 'd:/BWF/BWF/BWF-Web-Dashboard-main/app/teacher';
const pages = [
  { name: 'Community', dir: 'community' },
  { name: 'Assignments', dir: 'submissions' },
  { name: 'Schedule', dir: 'schedule' },
  { name: 'Mentor Notes', dir: 'notes' },
  { name: 'Activities', dir: 'activities' },
  { name: 'Daily Tasks', dir: 'daily-tasks' },
  { name: 'Notices', dir: 'notices' },
  { name: 'Complaints', dir: 'complaints' }
];

pages.forEach(p => {
  const dirPath = path.join(basePath, p.dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
  const content = `import React from 'react';
import { Card, CardContent } from '@/app/teacher/Template/components/ui/card';

export default function ${p.name.replace(/[^a-zA-Z]/g, '')}Page() {
  return (
    <main className="flex-1 overflow-auto bg-[#F8F9FB] min-h-screen p-8">
      <div className="mb-8">
        <h1 className="text-[28px] font-bold text-slate-900 flex items-center gap-2">
          ${p.name}
        </h1>
        <p className="text-sm font-medium text-slate-500 mt-1">
          Manage ${p.name.toLowerCase()} for your students.
        </p>
      </div>

      <Card className="border-none shadow-sm rounded-2xl bg-white">
        <CardContent className="p-12 text-center">
          <div className="text-slate-400 mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-16 w-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
          </div>
          <h3 className="text-lg font-bold text-slate-900">Coming Soon</h3>
          <p className="text-slate-500 mt-2">This module is currently being built.</p>
        </CardContent>
      </Card>
    </main>
  );
}
`;
  fs.writeFileSync(path.join(dirPath, 'page.tsx'), content);
  console.log('Created ' + p.dir);
});

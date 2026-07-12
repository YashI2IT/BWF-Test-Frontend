'use client';

import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/app/teacher/Template/components/ui/dialog';
import { Button } from '@/app/teacher/Template/components/ui/button';
import { LayoutDashboard, Calendar, ListTodo, Users, CheckCircle2 } from 'lucide-react';
import api from '@/app/lib/api';

export function WidgetSettingsModal({ isOpen, onClose }: { isOpen: boolean; onClose: () => void }) {
  const [widgets, setWidgets] = useState([
    { id: 'stats', name: 'Performance Stats', icon: LayoutDashboard, enabled: true },
    { id: 'schedule', name: 'Upcoming Schedule', icon: Calendar, enabled: true },
    { id: 'progress', name: 'Class Progress', icon: Users, enabled: true },
  ]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (isOpen) {
      api.get('/teacher/profile').then(res => {
        const settings = res.data.widgetSettings;
        if (settings) {
          setWidgets(prev => prev.map(w => ({
            ...w,
            enabled: settings[w.id] !== undefined ? settings[w.id] : w.enabled
          })));
        }
      }).catch(console.error);
    }
  }, [isOpen]);

  const toggleWidget = (id: string) => {
    setWidgets(widgets.map(w => w.id === id ? { ...w, enabled: !w.enabled } : w));
  };

  const handleSave = async () => {
    setLoading(true);
    try {
      const widgetSettings = widgets.reduce((acc, curr) => ({
        ...acc,
        [curr.id]: curr.enabled
      }), {});
      await api.patch('/teacher/profile', { widgetSettings });
      onClose();
      // Reload page to reflect widget changes immediately
      window.location.reload();
    } catch (error) {
      console.error(error);
      alert('Error saving widget settings');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white rounded-[32px]">
        <DialogHeader className="p-8 pb-4 border-b border-slate-100">
          <DialogTitle className="text-xl md:text-2xl font-bold text-slate-900">Widget Settings</DialogTitle>
          <p className="text-sm font-medium text-slate-500 mt-2">Customize which widgets appear on your dashboard.</p>
        </DialogHeader>
        
        <div className="p-8 pt-6 space-y-4">
          {widgets.map((widget) => {
            const Icon = widget.icon;
            return (
              <div 
                key={widget.id}
                onClick={() => toggleWidget(widget.id)}
                className={`flex items-center justify-between p-4 rounded-2xl cursor-pointer transition-all border-2 ${widget.enabled ? 'border-blue-600 bg-white' : 'border-slate-100 bg-white hover:border-slate-200'}`}
              >
                <div className="flex items-center gap-4">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-colors ${widget.enabled ? 'bg-blue-50 text-blue-600' : 'bg-slate-100 text-slate-500'}`}>
                    <Icon className="w-5 h-5 stroke-[2.5px]" />
                  </div>
                  <span className={`font-bold text-[15px] ${widget.enabled ? 'text-blue-800' : 'text-slate-800'}`}>{widget.name}</span>
                </div>
                <div>
                  {widget.enabled ? (
                    <CheckCircle2 className="w-6 h-6 text-blue-600 fill-blue-600 stroke-white stroke-[2px]" />
                  ) : (
                    <div className="w-6 h-6 rounded-full bg-slate-200" />
                  )}
                </div>
              </div>
            );
          })}

          <div className="flex justify-center gap-3 pt-6 mt-6">
            <Button variant="ghost" onClick={onClose} className="rounded-xl px-6 h-12 text-slate-500 hover:text-slate-700 hover:bg-slate-100 w-1/2 font-semibold">
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={loading} className="rounded-xl px-8 h-12 bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-200 w-1/2 font-bold">
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

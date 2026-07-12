"use client";
import { useState } from "react";
import { ChevronLeft, ChevronRight, Clock } from "lucide-react";

export default function ActivityPanel() {
  const [currentDate, setCurrentDate] = useState(new Date());
  
  const daysInMonth = new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 0).getDate();
  const firstDay = new Date(currentDate.getFullYear(), currentDate.getMonth(), 1).getDay();
  const monthName = currentDate.toLocaleString('default', { month: 'long' });
  const today = new Date().getDate();

  return (
    <div className="bg-white p-7 rounded-[40px] shadow-sm space-y-8 border border-gray-50 h-full">
      {/* 🔹 CALENDAR HEADER */}
      <div className="flex justify-between items-center">
        <h3 className="text-xl font-bold">{monthName}</h3>
        <div className="flex gap-2">
            <button className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition"><ChevronLeft size={18} /></button>
            <button className="p-2 bg-gray-50 rounded-xl hover:bg-gray-100 transition"><ChevronRight size={18} /></button>
        </div>
      </div>

      {/* 🔹 DAYS GRID */}
      <div>
        <div className="grid grid-cols-7 text-center text-[10px] font-black text-gray-300 mb-4 tracking-widest uppercase">
            {["S","M","T","W","T","F","S"].map(d => <div key={d}>{d}</div>)}
        </div>

        <div className="grid grid-cols-7 gap-2">
            {Array.from({ length: firstDay }).map((_, i) => <div key={i} />)}
            {[...Array(daysInMonth)].map((_, i) => {
                const day = i + 1;
                const isToday = day === today && currentDate.getMonth() === new Date().getMonth();
                const isSpecial = day === 5 || day === 12 || day === 20; // Dummy events

                return (
                    <div
                        key={i}
                        className={`aspect-square flex items-center justify-center rounded-xl text-xs font-bold transition cursor-pointer
                            ${isToday ? "bg-black text-white shadow-lg scale-110" : "hover:bg-gray-100 text-gray-500"}
                            ${isSpecial && !isToday ? "bg-blue-50 text-blue-600 ring-1 ring-blue-100" : ""}
                        `}
                    >
                        {day}
                    </div>
                );
            })}
        </div>
      </div>

      {/* 🔹 INBOX / EVENTS SECTION */}
      <div className="space-y-4">
        <div className="flex justify-between items-center">
            <h3 className="font-bold text-lg">Inbox</h3>
            <span className="bg-red-500 text-white text-[10px] px-2 py-0.5 rounded-full font-bold">3</span>
        </div>
        <EventItem name="Rahul Sharma" msg="Sir, my room fan is not working" time="10:30 AM" active={true} />
        <EventItem name="Mess Committee" msg="Menu update for next week" time="02:15 PM" />
        <EventItem name="Hostel Admin" msg="Meeting at block office" time="04:00 PM" />
      </div>
    </div>
  );
}

function EventItem({ name, msg, time, active }: any) {
    return (
        <div className={`p-4 rounded-3xl transition border ${active ? 'bg-black text-white border-black' : 'bg-gray-50 border-gray-100 text-black hover:border-gray-300'}`}>
            <div className="flex justify-between items-start mb-1">
                <p className="text-sm font-bold truncate pr-2">{name}</p>
                <p className={`text-[10px] font-bold opacity-60`}>{time}</p>
            </div>
            <p className={`text-xs truncate ${active ? 'text-gray-400' : 'text-gray-500'}`}>{msg}</p>
        </div>
    );
}

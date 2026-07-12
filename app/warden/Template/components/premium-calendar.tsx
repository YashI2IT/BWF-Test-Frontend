'use client'

import React, { useState } from 'react'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '@/app/warden/Template/components/ui/button'

interface CalendarEvent {
  date: number
  title: string
  time: string
  type: 'complaint' | 'activity' | 'expense' | 'meeting'
}

interface PremiumCalendarProps {
  events?: CalendarEvent[]
}

const typeColors = {
  complaint: 'text-red-500',
  activity: 'text-blue-500',
  expense: 'text-green-500',
  meeting: 'text-purple-500',
}

export function PremiumCalendar({ events = [] }: PremiumCalendarProps) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState<number | null>(null)

  const today = new Date()
  const isCurrentMonth =
    currentDate.getMonth() === today.getMonth() &&
    currentDate.getFullYear() === today.getFullYear()

  const daysInMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth() + 1,
    0
  ).getDate()

  const firstDayOfMonth = new Date(
    currentDate.getFullYear(),
    currentDate.getMonth(),
    1
  ).getDay()

  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1)
  const emptyDays = Array.from({ length: firstDayOfMonth }, (_, i) => null)

  const allDays = [...emptyDays, ...days]

  const getEventDates = () => events.map(e => e.date)
  const eventDates = getEventDates()

  const getEventsForDate = (date: number) =>
    events.filter(e => e.date === date)

  const displayDate = selectedDate || (isCurrentMonth ? today.getDate() : null)
  const displayEvents = displayDate ? getEventsForDate(displayDate) : []

  const handlePrevMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() - 1)
    )
  }

  const handleNextMonth = () => {
    setCurrentDate(
      new Date(currentDate.getFullYear(), currentDate.getMonth() + 1)
    )
  }

  const monthName = currentDate.toLocaleDateString('en-US', {
    month: 'long',
    year: 'numeric',
  })

  return (
    <div className="w-full animate-float-up">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 card-hover-primary h-105 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between mb-3 flex-shrink-0">
          <h3 className="text-lg font-bold text-foreground">{monthName}</h3>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="icon"
              onClick={handlePrevMonth}
              className="hover:bg-primary/10 hover:text-primary transition-colors duration-200"
            >
              <ChevronLeft className="w-5 h-5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleNextMonth}
              className="hover:bg-primary/10 hover:text-primary transition-colors duration-200"
            >
              <ChevronRight className="w-5 h-5" />
            </Button>
          </div>
        </div>

        {/* Weekday headers */}
        <div className="grid grid-cols-7 gap-2 mb-2 flex-shrink-0">
          {['S', 'M', 'T', 'W', 'T', 'F', 'S'].map((day, idx) => (
            <div
              key={`weekday-${idx}`}
              className="text-center text-xs font-semibold text-muted-foreground py-1"
            >
              {day}
            </div>
          ))}
        </div>

        {/* Calendar days */}
        <div className="grid grid-cols-7 gap-2 mb-3 flex-shrink-0">
          {allDays.map((day, idx) => {
            if (!day) {
              return <div key={`empty-${idx}`} className="h-6" />
            }

            const isToday = isCurrentMonth && day === today.getDate()
            const isSelected = day === selectedDate
            const hasEvents = eventDates.includes(day)

            return (
              <button
                key={day}
                onClick={() => setSelectedDate(day)}
                className={`h-7 rounded-md text-xs font-medium transition-all duration-200 relative group ${
                  isToday
                    ? 'bg-foreground text-white shadow-md'
                    : isSelected
                      ? 'bg-primary/20 text-primary'
                      : hasEvents
                        ? 'bg-blue-100/60 text-foreground hover:bg-blue-200/60'
                        : 'text-foreground hover:bg-secondary'
                }`}
              >
                {day}
                {hasEvents && !isToday && (
                  <div className="absolute bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-primary rounded-full group-hover:scale-150 transition-transform duration-200" />
                )}
              </button>
            )
          })}
        </div>

        {/* Events list */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 pt-2 border-t border-gray-100">
          {displayEvents.length > 0 && (
            <>
              <p className="text-[10px] font-semibold text-muted-foreground mb-2 uppercase tracking-wider flex-shrink-0">
                Events on {displayDate} {monthName.split(' ')[0]}
              </p>
              <div className="space-y-2 overflow-y-auto flex-1 scrollable-hide">
                {displayEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className="p-3 rounded-lg bg-gradient-to-r from-primary/5 to-accent/5 border border-primary/10 hover:border-primary/30 transition-all duration-200 cursor-pointer group animate-float-up flex-shrink-0"
                    style={{ animationDelay: `${idx * 50}ms` }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-foreground group-hover:text-primary transition-colors duration-200 truncate">
                          {event.title}
                        </p>
                        <p className="text-xs text-muted-foreground">{event.time}</p>
                      </div>
                      <div
                        className={`w-2 h-2 rounded-full flex-shrink-0 ${typeColors[event.type]}`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {displayEvents.length === 0 && displayDate && (
            <div className="text-center">
              <p className="text-sm text-muted-foreground">No events scheduled</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

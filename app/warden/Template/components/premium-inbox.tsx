'use client'

import React, { useState } from 'react'
import { Mail, Pin, Trash2, MessageSquare, AlertCircle } from 'lucide-react'
import { Badge } from '@/app/warden/Template/components/ui/badge'
import { Button } from '@/app/warden/Template/components/ui/button'

interface InboxMessage {
  id: string
  sender: string
  subject: string
  preview: string
  time: string
  isRead: boolean
  isPinned: boolean
  type: 'complaint' | 'activity' | 'admin' | 'system'
}

const sampleMessages: InboxMessage[] = [
  {
    id: '1',
    sender: 'Rahul Sharma',
    subject: 'Room Fan Not Working',
    preview: 'Sir, my room fan is not working. Please arrange repair.',
    time: '10:30 AM',
    isRead: false,
    isPinned: true,
    type: 'complaint',
  },
  {
    id: '2',
    sender: 'Mess Committee',
    subject: 'Menu Update for Next Week',
    preview: 'Menu update for next week has been published on the notice board.',
    time: '02:15 PM',
    isRead: true,
    isPinned: false,
    type: 'system',
  },
  {
    id: '3',
    sender: 'Hostel Admin',
    subject: 'Meeting at Block Office',
    preview: 'Meeting scheduled at block office tomorrow at 3 PM.',
    time: '04:00 PM',
    isRead: true,
    isPinned: false,
    type: 'admin',
  },
  {
    id: '4',
    sender: 'Event Manager',
    subject: 'Sports Day Approval Pending',
    preview: 'Your sports day event request is pending approval.',
    time: '05:45 PM',
    isRead: false,
    isPinned: false,
    type: 'activity',
  },
]

const typeConfig = {
  complaint: { icon: AlertCircle, color: 'bg-red-50 border-red-200', badge: 'Complaint' },
  activity: { icon: MessageSquare, color: 'bg-blue-50 border-blue-200', badge: 'Activity' },
  admin: { icon: Mail, color: 'bg-purple-50 border-purple-200', badge: 'Admin' },
  system: { icon: Mail, color: 'bg-green-50 border-green-200', badge: 'System' },
}

export function PremiumInbox() {
  const [messages, setMessages] = useState(sampleMessages)
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'unread' | 'pinned'>('all')

  const filteredMessages = messages.filter(msg => {
    if (selectedFilter === 'unread') return !msg.isRead
    if (selectedFilter === 'pinned') return msg.isPinned
    return true
  })

  const unreadCount = messages.filter(m => !m.isRead).length

  const togglePin = (id: string) => {
    setMessages(
      messages.map(msg =>
        msg.id === id ? { ...msg, isPinned: !msg.isPinned } : msg
      )
    )
  }

  const deleteMessage = (id: string) => {
    setMessages(messages.filter(msg => msg.id !== id))
  }

  const markAsRead = (id: string) => {
    setMessages(
      messages.map(msg =>
        msg.id === id ? { ...msg, isRead: true } : msg
      )
    )
  }

  return (
    <div className="w-full animate-float-up" style={{ animationDelay: '100ms' }}>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 card-hover-primary">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
              <Mail className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-foreground">Inbox</h3>
              {unreadCount > 0 && (
                <p className="text-xs text-muted-foreground">
                  {unreadCount} new message{unreadCount !== 1 ? 's' : ''}
                </p>
              )}
            </div>
          </div>
          <Badge className="bg-destructive/10 text-destructive text-sm px-3 py-1 rounded-full font-semibold">
            {unreadCount}
          </Badge>
        </div>

        {/* Filter tabs */}
        <div className="flex gap-2 mb-6 pb-4 border-b border-gray-100">
          {(['all', 'unread', 'pinned'] as const).map(filter => (
            <button
              key={filter}
              onClick={() => setSelectedFilter(filter)}
              className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-all duration-200 ${
                selectedFilter === filter
                  ? 'bg-primary/10 text-primary'
                  : 'text-muted-foreground hover:bg-secondary'
              }`}
            >
              {filter.charAt(0).toUpperCase() + filter.slice(1)}
            </button>
          ))}
        </div>

        {/* Messages list */}
        <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
          {filteredMessages.length > 0 ? (
            filteredMessages.map((msg, idx) => {
              const TypeIcon = typeConfig[msg.type].icon
              return (
                <div
                  key={msg.id}
                  onClick={() => !msg.isRead && markAsRead(msg.id)}
                  className={`p-4 rounded-xl border transition-all duration-300 cursor-pointer group hover:shadow-md hover:-translate-y-0.5 animate-float-up ${
                    msg.isRead
                      ? 'bg-gray-50/50 border-gray-100'
                      : typeConfig[msg.type].color
                  }`}
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-lg bg-white/50 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/10 transition-colors duration-200">
                      <TypeIcon className="w-5 h-5 text-primary" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <p className="font-semibold text-foreground truncate">
                          {msg.sender}
                        </p>
                        {!msg.isRead && (
                          <div className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />
                        )}
                      </div>
                      <p className="text-sm font-medium text-foreground/80 truncate mb-1">
                        {msg.subject}
                      </p>
                      <p className="text-xs text-muted-foreground truncate line-clamp-1">
                        {msg.preview}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-shrink-0">
                      <p className="text-xs text-muted-foreground whitespace-nowrap">
                        {msg.time}
                      </p>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          togglePin(msg.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Pin
                          className={`w-4 h-4 transition-colors duration-200 ${
                            msg.isPinned
                              ? 'text-primary fill-primary'
                              : 'text-muted-foreground'
                          }`}
                        />
                      </button>
                      <button
                        onClick={e => {
                          e.stopPropagation()
                          deleteMessage(msg.id)
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                      >
                        <Trash2 className="w-4 h-4 text-destructive hover:text-destructive/80 transition-colors duration-200" />
                      </button>
                    </div>
                  </div>
                </div>
              )
            })
          ) : (
            <div className="text-center py-8">
              <Mail className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-muted-foreground">No messages to display</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

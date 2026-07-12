'use client'

import React from 'react'
import { LucideIcon } from 'lucide-react'

interface PremiumStatCardProps {
  icon: LucideIcon
  label: string
  value: string | number
  change?: {
    value: number
    direction: 'up' | 'down'
  }
  gradient?: boolean
  color?: 'primary' | 'success' | 'warning' | 'danger'
}

const colorConfig = {
  primary: 'from-primary/20 to-accent/20 border-primary/20',
  success: 'from-green-100/60 to-emerald-100/60 border-green-200',
  warning: 'from-amber-100/60 to-orange-100/60 border-amber-200',
  danger: 'from-red-100/60 to-rose-100/60 border-red-200',
}

const iconColorConfig = {
  primary: 'text-primary',
  success: 'text-green-600',
  warning: 'text-amber-600',
  danger: 'text-red-600',
}

export function PremiumStatCard({
  icon: Icon,
  label,
  value,
  change,
  gradient = true,
  color = 'primary',
}: PremiumStatCardProps) {
  return (
    <div className="animate-float-up">
      <div
        className={`relative overflow-hidden rounded-2xl border shadow-sm p-6 card-hover transition-all duration-300 bg-gradient-to-br ${
          gradient ? colorConfig[color] : 'bg-white border-gray-100'
        }`}
      >
        {/* Background accent */}
        <div className="absolute top-0 right-0 w-20 h-20 bg-gradient-to-bl from-white/40 to-transparent rounded-full -mr-8 -mt-8" />

        <div className="relative z-10">
          <div className="flex items-start justify-between mb-4">
            <div className={`w-12 h-12 rounded-xl bg-white/60 flex items-center justify-center ${iconColorConfig[color]}`}>
              <Icon className="w-6 h-6" />
            </div>
            {change && (
              <div
                className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
                  change.direction === 'up'
                    ? 'bg-green-100/80 text-green-700'
                    : 'bg-red-100/80 text-red-700'
                }`}
              >
                {change.direction === 'up' ? '↑' : '↓'} {change.value}%
              </div>
            )}
          </div>

          <div className="mb-3">
            <p className="text-sm font-medium text-muted-foreground mb-1">{label}</p>
            <p className="text-3xl font-bold text-foreground">{value}</p>
          </div>

          {/* Subtle bottom line */}
          <div className="h-0.5 w-full bg-gradient-to-r from-primary/30 via-accent/30 to-transparent rounded-full" />
        </div>
      </div>
    </div>
  )
}

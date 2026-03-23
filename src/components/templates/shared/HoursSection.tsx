'use client'

import { BusinessHours } from '@/lib/types'

const dayNames = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

interface HoursSectionProps {
  hours: BusinessHours[]
}

export default function HoursSection({ hours }: HoursSectionProps) {
  const today = new Date().getDay()

  return (
    <div>
      <h2 className="text-xl font-bold text-[#e8e8f0] mb-6">Opening Hours</h2>
      <div className="bg-[#151522] border border-[rgba(120,120,255,0.12)] rounded-xl p-6">
        {hours.map((h, idx) => {
          const isToday = h.dayOfWeek === today
          return (
            <div
              key={h.id}
              className={`flex items-center justify-between py-2.5 ${
                idx !== hours.length - 1 ? 'border-b border-[rgba(120,120,255,0.08)]' : ''
              } ${isToday ? 'bg-[#1e1e35] rounded-lg px-3' : 'px-3'}`}
            >
              <div className="flex items-center gap-3">
                <span className={`font-semibold ${isToday ? 'text-[#e8e8f0]' : 'text-[#8888aa]'}`}>
                  {dayNames[h.dayOfWeek]}
                </span>
                {isToday && (
                  <span className="text-xs bg-blue-400/15 text-blue-400 rounded-full px-2 py-0.5">
                    Today
                  </span>
                )}
              </div>
              <span className={h.isOpen ? 'text-[#e8e8f0]' : 'text-[#5a5a7a]'}>
                {h.isOpen ? `${h.openTime} – ${h.closeTime}` : 'Closed'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

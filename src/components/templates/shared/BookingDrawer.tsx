'use client'

import React, { useState, useEffect, useMemo } from 'react'
import { X, Check, Calendar, Clock, User, Phone, MessageCircle, ChevronRight, ChevronLeft } from 'lucide-react'
import { Business, Service, BusinessHours } from '@/lib/types'
import { addBooking } from '@/lib/store'
import { createClient } from '@/lib/supabase/client'

type BookingDrawerProps = {
  business: Business
  services: Service[]
  hours: BusinessHours[]
  isOpen: boolean
  onClose: () => void
  initialService?: Service | null
}

export default function BookingDrawer({
  business,
  services,
  hours,
  isOpen,
  onClose,
  initialService
}: BookingDrawerProps) {
  const [step, setStep] = useState(1)
  const [selectedService, setSelectedService] = useState<Service | null>(initialService ?? null)
  const [selectedDate, setSelectedDate] = useState<Date | null>(null)
  const [selectedTime, setSelectedTime] = useState<string | null>(null)
  const [customerName, setCustomerName] = useState('')
  const [customerPhone, setCustomerPhone] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isBooked, setIsBooked] = useState(false)
  const [bookedTimes, setBookedTimes] = useState<Set<string>>(new Set())
  const [slotConflict, setSlotConflict] = useState(false)

  const handleClose = () => {
    setStep(1)
    setSelectedService(initialService ?? null)
    setSelectedDate(null)
    setSelectedTime(null)
    setCustomerName('')
    setCustomerPhone('')
    setIsSubmitting(false)
    setIsBooked(false)
    setSlotConflict(false)
    onClose()
  }

  const supabase = useMemo(() => createClient(), [])

  // Skip step 1 if initialService is provided
  useEffect(() => {
    if (initialService && step === 1) {
      setSelectedService(initialService)
      setStep(2)
    }
  }, [initialService, step])

  // Fetch booked slots when date is selected
  useEffect(() => {
    if (selectedDate && business.id) {
      const fetchBookings = async () => {
        const dateStr = selectedDate.toISOString().split('T')[0]
        const { data } = await supabase
          .from('bookings')
          .select('appointment_at, status')
          .eq('business_id', business.id)
          .gte('appointment_at', dateStr + 'T00:00:00')
          .lte('appointment_at', dateStr + 'T23:59:59')
          .neq('status', 'cancelled')
        
        const times = new Set(
          (data ?? []).map(b => {
            const d = new Date(b.appointment_at)
            return `${String(d.getUTCHours()).padStart(2,'0')}:${String(d.getUTCMinutes()).padStart(2,'0')}`
          })
        )
        setBookedTimes(times)
      }
      fetchBookings()
    }
  }, [selectedDate, business.id, supabase])

  const next7Days = useMemo(() => {
    const days = []
    const today = new Date()
    for (let i = 1; i <= 7; i++) {
      const date = new Date(today)
      date.setDate(today.getDate() + i)
      days.push(date)
    }
    return days
  }, [])

  const availableSlots = useMemo(() => {
    if (!selectedDate || !selectedService) return []
    
    const dayOfWeek = selectedDate.getDay()
    const hoursForDay = hours.find(h => h.dayOfWeek === dayOfWeek)
    
    if (!hoursForDay?.isOpen) return []

    const openParts = hoursForDay.openTime.split(':').map(Number)
    const closeParts = hoursForDay.closeTime.split(':').map(Number)
    const openH = openParts[0]
    const openM = openParts[1]
    const closeH = closeParts[0]
    const closeM = closeParts[1]

    const slots = []
    let current = new Date(1970, 0, 1, openH, openM)
    const end = new Date(1970, 0, 1, closeH, closeM)

    while (current < end) {
      const timeStr = current.toTimeString().slice(0, 5)
      slots.push(timeStr)
      current.setMinutes(current.getMinutes() + selectedService.durationMinutes)
    }

    return slots
  }, [selectedDate, selectedService, hours])

  const handleBooking = async () => {
    if (!selectedService || !selectedDate || !selectedTime || !business.id) return
    setIsSubmitting(true)
    try {
      const dateStr = selectedDate.toISOString().split('T')[0]
      
      // Re-validate slot before saving
      const { data: conflict } = await supabase
        .from('bookings')
        .select('id')
        .eq('business_id', business.id)
        .eq('appointment_at', `${dateStr}T${selectedTime}:00`)
        .neq('status', 'cancelled')
        .maybeSingle()

      if (conflict) {
        setSlotConflict(true)
        setSelectedTime(null)
        setStep(2)
        setIsSubmitting(false)
        return
      }

      await addBooking(business.id, {
        businessId: business.id,
        serviceId: selectedService.id,
        customerName,
        customerPhone,
        appointmentAt: `${dateStr}T${selectedTime}:00`,
      })
      setIsBooked(true)
      setStep(4)
    } catch (error) {
      console.error('Booking failed', error)
      alert('Failed to book appointment. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  const formatDisplayDate = (date: Date) => {
    return date.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'long' }).replace(',', '')
  }

  const accentStyle = {
    color: business.accentColor,
    borderColor: business.accentColor,
    backgroundColor: `${business.accentColor}14` // 0.08 opacity hex
  }

  const accentBg = {
    backgroundColor: business.accentColor
  }

  return (
    <>
      {/* Overlay */}
      <div 
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${isOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} 
        onClick={handleClose}
      />

      {/* Drawer Panel */}
      <div 
        className={`fixed right-0 top-0 h-full w-[360px] z-50 bg-[#111118] border-l border-[rgba(120,120,255,0.18)] flex flex-col transition-transform duration-300 transform ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}
      >
        {/* Drawer Header */}
        <div className="px-5 py-4 border-b border-[rgba(120,120,255,0.1)]">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-[#e8e8f0] text-lg font-medium">
              {step === 1 && "Book an appointment"}
              {step === 2 && "Pick a date and time"}
              {step === 3 && "Your details"}
              {step === 4 && "Booking confirmed"}
            </h2>
            <button onClick={handleClose} className="text-[#8888aa] hover:text-[#e8e8f0]">
              <X size={20} />
            </button>
          </div>
          
          {/* Progress Bar */}
          <div className="flex gap-1.5 h-1">
            {[1, 2, 3, 4].map((s) => (
              <div 
                key={s} 
                className="flex-1 rounded-full bg-[rgba(120,120,255,0.1)] overflow-hidden"
              >
                <div 
                  className="h-full transition-all duration-300" 
                  style={{ 
                    width: s <= step ? '100%' : '0%',
                    backgroundColor: s <= step ? business.accentColor : 'transparent'
                  }}
                />
              </div>
            ))}
          </div>
        </div>

        {/* Persistent Summary Bar (Visible on Steps 2, 3, 4) */}
        {step >= 2 && selectedService && (
          <div className="bg-[#1e1e35] border-b border-[rgba(120,120,255,0.12)] px-5 py-[10px] flex justify-between items-center">
            <div className="flex flex-col">
              <span className="text-[#e8e8f0] text-sm font-medium leading-tight">{selectedService.name}</span>
              <span className="text-[#8888aa] text-[12px]">{selectedService.durationMinutes} min</span>
            </div>
            <div className="text-[#e8e8f0] font-medium leading-none">
              €{selectedService.price}
            </div>
          </div>
        )}

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 custom-scrollbar">
          
          {/* STEP 1: Choose Service */}
          {step === 1 && (
            <div className="space-y-3">
              <label className="text-[10px] text-[#5a5a7a] uppercase tracking-[0.07em]">Select a service</label>
              <div className="space-y-2">
                {services.map((service) => (
                  <button
                    key={service.id}
                    onClick={() => setSelectedService(service)}
                    className="w-full text-left p-4 rounded-[10px] border transition-all duration-200 bg-[#1a1a2e]"
                    style={{
                      borderColor: selectedService?.id === service.id ? '#4f8ef7' : 'rgba(120,120,255,0.12)',
                      backgroundColor: selectedService?.id === service.id ? 'rgba(79,142,247,0.08)' : '#1a1a2e'
                    }}
                  >
                    <div className="flex justify-between items-start mb-1">
                      <span className="text-[#e8e8f0] font-medium">{service.name}</span>
                      <span className="text-[#e8e8f0] font-medium">€{service.price}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      {service.description && (
                        <p className="text-[#8888aa] text-sm leading-snug">{service.description}</p>
                      )}
                      <span className="text-[#5a5a7a] text-[12px]">{service.durationMinutes} min</span>
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* STEP 2: Pick Date and Time */}
          {step === 2 && (
            <div className="space-y-6">
              <div>
                <label className="text-[10px] text-[#5a5a7a] uppercase tracking-[0.07em] mb-3 block">Select Date</label>
                <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                  {next7Days.map((date, idx) => {
                    const isOpen = hours.find(h => h.dayOfWeek === date.getDay())?.isOpen ?? false
                    const isSelected = selectedDate?.toDateString() === date.toDateString()
                    
                    return (
                      <button
                        key={idx}
                        disabled={!isOpen}
                        onClick={() => setSelectedDate(date)}
                        className="flex flex-col items-center justify-center min-w-[54px] h-[64px] rounded-[10px] border transition-all duration-200 shrink-0"
                        style={{
                          opacity: isOpen ? 1 : 0.35,
                          cursor: isOpen ? 'pointer' : 'not-allowed',
                          borderColor: isSelected ? business.accentColor : 'rgba(120,120,255,0.12)',
                          backgroundColor: isSelected ? `${business.accentColor}14` : '#1a1a2e',
                          color: isSelected ? business.accentColor : '#e8e8f0'
                        }}
                      >
                        <span className="text-[11px] uppercase font-medium">{date.toLocaleDateString('en-US', { weekday: 'short' })}</span>
                        <span className="text-lg font-bold">{date.getDate()}</span>
                      </button>
                    )
                  })}
                </div>
              </div>

              {selectedDate && (
                <div>
                  <label className="text-[10px] text-[#5a5a7a] uppercase tracking-[0.07em] mb-3 block">Available Slots</label>
                  
                  {slotConflict && (
                    <div className="bg-[rgba(239,68,68,0.1)] border border-[rgba(239,68,68,0.2)] rounded-lg p-[10px_12px] mb-[10px]">
                      <p className="text-[#f87171] text-[12px]">That slot was just taken. Please pick another time.</p>
                    </div>
                  )}

                  {availableSlots.length > 0 ? (
                    <div className="grid grid-cols-3 gap-2">
                    {availableSlots.map((time) => {
                      const isBooked = bookedTimes.has(time)
                      const isSelected = selectedTime === time

                      return (
                        <button
                          key={time}
                          disabled={isBooked}
                          onClick={() => {
                            setSelectedTime(time)
                            setSlotConflict(false)
                          }}
                          className="py-3 px-2 rounded-[10px] border text-center transition-all duration-200"
                          style={{
                            opacity: isBooked ? 0.35 : 1,
                            cursor: isBooked ? 'not-allowed' : 'pointer',
                            textDecoration: isBooked ? 'line-through' : 'none',
                            borderColor: isSelected ? business.accentColor : 'rgba(120,120,255,0.12)',
                            backgroundColor: isSelected ? `${business.accentColor}14` : '#1a1a2e',
                            color: isSelected ? business.accentColor : '#e8e8f0'
                          }}
                        >
                          <span className="text-sm font-medium">{time}</span>
                        </button>
                      )
                    })}
                  </div>
                  ) : (
                    <p className="text-[#5a5a7a] text-sm italic">No slots available for this day.</p>
                  )}
                </div>
              )}
            </div>
          )}

          {/* STEP 3: Details */}
          {step === 3 && selectedService && selectedDate && selectedTime && (
            <div className="space-y-6">
              <div className="bg-[#1e1e35] rounded-[10px] border border-[rgba(120,120,255,0.12)] p-4">
                <div className="text-[#e8e8f0] text-sm font-medium text-center leading-relaxed">
                  {selectedService.name} | {formatDisplayDate(selectedDate)} | {selectedTime} | {selectedService.durationMinutes} min | €{selectedService.price}
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <label className="text-[10px] text-[#5a5a7a] uppercase tracking-[0.07em]">Full Name</label>
                  <input
                    type="text"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    placeholder="John Doe"
                    className="w-full bg-[#1e1e35] border border-[rgba(120,120,255,0.12)] rounded-[9px] px-4 py-3 text-[#e8e8f0] focus:outline-none focus:border-[rgba(120,120,255,0.22)] transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] text-[#5a5a7a] uppercase tracking-[0.07em]">Phone Number</label>
                  <input
                    type="tel"
                    value={customerPhone}
                    onChange={(e) => setCustomerPhone(e.target.value)}
                    placeholder="+383 44 000 000"
                    className="w-full bg-[#1e1e35] border border-[rgba(120,120,255,0.12)] rounded-[9px] px-4 py-3 text-[#e8e8f0] focus:outline-none focus:border-[rgba(120,120,255,0.22)] transition-colors"
                  />
                </div>
                <p className="text-[#5a5a7a] text-[12px]">Used only to confirm your appointment</p>
              </div>
            </div>
          )}

          {/* STEP 4: Success */}
          {step === 4 && selectedService && selectedDate && (
            <div className="h-full flex flex-col items-center justify-center text-center py-6">
              <div 
                className="w-20 h-20 rounded-full flex items-center justify-center mb-6 border"
                style={{ 
                  backgroundColor: 'rgba(74,222,128,0.12)', 
                  borderColor: 'rgba(74,222,128,0.3)' 
                }}
              >
                <Check size={40} className="text-[#4ade80]" />
              </div>

              <h3 className="text-[#e8e8f0] text-2xl font-bold mb-2">You're booked in!</h3>
              <p className="text-[#8888aa] mb-8">
                {formatDisplayDate(selectedDate)} at {selectedTime} <br/>
                <span className="text-[#e8e8f0] font-medium">{business.name}</span>
              </p>

              <div className="w-full bg-[#1e1e35] rounded-[10px] border border-[rgba(120,120,255,0.12)] p-5 space-y-3 mb-8">
                <div className="flex justify-between">
                  <span className="text-[#8888aa] text-sm">Service</span>
                  <span className="text-[#e8e8f0] text-sm font-medium">{selectedService.name}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-[#8888aa] text-sm">Phone</span>
                  <span className="text-[#e8e8f0] text-sm font-medium">{customerPhone}</span>
                </div>
              </div>

              <div className="w-full space-y-3">
                <a
                  href={`https://wa.me/${business.phone.replace(/\D/g, '')}?text=${encodeURIComponent(
                    `Hi! I just booked a ${selectedService.name} on ${formatDisplayDate(selectedDate)} at ${selectedTime}. My name is ${customerName}.`
                  )}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 w-full py-4 rounded-[9px] font-semibold border transition-all"
                  style={{
                    backgroundColor: 'rgba(37,211,102,0.1)',
                    borderColor: 'rgba(37,211,102,0.25)',
                    color: '#4ade80'
                  }}
                >
                  <MessageCircle size={20} />
                  Send to WhatsApp
                </a>
                <button
                  onClick={handleClose}
                  className="w-full py-4 text-[#8888aa] hover:text-[#e8e8f0] font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Drawer Footer */}
        {step < 4 && (
          <div className="px-5 pb-5 pt-3 border-t border-[rgba(120,120,255,0.1)] flex gap-3">
            {step > 1 && (
              <button
                onClick={() => setStep(step - 1)}
                className="flex-1 py-4 border border-[rgba(120,120,255,0.12)] text-[#e8e8f0] font-semibold rounded-[9px] hover:bg-[rgba(120,120,255,0.04)] transition-colors inline-flex items-center justify-center gap-2"
              >
                <ChevronLeft size={18} />
                Back
              </button>
            )}
            
            {step === 1 && (
              <button
                disabled={!selectedService}
                onClick={() => setStep(2)}
                className="w-full py-4 text-[#111118] font-bold rounded-[9px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={accentBg}
              >
                Continue
                <ChevronRight size={18} />
              </button>
            )}

            {step === 2 && (
              <button
                disabled={!selectedDate || !selectedTime}
                onClick={() => setStep(3)}
                className="flex-[2] py-4 text-[#111118] font-bold rounded-[9px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={accentBg}
              >
                Continue
                <ChevronRight size={18} />
              </button>
            )}

            {step === 3 && (
              <button
                disabled={!customerName || !customerPhone || isSubmitting}
                onClick={handleBooking}
                className="flex-[2] py-4 text-[#111118] font-bold rounded-[9px] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                style={accentBg}
              >
                {isSubmitting ? 'Booking...' : 'Confirm Booking'}
                {!isSubmitting && <Check size={18} />}
              </button>
            )}
          </div>
        )}
      </div>

      <style jsx>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 4px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: transparent;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(120, 120, 255, 0.1);
          border-radius: 10px;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </>
  )
}

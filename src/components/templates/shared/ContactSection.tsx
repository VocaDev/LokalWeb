'use client'

import { Business } from '@/lib/types'
import { Phone, MapPin, MessageCircle, Instagram, Facebook } from 'lucide-react'
import { useEffect, useState } from 'react'

interface ContactSectionProps {
  business: Business
}

export default function ContactSection({ business }: ContactSectionProps) {
  const [mapUrl, setMapUrl] = useState<string | null>(null)

  const whatsappUrl = business.socialLinks?.whatsapp
    ? `https://wa.me/${business.socialLinks.whatsapp.replace(/[^0-9]/g, '')}`
    : undefined

  useEffect(() => {
    if (!business.address) return

    // Use Nominatim (free OpenStreetMap geocoding) to get coordinates from address
    const geocode = async () => {
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(business.address)}&limit=1`,
          { headers: { 'Accept-Language': 'en' } }
        )
        const results = await res.json()
        if (results && results.length > 0) {
          const { lat, lon } = results[0]
          const latNum = parseFloat(lat)
          const lonNum = parseFloat(lon)
          const delta = 0.005
          const bbox = `${lonNum - delta},${latNum - delta},${lonNum + delta},${latNum + delta}`
          setMapUrl(
            `https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat},${lon}`
          )
        }
      } catch (err) {
        console.error('Geocoding failed:', err)
      }
    }

    geocode()
  }, [business.address])

  return (
    <div>
      <h2 className="text-xl font-bold text-[#e8e8f0] mb-6">Get In Touch</h2>
      <div className="grid md:grid-cols-2 gap-6">
        {/* Left Column - Contact Details */}
        <div className="space-y-4">
          {business.phone && (
            <a
              href={`tel:${business.phone}`}
              className="flex items-center gap-3 text-[#e8e8f0] hover:text-[#4f8ef7] transition-colors"
            >
              <Phone className="h-5 w-5" />
              {business.phone}
            </a>
          )}

          {business.address && (
            <div className="flex items-center gap-3 text-[#8888aa]">
              <MapPin className="h-5 w-5 flex-shrink-0" />
              {business.address}
            </div>
          )}

          {whatsappUrl && (
            <a href={whatsappUrl} target="_blank" rel="noopener noreferrer">
              <button className="flex items-center gap-2 bg-green-500/15 text-green-400 border border-green-500/20 rounded-lg px-4 py-2 hover:bg-green-500/20 transition-colors">
                <MessageCircle className="h-4 w-4" />
                WhatsApp
              </button>
            </a>
          )}

          <div className="flex gap-3 pt-2">
            {business.socialLinks?.instagram && (
              <a
                href={business.socialLinks.instagram}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8888aa] hover:text-[#e8e8f0] transition-colors"
              >
                <Instagram className="h-5 w-5" />
              </a>
            )}
            {business.socialLinks?.facebook && (
              <a
                href={business.socialLinks.facebook}
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#8888aa] hover:text-[#e8e8f0] transition-colors"
              >
                <Facebook className="h-5 w-5" />
              </a>
            )}
          </div>

          <p className="text-xs text-[#5a5a7a] pt-4">Powered by LokalWeb</p>
        </div>

        {/* Right Column - Map */}
        <div className="bg-[#151522] border border-[rgba(120,120,255,0.12)] rounded-xl overflow-hidden h-56">
          {mapUrl ? (
            <iframe
              title="Map"
              src={mapUrl}
              width="100%"
              height="100%"
              style={{ border: 0 }}
              loading="lazy"
            />
          ) : (
            <div className="flex items-center justify-center h-full text-[#5a5a7a] text-sm">
              {business.address ? 'Loading map...' : 'No address provided'}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

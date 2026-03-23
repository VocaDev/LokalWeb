'use client'

import { Business, Service, BusinessHours } from '@/lib/types'
import BarbershopTemplate from '../templates/BarbershopTemplate'
import BeautySalonTemplate from '../templates/BeautySalonTemplate'
import RestaurantTemplate from '../templates/RestaurantTemplate'
import ClinicTemplate from '../templates/ClinicTemplate'

type TemplateProps = {
  business: Business
  services: Service[]
  hours: BusinessHours[]
}

export default function TemplateRouter({ business, services, hours }: TemplateProps) {
  switch (business.industry) {
    case 'barbershop':
      return <BarbershopTemplate business={business} services={services} hours={hours} />
    case 'beauty-salon':
      return <BeautySalonTemplate business={business} services={services} hours={hours} />
    case 'restaurant':
      return <RestaurantTemplate business={business} services={services} hours={hours} />
    case 'clinic':
      return <ClinicTemplate business={business} services={services} hours={hours} />
    default:
      return <BarbershopTemplate business={business} services={services} hours={hours} />
  }
}

'use client'
// app/institutions/page.tsx

import React, { useEffect, useState } from 'react'
import { motion } from 'framer-motion'
import { Building2, Search, MapPin, Globe, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'
import { KENYAN_COUNTIES } from '@/lib/validations'

interface Institution {
  id: string
  name: string
  type: string
  county: string
  code?: string
  website?: string
}

const TYPE_COLORS: Record<string, string> = {
  UNIVERSITY: 'bg-brand-50 text-brand-700 border-brand-200',
  COLLEGE: 'bg-purple-50 text-purple-700 border-purple-200',
  HIGH_SCHOOL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TVET: 'bg-amber-50 text-amber-700 border-amber-200',
  PRIMARY_SCHOOL: 'bg-pink-50 text-pink-700 border-pink-200',
}

export default function InstitutionsPage() {
  const { token } = useAuth()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [county, setCounty] = useState('')

  useEffect(() => {
    fetchInstitutions()
  }, [search, type, county])

  async function fetchInstitutions() {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.set('search', search)
      if (type) params.set('type', type)
      if (county) params.set('county', county)

      const res = await fetch(`/api/institutions?${params}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const data = await res.json()
      if (data.success) setInstitutions(data.data.institutions)
    } catch (err) {
      console.error('Failed to load institutions:', err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Institutions Directory</h1>
        <p className="text-gray-500 text-sm mt-1">
          {institutions.length} recognized institutions
        </p>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              placeholder="Search institutions..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500"
            />
          </div>
          <select
            value={type}
            onChange={(e) => setType(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Types</option>
            {['UNIVERSITY', 'COLLEGE', 'HIGH_SCHOOL', 'TVET'].map((t) => (
              <option key={t} value={t}>{t.replace('_', ' ')}</option>
            ))}
          </select>
          <select
            value={county}
            onChange={(e) => setCounty(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm appearance-none bg-white focus:outline-none focus:ring-2 focus:ring-brand-500"
          >
            <option value="">All Counties</option>
            {KENYAN_COUNTIES.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Institutions Grid */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <RefreshCw className="w-6 h-6 text-brand-400 animate-spin" />
        </div>
      ) : institutions.length === 0 ? (
        <div className="text-center py-16 bg-white rounded-2xl border border-gray-100">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No institutions found</p>
          <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutions.map((inst, i) => (
            <motion.div
              key={inst.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.03 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all hover:-translate-y-0.5"
            >
              <div className="flex items-start gap-3 mb-3">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-5 h-5 text-gray-500" />
                </div>
                <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border ${TYPE_COLORS[inst.type] || 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {inst.type.replace('_', ' ')}
                </span>
              </div>
              <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2">
                {inst.name}
              </h3>
              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5" />
                  {inst.county} County
                </p>
                {inst.code && (
                  <p className="text-xs text-gray-400 font-mono">Code: {inst.code}</p>
                )}
                {inst.website && (
                  <a
                    href={inst.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-brand-600 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5" />
                    Visit website
                  </a>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  )
}

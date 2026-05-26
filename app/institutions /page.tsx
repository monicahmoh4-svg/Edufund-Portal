'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { motion } from 'framer-motion'
import { Building2, Search, MapPin, Globe, RefreshCw } from 'lucide-react'
import { useAuth } from '@/hooks/useAuth'

interface Institution {
  id: string
  name: string
  type: string
  county: string
  code?: string
  website?: string
}

const COUNTIES = [
  'Baringo','Bomet','Bungoma','Busia','Elgeyo-Marakwet','Embu','Garissa',
  'Homa Bay','Isiolo','Kajiado','Kakamega','Kericho','Kiambu','Kilifi',
  'Kirinyaga','Kisii','Kisumu','Kitui','Kwale','Laikipia','Lamu','Machakos',
  'Makueni','Mandera','Marsabit','Meru','Migori','Mombasa',"Murang'a",
  'Nairobi','Nakuru','Nandi','Narok','Nyamira','Nyandarua','Nyeri',
  'Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi','Trans Nzoia',
  'Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
]

const TYPE_COLORS: Record<string, string> = {
  UNIVERSITY:    'bg-blue-50 text-blue-700 border-blue-200',
  COLLEGE:       'bg-purple-50 text-purple-700 border-purple-200',
  HIGH_SCHOOL:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  TVET:          'bg-amber-50 text-amber-700 border-amber-200',
  PRIMARY_SCHOOL:'bg-pink-50 text-pink-700 border-pink-200',
}

export default function InstitutionsPage() {
  const { token } = useAuth()
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [type, setType] = useState('')
  const [county, setCounty] = useState('')

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const q = new URLSearchParams()
      if (search) q.set('search', search)
      if (type)   q.set('type', type)
      if (county) q.set('county', county)

      const res = await fetch(`/api/institutions?${q}`, {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      })
      const json = await res.json()
      if (json.success) setInstitutions(json.data.institutions)
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }, [search, type, county, token])

  useEffect(() => { load() }, [load])

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Institutions Directory</h1>
        <p className="text-gray-500 text-sm mt-1">
          {loading ? 'Loading...' : `${institutions.length} recognized institutions`}
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
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
          <select
            value={type}
            onChange={e => setType(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Types</option>
            <option value="UNIVERSITY">University</option>
            <option value="COLLEGE">College</option>
            <option value="HIGH_SCHOOL">High School</option>
            <option value="TVET">TVET</option>
          </select>
          <select
            value={county}
            onChange={e => setCounty(e.target.value)}
            className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Counties</option>
            {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
          </select>
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="flex items-center justify-center py-20">
          <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
        </div>
      ) : institutions.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Building2 className="w-10 h-10 mx-auto mb-3 text-gray-300" />
          <p className="text-gray-500 font-medium">No institutions found</p>
          <p className="text-gray-400 text-sm mt-1">Try different search terms or filters</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {institutions.map((inst, i) => (
            <motion.div
              key={inst.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.02 }}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4
                         hover:shadow-md hover:-translate-y-0.5 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                  <Building2 className="w-5 h-5 text-gray-500" />
                </div>
                <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border
                  ${TYPE_COLORS[inst.type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                  {inst.type.replace(/_/g, ' ')}
                </span>
              </div>

              <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2">
                {inst.name}
              </h3>

              <div className="space-y-1">
                <p className="flex items-center gap-1.5 text-xs text-gray-500">
                  <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                  {inst.county} County
                </p>
                {inst.code && (
                  <p className="text-xs text-gray-400">
                    Code: <span className="font-mono">{inst.code}</span>
                  </p>
                )}
                {inst.website && (
                  <a
                    href={inst.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline"
                  >
                    <Globe className="w-3.5 h-3.5 flex-shrink-0" />
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

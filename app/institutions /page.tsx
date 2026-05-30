'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Building2, Search, MapPin, Globe, RefreshCw,
  GraduationCap, LayoutDashboard, FileText,
  BookOpen, Bell, LogOut, Menu, X, User
} from 'lucide-react'

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
  'Samburu','Siaya','Taita-Taveta','Tana River','Tharaka-Nithi',
  'Trans Nzoia','Turkana','Uasin Gishu','Vihiga','Wajir','West Pokot',
]

const TYPE_COLORS: Record<string, string> = {
  UNIVERSITY:    'bg-blue-50 text-blue-700 border-blue-200',
  COLLEGE:       'bg-purple-50 text-purple-700 border-purple-200',
  HIGH_SCHOOL:   'bg-emerald-50 text-emerald-700 border-emerald-200',
  TVET:          'bg-amber-50 text-amber-700 border-amber-200',
  PRIMARY_SCHOOL:'bg-pink-50 text-pink-700 border-pink-200',
}

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',    icon: LayoutDashboard },
  { href: '/applications',  label: 'My Application', icon: FileText },
  { href: '/bursaries',     label: 'Bursaries',    icon: BookOpen },
  { href: '/institutions',  label: 'Institutions', icon: Building2 },
  { href: '/notifications', label: 'Notifications', icon: Bell },
]

function getAuth() {
  try {
    const raw = localStorage.getItem('edufund-auth')
    if (!raw) return null
    const parsed = JSON.parse(raw)
    return parsed?.state ?? null
  } catch {
    return null
  }
}

export default function InstitutionsPage() {
  const pathname = usePathname()
  const router   = useRouter()

  const [ready,        setReady]        = useState(false)
  const [token,        setToken]        = useState<string | null>(null)
  const [user,         setUser]         = useState<{ fullName: string; email: string } | null>(null)
  const [menuOpen,     setMenuOpen]     = useState(false)
  const [institutions, setInstitutions] = useState<Institution[]>([])
  const [loading,      setLoading]      = useState(false)
  const [search,       setSearch]       = useState('')
  const [typeFilter,   setTypeFilter]   = useState('')
  const [countyFilter, setCountyFilter] = useState('')

  // Read auth from localStorage on mount
  useEffect(() => {
    const auth = getAuth()
    if (!auth?.user || !auth?.token) {
      router.replace('/auth/login')
      return
    }
    setUser(auth.user)
    setToken(auth.token)
    setReady(true)
  }, [])

  // Fetch institutions once auth is ready or filters change
  useEffect(() => {
    if (!ready) return
    const ctrl = new AbortController()

    async function fetchData() {
      setLoading(true)
      try {
        const q = new URLSearchParams()
        if (search)       q.set('search', search)
        if (typeFilter)   q.set('type',   typeFilter)
        if (countyFilter) q.set('county', countyFilter)

        const res = await fetch(`/api/institutions?${q.toString()}`, {
          signal: ctrl.signal,
          headers: token ? { Authorization: `Bearer ${token}` } : {},
        })
        const json = await res.json()
        if (json.success) setInstitutions(json.data.institutions)
      } catch (e: unknown) {
        if ((e as Error).name !== 'AbortError') console.error(e)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
    return () => ctrl.abort()
  }, [ready, search, typeFilter, countyFilter, token])

  function logout() {
    localStorage.removeItem('edufund-auth')
    document.cookie = 'auth_token=; path=/; max-age=0'
    router.replace('/')
  }

  const initials = user?.fullName
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase() ?? '??'

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 shadow-sm z-30">
        {/* Logo */}
        <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
          <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-bold text-gray-900 text-sm leading-none">EduFund</p>
            <p className="text-xs text-gray-400 mt-0.5">Student Portal</p>
          </div>
        </div>

        {/* User card */}
        <div className="px-3 py-3 border-b border-gray-100">
          <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
            <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
              {initials}
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-gray-900 text-sm truncate">{user?.fullName}</p>
              <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-3 space-y-0.5 overflow-y-auto">
          {NAV_ITEMS.map(item => {
            const active = pathname === item.href
            return (
              <Link key={item.href} href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                  active
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}>
                <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
          <Link href="/profile"
            className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
            <User className="w-[18px] h-[18px]" />
            Profile
          </Link>
          <button onClick={logout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
            <LogOut className="w-[18px] h-[18px]" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* ── Mobile Sidebar ── */}
      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-gray-900">EduFund</span>
              </div>
              <button onClick={() => setMenuOpen(false)}
                className="p-2 rounded-lg hover:bg-gray-100 transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-3 space-y-0.5">
              {NAV_ITEMS.map(item => {
                const active = pathname === item.href
                return (
                  <Link key={item.href} href={item.href}
                    onClick={() => setMenuOpen(false)}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                      active
                        ? 'bg-blue-600 text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}>
                    <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
                    {item.label}
                  </Link>
                )
              })}
            </nav>
            <div className="px-3 py-3 border-t border-gray-100">
              <button onClick={logout}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
                <LogOut className="w-[18px] h-[18px]" />
                Sign Out
              </button>
            </div>
          </aside>
        </div>
      )}

      {/* ── Main Content ── */}
      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">

        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 lg:px-8 h-14 flex items-center justify-between">
          <button onClick={() => setMenuOpen(true)}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors">
            <Menu className="w-5 h-5 text-gray-600" />
          </button>
          <span className="hidden lg:block text-sm text-gray-500">
            Hello, <span className="font-semibold text-gray-900">{user?.fullName?.split(' ')[0]}</span> 👋
          </span>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">
            {initials}
          </div>
        </header>

        {/* Page body */}
        <div className="flex-1 p-4 lg:p-8">
          <div className="space-y-6 max-w-7xl mx-auto">

            {/* Header */}
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Institutions Directory</h1>
              <p className="text-gray-500 text-sm mt-1">
                {loading
                  ? 'Loading...'
                  : `${institutions.length} recognized institutions`}
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
                <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Types</option>
                  <option value="UNIVERSITY">University</option>
                  <option value="COLLEGE">College</option>
                  <option value="HIGH_SCHOOL">High School</option>
                  <option value="TVET">TVET</option>
                </select>
                <select value={countyFilter} onChange={e => setCountyFilter(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white
                             focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Counties</option>
                  {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>

            {/* Grid */}
            {loading ? (
              <div className="flex items-center justify-center py-24">
                <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
              </div>
            ) : institutions.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-500 font-medium">No institutions found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {institutions.map(inst => (
                  <div key={inst.id}
                    className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4
                               hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center">
                        <Building2 className="w-5 h-5 text-gray-500" />
                      </div>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${
                        TYPE_COLORS[inst.type] ?? 'bg-gray-50 text-gray-600 border-gray-200'
                      }`}>
                        {inst.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2">
                      {inst.name}
                    </h3>
                    <div className="space-y-1.5">
                      <p className="flex items-center gap-1.5 text-xs text-gray-500">
                        <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                        {inst.county} County
                      </p>
                      {inst.code && (
                        <p className="text-xs text-gray-400">
                          Code: <span className="font-mono font-medium">{inst.code}</span>
                        </p>
                      )}
                      {inst.website && (
                        <a href={inst.website} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                          <Globe className="w-3.5 h-3.5 flex-shrink-0" />
                          Visit website
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

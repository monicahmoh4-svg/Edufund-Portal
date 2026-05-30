'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  BookOpen, Calendar, DollarSign, RefreshCw, ArrowRight,
  GraduationCap, LayoutDashboard, FileText, Building2,
  Bell, LogOut, Menu, X, User, Users
} from 'lucide-react'

interface Bursary {
  id: string
  title: string
  description: string
  amount: number
  deadline: string
  isOpen: boolean
  eligibility?: string
  provider: string
}

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/applications',  label: 'My Application', icon: FileText },
  { href: '/bursaries',     label: 'Bursaries',      icon: BookOpen },
  { href: '/institutions',  label: 'Institutions',   icon: Building2 },
  { href: '/notifications', label: 'Notifications',  icon: Bell },
]

function getAuth() {
  try {
    const raw = localStorage.getItem('edufund-auth')
    if (!raw) return null
    return JSON.parse(raw)?.state ?? null
  } catch { return null }
}

function formatCurrency(amount: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(amount)
}

function formatDate(date: string) {
  return new Date(date).toLocaleDateString('en-KE', { day: 'numeric', month: 'long', year: 'numeric' })
}

function isExpired(deadline: string) { return new Date(deadline) < new Date() }
function daysLeft(deadline: string) {
  return Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000)
}

export default function BursariesPage() {
  const pathname = usePathname()
  const router   = useRouter()

  const [ready,    setReady]    = useState(false)
  const [token,    setToken]    = useState<string | null>(null)
  const [user,     setUser]     = useState<{ fullName: string; email: string } | null>(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const [bursaries, setBursaries] = useState<Bursary[]>([])
  const [loading,  setLoading]  = useState(false)

  useEffect(() => {
    const auth = getAuth()
    if (!auth?.user || !auth?.token) { router.replace('/auth/login'); return }
    setUser(auth.user)
    setToken(auth.token)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    setLoading(true)
    fetch('/api/bursaries', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(json => { if (json.success) setBursaries(json.data.bursaries) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }, [ready, token])

  function logout() {
    localStorage.removeItem('edufund-auth')
    document.cookie = 'auth_token=; path=/; max-age=0'
    router.replace('/')
  }

  const initials = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
    </div>
  )

  const Sidebar = () => (
    <>
      <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-2.5">
        <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
          <GraduationCap className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="font-bold text-gray-900 text-sm">EduFund</p>
          <p className="text-xs text-gray-400">Student Portal</p>
        </div>
      </div>
      <div className="px-3 py-3 border-b border-gray-100">
        <div className="bg-blue-50 rounded-xl p-3 flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">{initials}</div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-900 text-sm truncate">{user?.fullName}</p>
            <p className="text-xs text-gray-500 truncate">{user?.email}</p>
          </div>
        </div>
      </div>
      <nav className="flex-1 px-3 py-3 space-y-0.5">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          return (
            <Link key={item.href} href={item.href} onClick={() => setMenuOpen(false)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${active ? 'bg-blue-600 text-white shadow-sm' : 'text-gray-600 hover:bg-gray-100'}`}>
              <item.icon className="w-[18px] h-[18px] flex-shrink-0" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="px-3 py-3 border-t border-gray-100 space-y-0.5">
        <Link href="/profile" className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-100 transition-all">
          <User className="w-[18px] h-[18px]" /> Profile
        </Link>
        <button onClick={logout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-red-500 hover:bg-red-50 transition-all">
          <LogOut className="w-[18px] h-[18px]" /> Sign Out
        </button>
      </div>
    </>
  )

  return (
    <div className="min-h-screen bg-gray-50 flex">
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 shadow-sm z-30"><Sidebar /></aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-bold text-gray-900">EduFund</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <Sidebar />
          </aside>
        </div>
      )}

      <main className="flex-1 lg:ml-64 flex flex-col min-h-screen">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-sm border-b border-gray-100 px-4 lg:px-8 h-14 flex items-center justify-between">
          <button onClick={() => setMenuOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-gray-100"><Menu className="w-5 h-5 text-gray-600" /></button>
          <span className="hidden lg:block text-sm text-gray-500">Hello, <span className="font-semibold text-gray-900">{user?.fullName?.split(' ')[0]}</span> 👋</span>
          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs">{initials}</div>
        </header>

        <div className="flex-1 p-4 lg:p-8">
          <div className="space-y-6 max-w-7xl mx-auto">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Active Bursaries</h1>
              <p className="text-gray-500 text-sm mt-1">
                {loading ? 'Loading...' : `${bursaries.filter(b => b.isOpen && !isExpired(b.deadline)).length} open funding opportunities`}
              </p>
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-24">
                <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
              </div>
            ) : bursaries.length === 0 ? (
              <div className="text-center py-24 bg-white rounded-2xl border border-gray-100">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-500 font-medium">No bursaries available</p>
                <p className="text-gray-400 text-sm mt-1">Check back soon for new opportunities</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {bursaries.map(b => {
                  const expired = isExpired(b.deadline)
                  const closing = !expired && daysLeft(b.deadline) <= 14
                  const days    = daysLeft(b.deadline)
                  return (
                    <div key={b.id} className={`bg-white rounded-2xl border shadow-sm flex flex-col hover:shadow-md transition-all ${expired ? 'opacity-60 border-gray-100' : 'border-gray-100 hover:-translate-y-0.5'}`}>
                      <div className="p-5 flex-1">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0">
                            <BookOpen className="w-5 h-5 text-blue-600" />
                          </div>
                          {expired ? (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Closed</span>
                          ) : closing ? (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 animate-pulse">Closes in {days}d</span>
                          ) : (
                            <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Open</span>
                          )}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">{b.title}</h3>
                        <p className="text-xs text-blue-600 font-semibold mb-3">{b.provider}</p>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">{b.description}</p>
                        {b.eligibility && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                            <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1">
                              <Users className="w-3.5 h-3.5" /> Eligibility
                            </p>
                            <p className="text-xs text-blue-700">{b.eligibility}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400">Award Amount</p>
                            <p className="text-lg font-black text-blue-700">{formatCurrency(b.amount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 flex items-center gap-1 justify-end"><Calendar className="w-3.5 h-3.5" /> Deadline</p>
                            <p className={`text-sm font-semibold ${expired ? 'text-gray-400' : closing ? 'text-red-600' : 'text-gray-700'}`}>{formatDate(b.deadline)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-5 pb-5">
                        {!expired ? (
                          <Link href="/applications/new"
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all group">
                            Apply Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                          </Link>
                        ) : (
                          <div className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium text-center">Applications Closed</div>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}

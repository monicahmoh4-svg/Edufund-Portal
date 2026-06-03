'use client'
// app/dashboard/page.tsx
// Tabs: Dashboard | My Application | Bursaries | Institutions | Notifications

import React, { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import {
  LayoutDashboard, FileText, BookOpen, Building2, Bell,
  RefreshCw, CheckCircle, Clock, AlertCircle, XCircle,
  ArrowRight, Plus, DollarSign, Calendar, Search,
  MapPin, Globe, Users, CheckCheck, Star
} from 'lucide-react'

// ── Types ──────────────────────────────────────────────────────────────
interface Application {
  id: string; referenceNo: string; status: string
  institutionName: string; course: string
  amountRequested: number; createdAt: string
  payment?: { status: string; mpesaReceiptNo?: string }
}
interface Bursary {
  id: string; title: string; description: string; amount: number
  deadline: string; isOpen: boolean; eligibility?: string; provider: string
}
interface Institution {
  id: string; name: string; type: string
  county: string; code?: string; website?: string
}
interface Notification {
  id: string; title: string; message: string
  type: string; isRead: boolean; createdAt: string
}

// ── Helpers ────────────────────────────────────────────────────────────
const STATUS_COLOR: Record<string, string> = {
  DRAFT:        'bg-gray-100 text-gray-700 border-gray-200',
  SUBMITTED:    'bg-blue-50 text-blue-700 border-blue-200',
  UNDER_REVIEW: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED:     'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED:     'bg-red-50 text-red-700 border-red-200',
  DISBURSED:    'bg-purple-50 text-purple-700 border-purple-200',
}
const STATUS_LABEL: Record<string, string> = {
  DRAFT: 'Draft', SUBMITTED: 'Submitted', UNDER_REVIEW: 'Under Review',
  APPROVED: 'Approved', REJECTED: 'Rejected', DISBURSED: 'Disbursed',
}
const TYPE_COLOR: Record<string, string> = {
  UNIVERSITY: 'bg-blue-50 text-blue-700 border-blue-200',
  COLLEGE: 'bg-purple-50 text-purple-700 border-purple-200',
  HIGH_SCHOOL: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  TVET: 'bg-amber-50 text-amber-700 border-amber-200',
  PRIMARY_SCHOOL: 'bg-pink-50 text-pink-700 border-pink-200',
}
const NOTIF_CFG: Record<string, { border: string; dot: string }> = {
  success: { border: 'border-l-emerald-400', dot: 'bg-emerald-500' },
  error:   { border: 'border-l-red-400',     dot: 'bg-red-500' },
  warning: { border: 'border-l-amber-400',   dot: 'bg-amber-500' },
  info:    { border: 'border-l-blue-400',    dot: 'bg-blue-500' },
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

function fmtCurrency(n: number) {
  return new Intl.NumberFormat('en-KE', { style: 'currency', currency: 'KES', minimumFractionDigits: 0 }).format(n)
}
function fmtDate(d: string) {
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}
function isExpired(d: string) { return new Date(d) < new Date() }
function daysLeft(d: string) { return Math.ceil((new Date(d).getTime() - Date.now()) / 86400000) }

const STATUS_STEPS = ['SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'DISBURSED']

// ── Main Component ─────────────────────────────────────────────────────
export default function DashboardPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()

  const [token,         setToken]         = useState<string | null>(null)
  const [user,          setUser]          = useState<{ fullName: string; email: string; role: string } | null>(null)
  const [activeTab,     setActiveTab]     = useState(searchParams.get('tab') || 'home')
  const [loading,       setLoading]       = useState(false)

  // Data states
  const [application,   setApplication]   = useState<Application | null>(null)
  const [bursaries,     setBursaries]     = useState<Bursary[]>([])
  const [institutions,  setInstitutions]  = useState<Institution[]>([])
  const [notifications, setNotifications] = useState<Notification[]>([])

  // Institution filters
  const [instSearch,  setInstSearch]  = useState('')
  const [instType,    setInstType]    = useState('')
  const [instCounty,  setInstCounty]  = useState('')

  // Init auth from localStorage
  useEffect(() => {
    try {
      const raw = localStorage.getItem('edufund-auth')
      if (!raw) { router.replace('/auth/login'); return }
      const state = JSON.parse(raw)?.state
      if (!state?.user || !state?.token) { router.replace('/auth/login'); return }
      if (state.user.role === 'ADMIN') { router.replace('/admin'); return }
      setUser(state.user)
      setToken(state.token)
    } catch { router.replace('/auth/login') }
  }, [])

  // Fetch data when token ready
  useEffect(() => {
    if (!token) return
    fetchAll()
  }, [token])

  // Fetch institutions when filters change
  useEffect(() => {
    if (!token) return
    fetchInstitutions()
  }, [instSearch, instType, instCounty, token])

  async function apiFetch(url: string) {
    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    })
    return res.json()
  }

  async function fetchAll() {
    setLoading(true)
    try {
      const [appRes, burRes, notifRes] = await Promise.all([
        apiFetch('/api/applications?limit=1'),
        apiFetch('/api/bursaries'),
        apiFetch('/api/notifications'),
      ])
      if (appRes.success && appRes.data.applications.length > 0) setApplication(appRes.data.applications[0])
      if (burRes.success) setBursaries(burRes.data.bursaries)
      if (notifRes.success) setNotifications(notifRes.data.notifications)
    } catch (e) { console.error(e) }
    finally { setLoading(false) }
  }

  const fetchInstitutions = useCallback(async () => {
    if (!token) return
    const q = new URLSearchParams()
    if (instSearch) q.set('search', instSearch)
    if (instType)   q.set('type', instType)
    if (instCounty) q.set('county', instCounty)
    const res = await fetch(`/api/institutions?${q}`, {
      headers: { Authorization: `Bearer ${token}` },
    })
    const json = await res.json()
    if (json.success) setInstitutions(json.data.institutions)
  }, [token, instSearch, instType, instCounty])

  async function markAllRead() {
    await apiFetch('/api/notifications')
    // use PATCH separately
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(n => n.map(x => ({ ...x, isRead: true })))
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ notificationId: id }),
    })
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
  }

  function logout() {
    localStorage.removeItem('edufund-auth')
    document.cookie = 'auth_token=; path=/; max-age=0'
    router.replace('/')
  }

  const unread = notifications.filter(n => !n.isRead).length
  const statusIdx = application ? STATUS_STEPS.indexOf(application.status) : -1

  const TABS = [
    { id: 'home',          label: 'Dashboard',      icon: LayoutDashboard },
    { id: 'applications',  label: 'My Application', icon: FileText },
    { id: 'bursaries',     label: 'Bursaries',      icon: BookOpen },
    { id: 'institutions',  label: 'Institutions',   icon: Building2 },
    { id: 'notifications', label: 'Notifications',  icon: Bell, badge: unread },
  ]

  if (!user) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* ── Top nav ── */}
      <header className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Logo */}
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center flex-shrink-0">
                <BookOpen className="w-4 h-4 text-white" />
              </div>
              <span className="font-bold text-gray-900 hidden sm:block">EduFund Portal</span>
            </div>

            {/* Tab navigation */}
            <nav className="flex items-center gap-0.5 overflow-x-auto scrollbar-hide">
              {TABS.map(tab => (
                <button key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all whitespace-nowrap flex-shrink-0 ${
                    activeTab === tab.id
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-100'
                  }`}>
                  <tab.icon className="w-3.5 h-3.5" />
                  <span className="hidden sm:block">{tab.label}</span>
                  {tab.badge && tab.badge > 0 && (
                    <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center ${activeTab === tab.id ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
                      {tab.badge > 9 ? '9+' : tab.badge}
                    </span>
                  )}
                </button>
              ))}
            </nav>

            {/* User + logout */}
            <div className="flex items-center gap-2">
              <div className="hidden sm:block text-right">
                <p className="text-xs font-semibold text-gray-900 leading-tight">{user.fullName?.split(' ')[0]}</p>
                <p className="text-[10px] text-gray-400">Student</p>
              </div>
              <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-xs flex-shrink-0">
                {user.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase()}
              </div>
              <button onClick={logout}
                className="text-xs text-gray-400 hover:text-red-500 transition-colors px-2 py-1 rounded-lg hover:bg-red-50">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* ── Page Content ── */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">

        {/* ═══ HOME TAB ═══ */}
        {activeTab === 'home' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Hello, {user.fullName?.split(' ')[0]} 👋</h1>
              <p className="text-gray-500 text-sm mt-1">{application ? 'Track your bursary application below.' : 'Ready to start your bursary application?'}</p>
            </div>

            {!application && (
              <div className="bg-gradient-to-br from-blue-600 to-blue-700 rounded-2xl p-8 text-white">
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
                  <div>
                    <h2 className="text-xl font-bold mb-2">Apply for a Bursary</h2>
                    <p className="text-blue-100 text-sm max-w-md">Fill out our guided 5-step application form. It takes about 15 minutes.</p>
                  </div>
                  <Link href="/applications/new"
                    className="flex-shrink-0 inline-flex items-center gap-2 px-6 py-3 bg-white text-blue-700 font-bold rounded-xl hover:bg-blue-50 transition-all shadow-md">
                    <Plus className="w-4 h-4" /> Start Application
                  </Link>
                </div>
              </div>
            )}

            {application && (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-50 flex items-center justify-between">
                  <div>
                    <h2 className="font-bold text-gray-900">My Application</h2>
                    <p className="text-xs text-gray-400 mt-0.5 font-mono">{application.referenceNo}</p>
                  </div>
                  <span className={`text-xs font-semibold px-3 py-1 rounded-full border ${STATUS_COLOR[application.status]}`}>
                    {STATUS_LABEL[application.status]}
                  </span>
                </div>
                <div className="px-6 py-5">
                  {!['DRAFT', 'REJECTED'].includes(application.status) && (
                    <div className="mb-5">
                      <div className="flex items-center justify-between relative">
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100">
                          <div className="h-full bg-blue-500 transition-all" style={{ width: `${Math.max(0, (statusIdx / (STATUS_STEPS.length - 1)) * 100)}%` }} />
                        </div>
                        {STATUS_STEPS.map((step, i) => (
                          <div key={step} className="relative flex flex-col items-center z-10">
                            <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${i < statusIdx ? 'bg-blue-600 border-blue-600' : i === statusIdx ? 'bg-white border-blue-600 ring-4 ring-blue-100' : 'bg-white border-gray-200'}`}>
                              {i < statusIdx ? <CheckCircle className="w-4 h-4 text-white" /> : i === statusIdx ? <Clock className="w-3.5 h-3.5 text-blue-600" /> : <div className="w-2 h-2 bg-gray-300 rounded-full" />}
                            </div>
                            <span className={`mt-1.5 text-[10px] font-semibold whitespace-nowrap hidden sm:block ${i <= statusIdx ? 'text-blue-700' : 'text-gray-400'}`}>{STATUS_LABEL[step]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Institution', value: application.institutionName },
                      { label: 'Course', value: application.course },
                      { label: 'Amount Requested', value: fmtCurrency(application.amountRequested) },
                      { label: 'Submitted On', value: fmtDate(application.createdAt) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 font-medium">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Quick actions */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { icon: FileText,   label: 'My Application',    desc: application ? STATUS_LABEL[application.status] : 'Start a new application', tab: 'applications', color: 'text-blue-600 bg-blue-50' },
                { icon: BookOpen,   label: 'Active Bursaries',  desc: `${bursaries.filter(b => b.isOpen && !isExpired(b.deadline)).length} open opportunities`, tab: 'bursaries', color: 'text-emerald-600 bg-emerald-50' },
                { icon: Building2,  label: 'Institutions',      desc: `${institutions.length} recognized institutions`, tab: 'institutions', color: 'text-purple-600 bg-purple-50' },
              ].map(item => (
                <button key={item.tab} onClick={() => setActiveTab(item.tab)}
                  className="flex items-center gap-4 p-5 bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all group text-left">
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0 ${item.color}`}>
                    <item.icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold text-gray-900 text-sm">{item.label}</p>
                    <p className="text-gray-500 text-xs truncate mt-0.5">{item.desc}</p>
                  </div>
                  <ArrowRight className="ml-auto w-4 h-4 text-gray-300 group-hover:text-gray-500 flex-shrink-0 transition-colors" />
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ═══ MY APPLICATION TAB ═══ */}
        {activeTab === 'applications' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold text-gray-900">My Application</h1>
              {(!application || ['REJECTED','DISBURSED'].includes(application?.status ?? '')) && (
                <Link href="/applications/new"
                  className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-sm">
                  <Plus className="w-4 h-4" /> New Application
                </Link>
              )}
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20"><RefreshCw className="w-7 h-7 text-blue-400 animate-spin" /></div>
            ) : !application ? (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-12 text-center">
                <div className="w-16 h-16 bg-blue-50 rounded-2xl flex items-center justify-center mx-auto mb-4"><FileText className="w-8 h-8 text-blue-400" /></div>
                <h2 className="text-lg font-bold text-gray-900 mb-2">No applications yet</h2>
                <p className="text-gray-500 text-sm mb-6">Apply for a bursary to fund your education.</p>
                <Link href="/applications/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all shadow-md group">
                  <Plus className="w-4 h-4" /> Start Your Application <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                </Link>
              </div>
            ) : (
              <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
                <div className="px-6 py-5 border-b border-gray-50 flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-bold text-gray-900 text-lg">Application Details</p>
                    <p className="text-xs text-gray-400 font-mono mt-0.5">{application.referenceNo}</p>
                  </div>
                  <span className={`text-sm font-semibold px-4 py-1.5 rounded-full border ${STATUS_COLOR[application.status]}`}>{STATUS_LABEL[application.status]}</span>
                </div>
                <div className="p-6 space-y-5">
                  {!['DRAFT','REJECTED'].includes(application.status) && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-4">Application Progress</p>
                      <div className="flex items-center justify-between relative">
                        <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100">
                          <div className="h-full bg-blue-500" style={{ width: `${Math.max(0, (statusIdx / (STATUS_STEPS.length - 1)) * 100)}%` }} />
                        </div>
                        {STATUS_STEPS.map((step, i) => (
                          <div key={step} className="relative flex flex-col items-center z-10">
                            <div className={`w-9 h-9 rounded-full border-2 flex items-center justify-center ${i < statusIdx ? 'bg-blue-600 border-blue-600' : i === statusIdx ? 'bg-white border-blue-600 ring-4 ring-blue-100' : 'bg-white border-gray-200'}`}>
                              {i < statusIdx ? <CheckCircle className="w-5 h-5 text-white" /> : i === statusIdx ? <Clock className="w-4 h-4 text-blue-600" /> : <div className="w-2 h-2 bg-gray-300 rounded-full" />}
                            </div>
                            <span className={`mt-2 text-xs font-semibold whitespace-nowrap hidden sm:block ${i <= statusIdx ? 'text-blue-700' : 'text-gray-400'}`}>{STATUS_LABEL[step]}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                  {application.status === 'DRAFT' && (
                    <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
                      <AlertCircle className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-amber-800 font-semibold text-sm">Application Incomplete</p>
                        <p className="text-amber-600 text-xs mt-1">Complete and pay the application fee to submit.</p>
                        <Link href="/applications/new" className="inline-flex items-center gap-1 text-xs text-amber-700 font-semibold mt-2 hover:underline">Continue Application <ArrowRight className="w-3 h-3" /></Link>
                      </div>
                    </div>
                  )}
                  {application.status === 'REJECTED' && (
                    <div className="p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
                      <XCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="text-red-800 font-semibold text-sm">Application Rejected</p>
                        <p className="text-red-600 text-xs mt-1">Your application was not successful. Please contact support for details.</p>
                      </div>
                    </div>
                  )}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    {[
                      { label: 'Institution', value: application.institutionName },
                      { label: 'Course', value: application.course },
                      { label: 'Amount Requested', value: fmtCurrency(application.amountRequested) },
                      { label: 'Date Applied', value: fmtDate(application.createdAt) },
                    ].map(({ label, value }) => (
                      <div key={label} className="bg-gray-50 rounded-xl p-3">
                        <p className="text-xs text-gray-400 font-medium">{label}</p>
                        <p className="text-sm font-semibold text-gray-800 truncate mt-0.5">{value}</p>
                      </div>
                    ))}
                  </div>
                  {application.payment?.status === 'SUCCESS' && (
                    <div className="flex items-center gap-2 text-emerald-700 text-sm">
                      <CheckCircle className="w-4 h-4" />
                      <span className="font-medium">Payment confirmed — M-Pesa: {application.payment.mpesaReceiptNo}</span>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ BURSARIES TAB ═══ */}
        {activeTab === 'bursaries' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Active Bursaries</h1>
              <p className="text-gray-500 text-sm mt-1">{bursaries.filter(b => b.isOpen && !isExpired(b.deadline)).length} open funding opportunities</p>
            </div>
            {loading ? (
              <div className="flex items-center justify-center py-20"><RefreshCw className="w-7 h-7 text-blue-400 animate-spin" /></div>
            ) : bursaries.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <BookOpen className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-500 font-medium">No bursaries available at the moment</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 xl:grid-cols-3 gap-5">
                {bursaries.map(b => {
                  const expired = isExpired(b.deadline)
                  const closing = !expired && daysLeft(b.deadline) <= 14
                  const days = daysLeft(b.deadline)
                  return (
                    <div key={b.id} className={`bg-white rounded-2xl border shadow-sm flex flex-col hover:shadow-md transition-all ${expired ? 'opacity-60 border-gray-100' : 'border-gray-100 hover:-translate-y-0.5'}`}>
                      <div className="p-5 flex-1">
                        <div className="flex items-start justify-between gap-3 mb-3">
                          <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center flex-shrink-0"><BookOpen className="w-5 h-5 text-blue-600" /></div>
                          {expired ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-gray-100 text-gray-500 border border-gray-200">Closed</span>
                            : closing ? <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-red-50 text-red-600 border border-red-200 animate-pulse">Closes in {days}d</span>
                            : <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">Open</span>}
                        </div>
                        <h3 className="font-bold text-gray-900 text-base leading-tight mb-1">{b.title}</h3>
                        <p className="text-xs text-blue-600 font-semibold mb-3">{b.provider}</p>
                        <p className="text-sm text-gray-600 leading-relaxed line-clamp-3 mb-4">{b.description}</p>
                        {b.eligibility && (
                          <div className="bg-blue-50 border border-blue-100 rounded-xl p-3 mb-4">
                            <p className="text-xs font-semibold text-blue-800 mb-1 flex items-center gap-1"><Users className="w-3.5 h-3.5" /> Eligibility</p>
                            <p className="text-xs text-blue-700">{b.eligibility}</p>
                          </div>
                        )}
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs text-gray-400">Award Amount</p>
                            <p className="text-lg font-black text-blue-700">{fmtCurrency(b.amount)}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-xs text-gray-400 flex items-center gap-1 justify-end"><Calendar className="w-3.5 h-3.5" /> Deadline</p>
                            <p className={`text-sm font-semibold ${expired ? 'text-gray-400' : closing ? 'text-red-600' : 'text-gray-700'}`}>{fmtDate(b.deadline)}</p>
                          </div>
                        </div>
                      </div>
                      <div className="px-5 pb-5">
                        {!expired
                          ? <Link href="/applications/new" className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all group">Apply Now <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" /></Link>
                          : <div className="w-full py-2.5 bg-gray-100 text-gray-400 rounded-xl text-sm font-medium text-center">Applications Closed</div>}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

        {/* ═══ INSTITUTIONS TAB ═══ */}
        {activeTab === 'institutions' && (
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Institutions Directory</h1>
              <p className="text-gray-500 text-sm mt-1">{institutions.length} recognized institutions</p>
            </div>
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input placeholder="Search institutions..." value={instSearch} onChange={e => setInstSearch(e.target.value)}
                    className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                </div>
                <select value={instType} onChange={e => setInstType(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Types</option>
                  <option value="UNIVERSITY">University</option>
                  <option value="COLLEGE">College</option>
                  <option value="HIGH_SCHOOL">High School</option>
                  <option value="TVET">TVET</option>
                </select>
                <select value={instCounty} onChange={e => setInstCounty(e.target.value)}
                  className="px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">All Counties</option>
                  {COUNTIES.map(c => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
            </div>
            {institutions.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <Building2 className="w-12 h-12 mx-auto mb-3 text-gray-200" />
                <p className="text-gray-500 font-medium">No institutions found</p>
                <p className="text-gray-400 text-sm mt-1">Try adjusting your filters</p>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {institutions.map(inst => (
                  <div key={inst.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:-translate-y-0.5 transition-all">
                    <div className="flex items-start justify-between mb-3">
                      <div className="w-9 h-9 bg-gray-100 rounded-xl flex items-center justify-center"><Building2 className="w-5 h-5 text-gray-500" /></div>
                      <span className={`text-xs font-semibold px-2.5 py-0.5 rounded-full border ${TYPE_COLOR[inst.type] ?? 'bg-gray-50 text-gray-600 border-gray-200'}`}>
                        {inst.type.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 text-sm leading-tight mb-2">{inst.name}</h3>
                    <div className="space-y-1.5">
                      <p className="flex items-center gap-1.5 text-xs text-gray-500"><MapPin className="w-3.5 h-3.5 flex-shrink-0" />{inst.county} County</p>
                      {inst.code && <p className="text-xs text-gray-400">Code: <span className="font-mono font-medium">{inst.code}</span></p>}
                      {inst.website && (
                        <a href={inst.website} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-xs text-blue-600 hover:underline">
                          <Globe className="w-3.5 h-3.5 flex-shrink-0" /> Visit website
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ NOTIFICATIONS TAB ═══ */}
        {activeTab === 'notifications' && (
          <div className="space-y-5 max-w-2xl mx-auto">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-500 text-sm mt-1">{unread > 0 ? `${unread} unread` : 'All caught up!'}</p>
              </div>
              {unread > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                  <CheckCheck className="w-4 h-4" /> Mark all read
                </button>
              )}
            </div>
            {notifications.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No notifications yet</p>
                <p className="text-gray-400 text-sm mt-1">We&apos;ll notify you about application updates</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(notif => {
                  const cfg = NOTIF_CFG[notif.type] ?? NOTIF_CFG.info
                  return (
                    <div key={notif.id} onClick={() => !notif.isRead && markRead(notif.id)}
                      className={`bg-white rounded-2xl border-l-4 border border-gray-100 p-5 cursor-pointer hover:shadow-sm transition-all ${cfg.border} ${!notif.isRead ? 'shadow-sm' : 'opacity-70'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${cfg.dot} ${notif.isRead ? 'opacity-30' : ''}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <p className={`text-sm font-bold ${notif.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</p>
                            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{fmtDate(notif.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  )
}

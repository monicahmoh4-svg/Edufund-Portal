'use client'

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import {
  Bell, CheckCheck, RefreshCw,
  GraduationCap, LayoutDashboard, FileText,
  BookOpen, Building2, LogOut, Menu, X, User
} from 'lucide-react'

interface Notification {
  id: string
  title: string
  message: string
  type: string
  isRead: boolean
  createdAt: string
}

const NAV_ITEMS = [
  { href: '/dashboard',     label: 'Dashboard',      icon: LayoutDashboard },
  { href: '/applications',  label: 'My Application', icon: FileText },
  { href: '/bursaries',     label: 'Bursaries',      icon: BookOpen },
  { href: '/institutions',  label: 'Institutions',   icon: Building2 },
  { href: '/notifications', label: 'Notifications',  icon: Bell },
]

const TYPE_CONFIG: Record<string, { border: string; dot: string }> = {
  success: { border: 'border-l-emerald-400 bg-emerald-50/30', dot: 'bg-emerald-500' },
  error:   { border: 'border-l-red-400 bg-red-50/30',         dot: 'bg-red-500' },
  warning: { border: 'border-l-amber-400 bg-amber-50/30',     dot: 'bg-amber-500' },
  info:    { border: 'border-l-blue-400 bg-blue-50/30',       dot: 'bg-blue-500' },
}

function getAuth() {
  try {
    const raw = localStorage.getItem('edufund-auth')
    if (!raw) return null
    return JSON.parse(raw)?.state ?? null
  } catch { return null }
}

function formatDate(d: string) {
  return new Date(d).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default function NotificationsPage() {
  const pathname = usePathname()
  const router   = useRouter()

  const [ready,         setReady]         = useState(false)
  const [token,         setToken]         = useState<string | null>(null)
  const [user,          setUser]          = useState<{ fullName: string; email: string } | null>(null)
  const [menuOpen,      setMenuOpen]      = useState(false)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading,       setLoading]       = useState(false)

  useEffect(() => {
    const auth = getAuth()
    if (!auth?.user || !auth?.token) { router.replace('/auth/login'); return }
    setUser(auth.user)
    setToken(auth.token)
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    fetchNotifications()
  }, [ready, token])

  function fetchNotifications() {
    setLoading(true)
    fetch('/api/notifications', {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
    })
      .then(r => r.json())
      .then(json => { if (json.success) setNotifications(json.data.notifications) })
      .catch(console.error)
      .finally(() => setLoading(false))
  }

  async function markAllRead() {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ markAllRead: true }),
    })
    setNotifications(n => n.map(x => ({ ...x, isRead: true })))
  }

  async function markRead(id: string) {
    await fetch('/api/notifications', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({ notificationId: id }),
    })
    setNotifications(n => n.map(x => x.id === id ? { ...x, isRead: true } : x))
  }

  function logout() {
    localStorage.removeItem('edufund-auth')
    document.cookie = 'auth_token=; path=/; max-age=0'
    router.replace('/')
  }

  const initials    = user?.fullName?.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() ?? '??'
  const unreadCount = notifications.filter(n => !n.isRead).length

  if (!ready) return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
    </div>
  )

  const SidebarContent = () => (
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
              <span className="flex-1">{item.label}</span>
              {item.href === '/notifications' && unreadCount > 0 && (
                <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${active ? 'bg-white/25 text-white' : 'bg-red-500 text-white'}`}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
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
      <aside className="hidden lg:flex flex-col w-64 bg-white border-r border-gray-100 fixed inset-y-0 left-0 shadow-sm z-30">
        <SidebarContent />
      </aside>

      {menuOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="absolute inset-0 bg-black/40" onClick={() => setMenuOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 bg-white shadow-2xl flex flex-col">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <span className="font-bold text-gray-900">EduFund</span>
              <button onClick={() => setMenuOpen(false)} className="p-2 rounded-lg hover:bg-gray-100"><X className="w-4 h-4" /></button>
            </div>
            <SidebarContent />
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
          <div className="max-w-2xl mx-auto space-y-5">

            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Notifications</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
                </p>
              </div>
              {unreadCount > 0 && (
                <button onClick={markAllRead}
                  className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all">
                  <CheckCheck className="w-4 h-4" />
                  Mark all read
                </button>
              )}
            </div>

            {loading ? (
              <div className="flex items-center justify-center py-20">
                <RefreshCw className="w-7 h-7 text-blue-400 animate-spin" />
              </div>
            ) : notifications.length === 0 ? (
              <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
                <Bell className="w-12 h-12 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-500 font-medium">No notifications yet</p>
                <p className="text-gray-400 text-sm mt-1">We&apos;ll notify you about application updates</p>
              </div>
            ) : (
              <div className="space-y-2">
                {notifications.map(notif => {
                  const cfg = TYPE_CONFIG[notif.type] ?? TYPE_CONFIG.info
                  return (
                    <div key={notif.id}
                      onClick={() => !notif.isRead && markRead(notif.id)}
                      className={`bg-white rounded-2xl border-l-4 border border-gray-100 p-5 cursor-pointer transition-all hover:shadow-sm ${cfg.border} ${!notif.isRead ? 'shadow-sm' : 'opacity-70'}`}>
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${cfg.dot} ${notif.isRead ? 'opacity-30' : ''}`} />
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <p className={`text-sm font-bold ${notif.isRead ? 'text-gray-600' : 'text-gray-900'}`}>{notif.title}</p>
                            <span className="text-xs text-gray-400 whitespace-nowrap flex-shrink-0">{formatDate(notif.createdAt)}</span>
                          </div>
                          <p className="text-sm text-gray-600 mt-1 leading-relaxed">{notif.message}</p>
                          {!notif.isRead && (
                            <span className="inline-block mt-2 text-xs text-blue-600 font-semibold">Click to mark as read</span>
                          )}
                        </div>
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

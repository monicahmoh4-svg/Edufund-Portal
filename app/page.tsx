'use client'
// app/page.tsx — Landing Page

import React from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { motion } from 'framer-motion'
import {
  GraduationCap, BookOpen, Users, CheckCircle, ArrowRight,
  Star, Shield, Clock, Award, ChevronRight, Zap, TrendingUp,
  FileText, CreditCard, Bell
} from 'lucide-react'

const TESTIMONIALS = [
  {
    name: 'Grace Wanjiru Kamau',
    role: 'Engineering Student, University of Nairobi',
    county: 'Kiambu County',
    text: 'EduFund Portal helped me secure my bursary funding in just 2 weeks. The process was straightforward and the status tracking kept me informed throughout.',
    amount: 'KES 25,000',
    avatar: 'GW',
  },
  {
    name: 'Samuel Otieno Auma',
    role: 'Medicine Student, Moi University',
    county: 'Kisumu County',
    text: 'As an orphan, I was worried about funding my medical education. This platform connected me to the right bursary and the M-Pesa payment was seamless.',
    amount: 'KES 40,000',
    avatar: 'SO',
  },
  {
    name: 'Faith Chebet Yego',
    role: 'Nursing Student, KMTC Eldoret',
    county: 'Uasin Gishu County',
    text: 'I love how transparent everything is. I could track my application from submission to approval. Received my disbursement notification via email.',
    amount: 'KES 18,000',
    avatar: 'FC',
  },
]

const PARTNERS = [
  'University of Nairobi', 'Kenyatta University', 'Moi University',
  'JKUAT', 'Strathmore University', 'Kenya Medical Training College',
  'Technical University of Kenya', 'Egerton University',
]

const HOW_IT_WORKS = [
  { step: '01', icon: FileText,    title: 'Complete Application',  desc: 'Fill out our guided 5-step form with your personal, academic, and financial details.' },
  { step: '02', icon: CreditCard,  title: 'Pay Application Fee',   desc: 'Securely pay the KES 500 application fee via M-Pesa STK Push — quick and safe.' },
  { step: '03', icon: Users,       title: 'Expert Review',         desc: 'Our team reviews your application and supporting documents thoroughly.' },
  { step: '04', icon: Award,       title: 'Receive Funding',       desc: 'Approved applicants receive funding directly to their institution or account.' },
]

const STATS = [
  { value: '12,400+', label: 'Students Funded' },
  { value: 'KES 180M+', label: 'Disbursed' },
  { value: '47', label: 'Counties Served' },
  { value: '98%', label: 'Satisfaction Rate' },
]

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.1, duration: 0.6, ease: 'easeOut' },
  }),
}

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white overflow-hidden">

      {/* ── Navigation ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <GraduationCap className="w-5 h-5 text-white" />
              </div>
              <span className="font-bold text-gray-900 text-lg tracking-tight">EduFund</span>
            </div>
            <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-600">
              <a href="#how-it-works"  className="hover:text-blue-600 transition-colors">How It Works</a>
              <a href="#institutions"  className="hover:text-blue-600 transition-colors">Institutions</a>
              <a href="#testimonials"  className="hover:text-blue-600 transition-colors">Stories</a>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/auth/login"
                className="text-sm font-medium text-gray-600 hover:text-blue-600 transition-colors">
                Sign In
              </Link>
              <Link href="/auth/register"
                className="px-4 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-all shadow-sm hover:shadow-md active:scale-95">
                Apply Now
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* ── Hero Section ── */}
      <section className="relative min-h-screen flex items-center pt-16">
        {/* Full-bleed HD background image */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1523050854058-8df90110c9f1?w=1920&q=90&auto=format&fit=crop"
            alt="Students studying and celebrating graduation — educational funding"
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          {/* Dark gradient overlay so text is readable */}
          <div className="absolute inset-0 bg-gradient-to-r from-blue-950/90 via-blue-900/75 to-blue-800/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-blue-950/60 via-transparent to-transparent" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full py-20">
          <div className="grid lg:grid-cols-2 gap-12 items-center">

            {/* Left — headline */}
            <motion.div initial="hidden" animate="visible" variants={fadeUp}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-white/10 border border-white/20 rounded-full text-white/80 text-xs font-medium mb-6 backdrop-blur-sm">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-pulse" />
                Applications Open for 2025 Academic Year
              </div>

              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white leading-tight">
                Funding Your
                <span className="block text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-emerald-300">
                  Educational Journey
                </span>
                Across Kenya
              </h1>

              <p className="mt-6 text-lg text-blue-100 leading-relaxed max-w-xl">
                Apply for bursaries, track your application status in real-time, and access
                educational funding opportunities from government and partner institutions.
              </p>

              <div className="mt-8 flex flex-col sm:flex-row gap-4">
                <Link href="/auth/register"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold text-base rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl active:scale-95 group">
                  Apply for Bursary
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </Link>
                <Link href="/auth/login"
                  className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/30 text-white font-semibold text-base rounded-xl hover:bg-white/20 transition-all backdrop-blur-sm">
                  Track Application
                </Link>
              </div>

              <div className="mt-10 flex flex-wrap gap-6">
                {[
                  { icon: Shield, text: 'Secure & Verified' },
                  { icon: Zap,    text: 'Fast Processing' },
                  { icon: Bell,   text: 'Real-time Updates' },
                ].map(({ icon: Icon, text }) => (
                  <div key={text} className="flex items-center gap-2 text-white/70 text-sm">
                    <Icon className="w-4 h-4 text-emerald-400" />
                    <span>{text}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Right — stats card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.7, delay: 0.2 }}
              className="hidden lg:block"
            >
              <div className="bg-black/30 backdrop-blur-md rounded-2xl p-6 border border-white/10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
                    <TrendingUp className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <p className="text-white font-semibold">Funding Overview</p>
                    <p className="text-white/50 text-xs">2025 Academic Year</p>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4 mb-6">
                  {STATS.map((stat) => (
                    <div key={stat.label} className="bg-white/10 rounded-xl p-4 border border-white/10">
                      <p className="text-2xl font-bold text-white">{stat.value}</p>
                      <p className="text-white/60 text-xs mt-1">{stat.label}</p>
                    </div>
                  ))}
                </div>
                <div className="space-y-3">
                  {[
                    { name: 'G. Kamau', inst: 'UoN - Engineering',  status: 'Approved',     color: 'bg-emerald-500' },
                    { name: 'S. Otieno', inst: 'Moi - Medicine',    status: 'Disbursed',    color: 'bg-purple-500' },
                    { name: 'F. Chebet', inst: 'KMTC - Nursing',    status: 'Under Review', color: 'bg-amber-500'  },
                  ].map((app) => (
                    <div key={app.name} className="flex items-center justify-between bg-white/5 rounded-lg p-3">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-600/50 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {app.name[0]}
                        </div>
                        <div>
                          <p className="text-white text-sm font-medium">{app.name}</p>
                          <p className="text-white/50 text-xs">{app.inst}</p>
                        </div>
                      </div>
                      <span className={`${app.color} text-white text-xs px-2 py-1 rounded-full font-medium`}>
                        {app.status}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Stats Bar ── */}
      <section className="bg-blue-600 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <motion.div key={stat.label} custom={i} initial="hidden" whileInView="visible"
                viewport={{ once: true }} variants={fadeUp} className="text-center">
                <p className="text-3xl font-bold text-white">{stat.value}</p>
                <p className="text-blue-200 text-sm mt-1">{stat.label}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── How It Works ── */}
      <section id="how-it-works" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} className="text-center mb-16">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Simple Process</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2">Get Funded in 4 Easy Steps</h2>
            <p className="text-gray-500 mt-4 max-w-xl mx-auto">
              Our streamlined application process ensures you spend less time on paperwork and more time on your education.
            </p>
          </motion.div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {HOW_IT_WORKS.map((item, i) => (
              <motion.div key={item.step} custom={i} initial="hidden" whileInView="visible"
                viewport={{ once: true }} variants={fadeUp}
                className="relative bg-white rounded-2xl p-6 shadow-sm border border-gray-100 hover:shadow-md hover:-translate-y-1 transition-all duration-300 group">
                <div className="flex items-start justify-between mb-4">
                  <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center group-hover:bg-blue-600 transition-colors">
                    <item.icon className="w-6 h-6 text-blue-600 group-hover:text-white transition-colors" />
                  </div>
                  <span className="text-5xl font-black text-gray-100 leading-none">{item.step}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{item.title}</h3>
                <p className="text-gray-500 text-sm leading-relaxed">{item.desc}</p>
                {i < HOW_IT_WORKS.length - 1 && (
                  <ChevronRight className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-300 hidden lg:block" />
                )}
              </motion.div>
            ))}
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} className="text-center mt-12">
            <Link href="/auth/register"
              className="inline-flex items-center gap-2 px-8 py-4 bg-blue-600 text-white font-bold rounded-xl hover:bg-blue-700 transition-all shadow-md hover:shadow-lg active:scale-95 group">
              Start Your Application
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* ── Image + Features split section ── */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">

            {/* Image */}
            <motion.div initial={{ opacity: 0, x: -40 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7 }}
              className="relative">
              <div className="relative h-[480px] rounded-3xl overflow-hidden shadow-2xl">
                <Image
                  src="https://images.unsplash.com/photo-1517486808906-6ca8b3f04846?w=900&q=85&auto=format&fit=crop"
                  alt="University students collaborating on academic work"
                  fill
                  className="object-cover object-center"
                  sizes="(max-width: 1024px) 100vw, 50vw"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-blue-900/50 to-transparent" />
                {/* Floating badge */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-xl">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center flex-shrink-0">
                      <CheckCircle className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-bold text-gray-900 text-sm">Application Approved!</p>
                      <p className="text-gray-500 text-xs">KES 25,000 disbursement initiated for Grace K.</p>
                    </div>
                  </div>
                </div>
              </div>
              {/* Decorative element */}
              <div className="absolute -top-4 -right-4 w-24 h-24 bg-blue-100 rounded-full -z-10" />
              <div className="absolute -bottom-4 -left-4 w-16 h-16 bg-emerald-100 rounded-full -z-10" />
            </motion.div>

            {/* Features */}
            <motion.div initial={{ opacity: 0, x: 40 }} whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }} transition={{ duration: 0.7 }}>
              <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Platform Features</span>
              <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mt-2 mb-8">
                Everything You Need to
                <span className="text-blue-600"> Secure Funding</span>
              </h2>
              <div className="space-y-6">
                {[
                  { icon: FileText,  title: 'Multi-Step Application',   desc: 'Our guided 5-step form ensures you provide all necessary information for a successful application.' },
                  { icon: CreditCard, title: 'M-Pesa Payment',          desc: 'Pay the application fee securely via Lipa Na M-Pesa. No bank visits required.' },
                  { icon: Clock,     title: 'Real-Time Tracking',       desc: 'Monitor your application status with a visual timeline from submission to disbursement.' },
                  { icon: Bell,      title: 'Instant Notifications',    desc: 'Receive email and in-app notifications for every status change on your application.' },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="flex gap-4">
                    <div className="flex-shrink-0 w-10 h-10 bg-blue-50 rounded-lg flex items-center justify-center mt-1">
                      <Icon className="w-5 h-5 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{title}</h3>
                      <p className="text-gray-500 text-sm mt-1 leading-relaxed">{desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ── Partner Institutions ── */}
      <section id="institutions" className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} className="text-center mb-10">
            <span className="text-blue-600 font-semibold text-sm uppercase tracking-wider">Recognized Institutions</span>
            <h2 className="text-3xl font-bold text-gray-900 mt-2">Serving Students Across Kenya</h2>
          </motion.div>
          <div className="flex flex-wrap justify-center gap-3">
            {PARTNERS.map((partner) => (
              <span key={partner}
                className="px-5 py-2.5 bg-white border border-gray-200 rounded-xl text-gray-700 font-medium text-sm hover:border-blue-300 hover:bg-blue-50 transition-colors">
                {partner}
              </span>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section id="testimonials" className="py-20 relative overflow-hidden">
        {/* Background image with overlay */}
        <div className="absolute inset-0 z-0">
          <Image
            src="https://images.unsplash.com/photo-1541339907198-e08756dedf3f?w=1920&q=80&auto=format&fit=crop"
            alt="University graduation ceremony"
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-blue-950/88" />
        </div>
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }}
            variants={fadeUp} className="text-center mb-16">
            <span className="text-blue-300 font-semibold text-sm uppercase tracking-wider">Student Stories</span>
            <h2 className="text-3xl sm:text-4xl font-bold text-white mt-2">Lives Changed Through Education</h2>
          </motion.div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t, i) => (
              <motion.div key={t.name} custom={i} initial="hidden" whileInView="visible"
                viewport={{ once: true }} variants={fadeUp}
                className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/10 hover:border-white/20 transition-all">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 fill-amber-400 text-amber-400" />
                  ))}
                </div>
                <p className="text-white/80 text-sm leading-relaxed mb-6">&ldquo;{t.text}&rdquo;</p>
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-blue-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="text-white font-semibold text-sm">{t.name}</p>
                    <p className="text-white/50 text-xs">{t.role}</p>
                    <p className="text-emerald-400 text-xs font-semibold mt-0.5">Received {t.amount}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ── */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}>
            <BookOpen className="w-12 h-12 text-blue-200 mx-auto mb-6" />
            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-4">
              Ready to Fund Your Education?
            </h2>
            <p className="text-blue-100 text-lg mb-8 max-w-xl mx-auto">
              Join thousands of Kenyan students who have secured educational funding through EduFund Portal.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/auth/register"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white text-blue-700 font-bold text-base rounded-xl hover:bg-blue-50 transition-all shadow-md hover:shadow-lg active:scale-95 group">
                Apply Now — Free Registration
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link href="/auth/login"
                className="inline-flex items-center justify-center gap-2 px-8 py-4 bg-white/10 border border-white/30 text-white font-semibold text-base rounded-xl hover:bg-white/20 transition-all">
                Track Existing Application
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="bg-gray-950 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-7 h-7 bg-blue-600 rounded-lg flex items-center justify-center">
                  <GraduationCap className="w-4 h-4 text-white" />
                </div>
                <span className="font-bold text-white">EduFund Portal</span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed">
                Empowering Kenyan students through accessible educational funding.
              </p>
            </div>
            {[
              { title: 'Platform', links: ['Apply for Bursary', 'Track Application', 'Institutions', 'Active Bursaries'] },
              { title: 'Support',  links: ['Help Center', 'Contact Us', 'FAQs'] },
              { title: 'Legal',    links: ['Privacy Policy', 'Terms of Service', 'Data Protection'] },
            ].map(({ title, links }) => (
              <div key={title}>
                <p className="font-semibold text-white text-sm mb-3">{title}</p>
                <ul className="space-y-2">
                  {links.map((link) => (
                    <li key={link}>
                      <a href="#" className="text-gray-500 text-sm hover:text-gray-300 transition-colors">{link}</a>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-600 text-sm">
              © {new Date().getFullYear()} EduFund Portal. All rights reserved.
            </p>
            <p className="text-gray-600 text-sm">
              Made with ❤️ for Kenyan Students · M-Pesa powered by Lipana
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

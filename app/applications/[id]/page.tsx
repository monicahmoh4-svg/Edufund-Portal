'use client'
// app/applications/[id]/page.tsx

import React, { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { motion } from 'framer-motion'
import {
  ArrowLeft, Download, CheckCircle, Clock, RefreshCw,
  Building2, User, DollarSign, FileText, AlertCircle,
} from 'lucide-react'
import { useApi } from '@/hooks/useAuth'
import {
  formatCurrency, formatDate, formatDateTime,
  getStatusLabel, getStatusColor, STATUS_STEPS,
} from '@/lib/utils'

interface Application {
  id: string
  referenceNo: string
  status: string
  fullName: string
  email: string
  phone: string
  county: string
  idNumber: string
  dateOfBirth: string
  gender: string
  institutionName: string
  institutionType: string
  course: string
  yearOfStudy: number
  admissionNumber: string
  feesRequired: number
  amountRequested: number
  otherFunding: number
  personalStatement: string
  guardianName: string
  guardianOccupation: string
  householdIncome: number
  dependents: number
  isOrphan: boolean
  hasDisability: boolean
  createdAt: string
  updatedAt: string
  adminComment?: string
  payment?: {
    status: string
    mpesaReceiptNo?: string
    amount: number
    createdAt: string
  }
  documents?: Array<{
    id: string
    documentType: string
    fileName: string
    filePath: string
  }>
  statusLogs?: Array<{
    status: string
    createdAt: string
    comment?: string
  }>
}

export default function ApplicationDetailPage() {
  const params = useParams()
  // useParams() returns string | string[] — normalise to string
  const id = Array.isArray(params.id) ? params.id[0] : params.id
  const api = useApi()
  const [application, setApplication] = useState<Application | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!id) return
    async function load() {
      setLoading(true)
      const res = await api.get(`/api/applications/${id}`)
      if (res.success) setApplication(res.data.application)
      setLoading(false)
    }
    load()
  }, [id])

  const downloadPDF = async () => {
    if (!application) return
    try {
      const { jsPDF } = await import('jspdf')
      const doc = new jsPDF()

      doc.setFontSize(20)
      doc.setTextColor(19, 66, 225)
      doc.text('EduFund Portal', 20, 20)

      doc.setFontSize(14)
      doc.setTextColor(50, 50, 50)
      doc.text('Bursary Application Summary', 20, 30)

      doc.setFontSize(10)
      doc.setTextColor(100)
      doc.text(`Reference: ${application.referenceNo}`, 20, 42)
      doc.text(`Status: ${getStatusLabel(application.status)}`, 20, 50)
      doc.text(`Date: ${formatDate(application.createdAt)}`, 20, 58)

      doc.setLineWidth(0.5)
      doc.setDrawColor(230)
      doc.line(20, 65, 190, 65)

      const sections: Array<[string, Array<[string, string]>]> = [
        [
          'Personal Details',
          [
            ['Full Name', application.fullName],
            ['ID Number', application.idNumber],
            ['Email', application.email],
            ['Phone', application.phone],
            ['County', application.county],
            ['Gender', application.gender],
          ],
        ],
        [
          'Institution Details',
          [
            ['Institution', application.institutionName],
            ['Type', application.institutionType],
            ['Course', application.course],
            ['Year', `Year ${application.yearOfStudy}`],
            ['Admission No.', application.admissionNumber],
          ],
        ],
        [
          'Financial Details',
          [
            ['Fees Required', formatCurrency(application.feesRequired)],
            ['Amount Requested', formatCurrency(application.amountRequested)],
            ['Other Funding', formatCurrency(application.otherFunding)],
          ],
        ],
      ]

      let y = 72
      sections.forEach(([title, fields]) => {
        doc.setFontSize(12)
        doc.setTextColor(19, 66, 225)
        doc.text(title, 20, y)
        y += 7
        doc.setFontSize(10)
        doc.setTextColor(50)
        fields.forEach(([label, value]) => {
          doc.text(`${label}:`, 25, y)
          doc.setTextColor(80)
          doc.text(value || '—', 80, y)
          doc.setTextColor(50)
          y += 7
        })
        y += 5
      })

      if (application.adminComment) {
        doc.setFontSize(12)
        doc.setTextColor(19, 66, 225)
        doc.text('Admin Comment', 20, y)
        y += 7
        doc.setFontSize(10)
        doc.setTextColor(80)
        const lines = doc.splitTextToSize(application.adminComment, 160)
        doc.text(lines, 25, y)
      }

      doc.save(`EduFund-${application.referenceNo}.pdf`)
    } catch (err) {
      console.error('PDF error:', err)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-24">
        <RefreshCw className="w-8 h-8 text-brand-400 animate-spin" />
      </div>
    )
  }

  if (!application) {
    return (
      <div className="text-center py-20">
        <AlertCircle className="w-12 h-12 text-red-300 mx-auto mb-3" />
        <p className="text-gray-600 font-medium">Application not found</p>
        <Link
          href="/dashboard"
          className="text-brand-600 text-sm hover:underline mt-2 inline-block"
        >
          Back to dashboard
        </Link>
      </div>
    )
  }

  const statusIndex = STATUS_STEPS.indexOf(application.status)

  return (
    <div className="max-w-3xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Link>
          <div>
            <h1 className="text-xl font-bold text-gray-900">Application Details</h1>
            <p className="text-xs text-gray-400 font-mono mt-0.5">{application.referenceNo}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span
            className={`text-xs font-semibold px-3 py-1.5 rounded-full border ${getStatusColor(application.status)}`}
          >
            {getStatusLabel(application.status)}
          </span>
          <button
            onClick={downloadPDF}
            className="flex items-center gap-2 px-4 py-2 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-all"
          >
            <Download className="w-4 h-4" />
            Download PDF
          </button>
        </div>
      </div>

      {/* Progress timeline */}
      {!['DRAFT', 'REJECTED'].includes(application.status) && (
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
          <h2 className="font-bold text-gray-900 text-sm mb-5">Application Progress</h2>
          <div className="flex items-center justify-between relative">
            <div className="absolute top-4 left-0 right-0 h-0.5 bg-gray-100">
              <motion.div
                className="h-full bg-brand-500"
                initial={{ width: 0 }}
                animate={{
                  width: `${Math.max(0, (statusIndex / (STATUS_STEPS.length - 1)) * 100)}%`,
                }}
                transition={{ duration: 1, delay: 0.3 }}
              />
            </div>
            {STATUS_STEPS.map((step, i) => (
              <div key={step} className="relative flex flex-col items-center z-10">
                <div
                  className={`w-9 h-9 rounded-full border-2 flex items-center justify-center transition-all ${
                    i < statusIndex
                      ? 'bg-brand-600 border-brand-600'
                      : i === statusIndex
                      ? 'bg-white border-brand-600 ring-4 ring-brand-100'
                      : 'bg-white border-gray-200'
                  }`}
                >
                  {i < statusIndex ? (
                    <CheckCircle className="w-5 h-5 text-white" />
                  ) : i === statusIndex ? (
                    <Clock className="w-4 h-4 text-brand-600" />
                  ) : (
                    <div className="w-2 h-2 bg-gray-300 rounded-full" />
                  )}
                </div>
                <span
                  className={`mt-2 text-xs font-semibold whitespace-nowrap hidden sm:block ${
                    i <= statusIndex ? 'text-brand-700' : 'text-gray-400'
                  }`}
                >
                  {getStatusLabel(step)}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Admin comment */}
      {application.adminComment && (
        <div
          className={`rounded-2xl border p-5 ${
            application.status === 'APPROVED'
              ? 'bg-emerald-50 border-emerald-200'
              : application.status === 'REJECTED'
              ? 'bg-red-50 border-red-200'
              : 'bg-blue-50 border-blue-200'
          }`}
        >
          <p
            className={`text-sm font-bold mb-1 ${
              application.status === 'APPROVED'
                ? 'text-emerald-800'
                : application.status === 'REJECTED'
                ? 'text-red-800'
                : 'text-blue-800'
            }`}
          >
            Feedback from Review Team
          </p>
          <p
            className={`text-sm ${
              application.status === 'APPROVED'
                ? 'text-emerald-700'
                : application.status === 'REJECTED'
                ? 'text-red-700'
                : 'text-blue-700'
            }`}
          >
            {application.adminComment}
          </p>
        </div>
      )}

      {/* Details grid */}
      <div className="grid gap-5">
        <SectionCard title="Personal Details" icon={User}>
          <FieldGrid
            fields={[
              { label: 'Full Name', value: application.fullName },
              { label: 'ID Number', value: application.idNumber },
              { label: 'Date of Birth', value: formatDate(application.dateOfBirth) },
              { label: 'Gender', value: application.gender },
              { label: 'Phone', value: application.phone },
              { label: 'Email', value: application.email },
              { label: 'County', value: application.county },
              { label: 'Orphan', value: application.isOrphan ? 'Yes' : 'No' },
              { label: 'Disability', value: application.hasDisability ? 'Yes' : 'No' },
            ]}
          />
        </SectionCard>

        <SectionCard title="Institution Details" icon={Building2}>
          <FieldGrid
            fields={[
              { label: 'Institution', value: application.institutionName },
              { label: 'Type', value: application.institutionType.replace('_', ' ') },
              { label: 'Course', value: application.course },
              { label: 'Year of Study', value: `Year ${application.yearOfStudy}` },
              { label: 'Admission No.', value: application.admissionNumber },
            ]}
          />
        </SectionCard>

        <SectionCard title="Financial Details" icon={DollarSign}>
          <FieldGrid
            fields={[
              { label: 'Fees Required', value: formatCurrency(application.feesRequired) },
              { label: 'Amount Requested', value: formatCurrency(application.amountRequested) },
              { label: 'Other Funding', value: formatCurrency(application.otherFunding || 0) },
              { label: 'Guardian', value: application.guardianName },
              { label: 'Guardian Occupation', value: application.guardianOccupation },
              {
                label: 'Household Income',
                value: `${formatCurrency(application.householdIncome)}/month`,
              },
              { label: 'Dependents', value: String(application.dependents) },
            ]}
          />
        </SectionCard>

        <SectionCard title="Personal Statement" icon={FileText}>
          <p className="text-sm text-gray-700 leading-relaxed">{application.personalStatement}</p>
        </SectionCard>

        {application.payment && (
          <SectionCard title="Payment" icon={CheckCircle}>
            <FieldGrid
              fields={[
                { label: 'Status', value: application.payment.status },
                { label: 'Amount', value: formatCurrency(application.payment.amount) },
                {
                  label: 'M-Pesa Receipt',
                  value: application.payment.mpesaReceiptNo || '—',
                },
                { label: 'Date', value: formatDateTime(application.payment.createdAt) },
              ]}
            />
          </SectionCard>
        )}

        {application.statusLogs && application.statusLogs.length > 0 && (
          <SectionCard title="Status History" icon={Clock}>
            <div className="space-y-3">
              {application.statusLogs.map((log, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div
                    className={`w-2 h-2 rounded-full mt-2 flex-shrink-0 ${
                      log.status === 'APPROVED' || log.status === 'DISBURSED'
                        ? 'bg-emerald-500'
                        : log.status === 'REJECTED'
                        ? 'bg-red-500'
                        : 'bg-brand-500'
                    }`}
                  />
                  <div>
                    <p className="text-sm font-semibold text-gray-900">
                      {getStatusLabel(log.status)}
                    </p>
                    <p className="text-xs text-gray-400">{formatDateTime(log.createdAt)}</p>
                    {log.comment && (
                      <p className="text-xs text-gray-600 mt-0.5">{log.comment}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </SectionCard>
        )}
      </div>
    </div>
  )
}

function SectionCard({
  title,
  icon: Icon,
  children,
}: {
  title: string
  icon: React.ElementType
  children: React.ReactNode
}) {
  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
      <div className="px-5 py-4 border-b border-gray-50 flex items-center gap-2">
        <Icon className="w-4 h-4 text-brand-600" />
        <h2 className="font-bold text-gray-900 text-sm">{title}</h2>
      </div>
      <div className="p-5">{children}</div>
    </div>
  )
}

function FieldGrid({ fields }: { fields: Array<{ label: string; value: string }> }) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
      {fields.map(({ label, value }) => (
        <div key={label} className="bg-gray-50 rounded-xl p-3">
          <p className="text-xs text-gray-400 font-medium">{label}</p>
          <p className="text-sm font-semibold text-gray-800 mt-0.5">{value}</p>
        </div>
      ))}
    </div>
  )
}

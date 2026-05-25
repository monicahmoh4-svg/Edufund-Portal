'use client'
// app/applications/new/page.tsx — Multi-Step Application Form

import React, { useState, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { motion, AnimatePresence } from 'framer-motion'
import toast from 'react-hot-toast'
import {
  ChevronRight, ChevronLeft, Check, Loader2, Upload,
  User, Users, Building2, DollarSign, FileUp, CreditCard
} from 'lucide-react'
import { useAuth, useApi } from '@/hooks/useAuth'
import {
  personalDetailsSchema, familyBackgroundSchema,
  institutionDetailsSchema, financialNeedSchema,
  PersonalDetailsInput, FamilyBackgroundInput,
  InstitutionDetailsInput, FinancialNeedInput,
  KENYAN_COUNTIES,
} from '@/lib/validations'
import { cn, APPLICATION_STEPS } from '@/lib/utils'
import MPesaPayment from '@/components/forms/MPesaPayment'

type FormData = PersonalDetailsInput & FamilyBackgroundInput & InstitutionDetailsInput & FinancialNeedInput

const STEP_ICONS = [User, Users, Building2, DollarSign, FileUp, CreditCard]

export default function NewApplicationPage() {
  const router = useRouter()
  const { user, token } = useAuth()
  const api = useApi()
  const [currentStep, setCurrentStep] = useState(1)
  const [applicationId, setApplicationId] = useState<string | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File>>({})
  const [allData, setAllData] = useState<Partial<FormData>>({})
  const [statementLen, setStatementLen] = useState(0)
  const [disabilityChecked, setDisabilityChecked] = useState(false)
  const [orphanChecked, setOrphanChecked] = useState(false)

  const step1Form = useForm<PersonalDetailsInput>({ resolver: zodResolver(personalDetailsSchema) })
  const step2Form = useForm<FamilyBackgroundInput>({ resolver: zodResolver(familyBackgroundSchema) })
  const step3Form = useForm<InstitutionDetailsInput>({ resolver: zodResolver(institutionDetailsSchema) })
  const step4Form = useForm<FinancialNeedInput>({ resolver: zodResolver(financialNeedSchema) })

  const getForms = () => [step1Form, step2Form, step3Form, step4Form]

  const handleNext = async () => {
    const forms = getForms()
    if (currentStep <= 4) {
      const form = forms[currentStep - 1]
      const valid = await form.trigger()
      if (!valid) return
      setAllData((prev) => ({ ...prev, ...form.getValues() }))
    }
    setCurrentStep((prev) => prev + 1)
  }

  const handleBack = () => setCurrentStep((prev) => prev - 1)

  const handleCreateApplication = async () => {
    setIsSubmitting(true)
    try {
      const mergedData = {
        ...allData,
        householdIncome: Number(allData.householdIncome),
        dependents: Number(allData.dependents),
        yearOfStudy: Number(allData.yearOfStudy),
        totalFees: allData.totalFees ? Number(allData.totalFees) : undefined,
        feesRequired: Number(allData.feesRequired),
        amountRequested: Number(allData.amountRequested),
        otherFunding: Number(allData.otherFunding || 0),
      }
      const res = await api.post('/api/applications', mergedData)
      if (!res.success) { toast.error(res.error || 'Failed to create application'); return }

      const newAppId: string = res.data.application.id
      setApplicationId(newAppId)

      const authToken = token || ''
      for (const [docType, file] of Object.entries(uploadedFiles)) {
        const fd = new FormData()
        fd.append('file', file)
        fd.append('applicationId', newAppId)
        fd.append('documentType', docType)
        await fetch('/api/documents', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
          body: fd,
        })
      }
      setCurrentStep(6)
    } catch { toast.error('Network error. Please try again.') }
    finally { setIsSubmitting(false) }
  }

  const handleFileChange = useCallback((docType: string, file: File | null) => {
    if (file) setUploadedFiles((prev) => ({ ...prev, [docType]: file }))
  }, [])

  const onPaymentSuccess = () => {
    toast.success('Payment successful! Application submitted.')
    router.push('/dashboard')
  }

  const ic = (err?: boolean) => cn(
    'w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-all',
    err ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
  )
  const sc = (err?: boolean) => cn(ic(err), 'appearance-none')

  const F = ({ label, error, required, children, hint }: {
    label: string; error?: string; required?: boolean; children: React.ReactNode; hint?: string
  }) => (
    <div>
      <label className="block text-sm font-semibold text-gray-700 mb-1.5">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-gray-400 mt-1">{hint}</p>}
      {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Bursary Application</h1>
        <p className="text-gray-500 text-sm mt-1">Complete all steps to submit your application</p>
      </div>

      {/* Progress Steps */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4">
        <div className="flex items-center overflow-x-auto gap-1">
          {APPLICATION_STEPS.map((step, i) => {
            const Icon = STEP_ICONS[i]
            const sn = i + 1
            const done = currentStep > sn
            const cur = currentStep === sn
            return (
              <React.Fragment key={step.id}>
                <div className={cn('flex items-center gap-2 px-3 py-2 rounded-xl flex-shrink-0', cur ? 'bg-brand-50 border border-brand-200' : '')}>
                  <div className={cn('w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0',
                    done ? 'bg-emerald-500 text-white' : cur ? 'bg-brand-600 text-white' : 'bg-gray-100 text-gray-400')}>
                    {done ? <Check className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                  </div>
                  <p className={cn('text-xs font-semibold leading-tight hidden sm:block',
                    cur ? 'text-brand-700' : done ? 'text-emerald-700' : 'text-gray-400')}>
                    {step.label}
                  </p>
                </div>
                {i < APPLICATION_STEPS.length - 1 && (
                  <div className={cn('h-0.5 flex-1 min-w-[12px] rounded', done ? 'bg-emerald-300' : 'bg-gray-100')} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </div>

      {/* Form Card */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        <AnimatePresence mode="wait">
          <motion.div key={currentStep}
            initial={{ x: 40, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -40, opacity: 0 }}
            transition={{ duration: 0.25 }} className="p-6 lg:p-8">

            {/* STEP 1 */}
            {currentStep === 1 && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><User className="w-5 h-5 text-brand-600" /> Personal Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Your basic personal information</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <F label="Full Name" error={step1Form.formState.errors.fullName?.message} required>
                    <input {...step1Form.register('fullName')} placeholder="As per ID/Certificate" className={ic(!!step1Form.formState.errors.fullName)} />
                  </F>
                  <F label="National ID / Birth Certificate No." error={step1Form.formState.errors.idNumber?.message} required>
                    <input {...step1Form.register('idNumber')} placeholder="Enter ID number" className={ic(!!step1Form.formState.errors.idNumber)} />
                  </F>
                  <F label="Date of Birth" error={step1Form.formState.errors.dateOfBirth?.message} required>
                    <input {...step1Form.register('dateOfBirth')} type="date" className={ic(!!step1Form.formState.errors.dateOfBirth)} />
                  </F>
                  <F label="Gender" error={step1Form.formState.errors.gender?.message} required>
                    <select {...step1Form.register('gender')} className={sc(!!step1Form.formState.errors.gender)}>
                      <option value="">Select gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                      <option value="OTHER">Other</option>
                      <option value="PREFER_NOT_TO_SAY">Prefer not to say</option>
                    </select>
                  </F>
                  <F label="Phone Number" error={step1Form.formState.errors.phone?.message} required hint="e.g. 0712345678">
                    <input {...step1Form.register('phone')} placeholder="0712 345 678" className={ic(!!step1Form.formState.errors.phone)} />
                  </F>
                  <F label="Email Address" error={step1Form.formState.errors.email?.message} required>
                    <input {...step1Form.register('email')} type="email" defaultValue={user?.email} placeholder="your@email.com" className={ic(!!step1Form.formState.errors.email)} />
                  </F>
                  <F label="County" error={step1Form.formState.errors.county?.message} required>
                    <select {...step1Form.register('county')} className={sc(!!step1Form.formState.errors.county)}>
                      <option value="">Select county</option>
                      {KENYAN_COUNTIES.map((c) => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </F>
                  <F label="Constituency">
                    <input {...step1Form.register('constituency')} placeholder="Enter constituency (optional)" className={ic()} />
                  </F>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="hasDisability" checked={disabilityChecked}
                      onChange={(e) => { setDisabilityChecked(e.target.checked); step1Form.setValue('hasDisability', e.target.checked) }}
                      className="rounded border-gray-300 text-brand-600" />
                    <label htmlFor="hasDisability" className="text-sm font-medium text-gray-700">I have a disability or special needs</label>
                  </div>
                  {disabilityChecked && (
                    <textarea {...step1Form.register('disabilityNotes')} placeholder="Briefly describe your disability or special needs"
                      rows={2} className="mt-3 w-full px-4 py-3 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 resize-none" />
                  )}
                </div>
              </div>
            )}

            {/* STEP 2 */}
            {currentStep === 2 && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Users className="w-5 h-5 text-brand-600" /> Family Background</h2>
                  <p className="text-sm text-gray-500 mt-1">Information about your household and guardian</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <F label="Parent/Guardian Name" error={step2Form.formState.errors.guardianName?.message} required>
                    <input {...step2Form.register('guardianName')} placeholder="Full name of guardian" className={ic(!!step2Form.formState.errors.guardianName)} />
                  </F>
                  <F label="Guardian's Occupation" error={step2Form.formState.errors.guardianOccupation?.message} required>
                    <input {...step2Form.register('guardianOccupation')} placeholder="e.g. Farmer, Teacher" className={ic(!!step2Form.formState.errors.guardianOccupation)} />
                  </F>
                  <F label="Estimated Monthly Household Income (KES)" error={step2Form.formState.errors.householdIncome?.message} required hint="Combined monthly income from all sources">
                    <input {...step2Form.register('householdIncome', { valueAsNumber: true })} type="number" placeholder="e.g. 20000" className={ic(!!step2Form.formState.errors.householdIncome)} />
                  </F>
                  <F label="Number of Dependents" error={step2Form.formState.errors.dependents?.message} required hint="People supported by household income">
                    <input {...step2Form.register('dependents', { valueAsNumber: true })} type="number" min="0" placeholder="e.g. 5" className={ic(!!step2Form.formState.errors.dependents)} />
                  </F>
                </div>
                <div className="p-4 bg-gray-50 rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <input type="checkbox" id="isOrphan" checked={orphanChecked}
                      onChange={(e) => { setOrphanChecked(e.target.checked); step2Form.setValue('isOrphan', e.target.checked) }}
                      className="rounded border-gray-300 text-brand-600" />
                    <label htmlFor="isOrphan" className="text-sm font-medium text-gray-700">I am an orphan or from a child-headed household</label>
                  </div>
                  {orphanChecked && (
                    <F label="Orphan Status Details" error={step2Form.formState.errors.orphanStatus?.message}>
                      <input {...step2Form.register('orphanStatus')} placeholder="e.g. Both parents deceased" className={ic()} />
                    </F>
                  )}
                </div>
              </div>
            )}

            {/* STEP 3 */}
            {currentStep === 3 && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><Building2 className="w-5 h-5 text-brand-600" /> Institution Details</h2>
                  <p className="text-sm text-gray-500 mt-1">Your school and course information</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <F label="Institution Type" error={step3Form.formState.errors.institutionType?.message} required>
                    <select {...step3Form.register('institutionType')} className={sc(!!step3Form.formState.errors.institutionType)}>
                      <option value="">Select type</option>
                      <option value="UNIVERSITY">University</option>
                      <option value="COLLEGE">College</option>
                      <option value="HIGH_SCHOOL">High School</option>
                      <option value="TVET">TVET</option>
                      <option value="PRIMARY_SCHOOL">Primary School</option>
                    </select>
                  </F>
                  <F label="Institution Name" error={step3Form.formState.errors.institutionName?.message} required>
                    <input {...step3Form.register('institutionName')} placeholder="e.g. University of Nairobi" className={ic(!!step3Form.formState.errors.institutionName)} />
                  </F>
                  <F label="Admission / Registration Number" error={step3Form.formState.errors.admissionNumber?.message} required>
                    <input {...step3Form.register('admissionNumber')} placeholder="e.g. ADM/2023/001" className={ic(!!step3Form.formState.errors.admissionNumber)} />
                  </F>
                  <F label="Institution Code (optional)">
                    <input {...step3Form.register('institutionId')} placeholder="e.g. UON, KU" className={ic()} />
                  </F>
                  <F label="Course / Program" error={step3Form.formState.errors.course?.message} required>
                    <input {...step3Form.register('course')} placeholder="e.g. Bachelor of Engineering" className={ic(!!step3Form.formState.errors.course)} />
                  </F>
                  <F label="Year of Study" error={step3Form.formState.errors.yearOfStudy?.message} required>
                    <select {...step3Form.register('yearOfStudy', { valueAsNumber: true })} className={sc(!!step3Form.formState.errors.yearOfStudy)}>
                      <option value="">Select year</option>
                      {[1,2,3,4,5,6].map((y) => <option key={y} value={y}>Year {y}</option>)}
                    </select>
                  </F>
                  <F label="Total Annual Fees (KES)" hint="As per fee structure">
                    <input {...step3Form.register('totalFees', { valueAsNumber: true })} type="number" placeholder="e.g. 120000" className={ic()} />
                  </F>
                </div>
              </div>
            )}

            {/* STEP 4 */}
            {currentStep === 4 && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><DollarSign className="w-5 h-5 text-brand-600" /> Financial Need</h2>
                  <p className="text-sm text-gray-500 mt-1">Details of your financial requirements</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <F label="Total Fees Required (KES)" error={step4Form.formState.errors.feesRequired?.message} required hint="Total amount needed for current year">
                    <input {...step4Form.register('feesRequired', { valueAsNumber: true })} type="number" placeholder="e.g. 80000" className={ic(!!step4Form.formState.errors.feesRequired)} />
                  </F>
                  <F label="Amount You're Requesting (KES)" error={step4Form.formState.errors.amountRequested?.message} required>
                    <input {...step4Form.register('amountRequested', { valueAsNumber: true })} type="number" placeholder="e.g. 25000" className={ic(!!step4Form.formState.errors.amountRequested)} />
                  </F>
                  <F label="Other Funding Received (KES)" hint="Leave 0 if none">
                    <input {...step4Form.register('otherFunding', { valueAsNumber: true })} type="number" defaultValue={0} placeholder="0" className={ic()} />
                  </F>
                  <F label="Other Funding Source">
                    <input {...step4Form.register('otherFundingSource')} placeholder="e.g. HELB, Church, CDF" className={ic()} />
                  </F>
                </div>
                {/* Personal Statement — uses onChange + local state to prevent re-render lag */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Personal Statement <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    {...step4Form.register('personalStatement', {
                      onChange: (e) => setStatementLen(e.target.value.length),
                    })}
                    rows={6}
                    placeholder="Explain your financial circumstances, why you need this bursary, and what you plan to achieve with your education..."
                    className={cn(
                      'w-full px-4 py-3 border rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-none transition-all',
                      step4Form.formState.errors.personalStatement ? 'border-red-300 bg-red-50' : 'border-gray-200 bg-gray-50 focus:bg-white'
                    )}
                  />
                  <div className="flex items-center justify-between mt-1">
                    {step4Form.formState.errors.personalStatement
                      ? <p className="text-xs text-red-500">{step4Form.formState.errors.personalStatement.message}</p>
                      : <p className="text-xs text-gray-400">Minimum 100 characters required</p>
                    }
                    <p className={cn('text-xs font-medium', statementLen >= 100 ? 'text-emerald-600' : 'text-gray-400')}>
                      {statementLen} / 100
                    </p>
                  </div>
                </div>
              </div>
            )}

            {/* STEP 5 */}
            {currentStep === 5 && (
              <div className="space-y-5">
                <div className="pb-4 border-b border-gray-100">
                  <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2"><FileUp className="w-5 h-5 text-brand-600" /> Document Uploads</h2>
                  <p className="text-sm text-gray-500 mt-1">PDF, JPG, PNG — max 5 MB each</p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {[
                    { key: 'admission_letter', label: 'Admission Letter', required: true },
                    { key: 'fee_structure', label: 'Fee Structure', required: true },
                    { key: 'national_id', label: 'National ID / Birth Certificate', required: true },
                    { key: 'supporting', label: 'Supporting Documents', required: false },
                  ].map(({ key, label, required }) => (
                    <FileUploadCard key={key} label={label} required={required}
                      file={uploadedFiles[key]} onChange={(f) => handleFileChange(key, f)} />
                  ))}
                </div>
                <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-amber-800 text-sm font-semibold">Important Notes:</p>
                  <ul className="mt-2 space-y-1 text-amber-700 text-xs">
                    <li>• All documents must be clearly legible</li>
                    <li>• Accepted formats: PDF, JPEG, PNG (max 5 MB each)</li>
                    <li>• Click Save &amp; Continue after uploading</li>
                  </ul>
                </div>
              </div>
            )}

            {/* STEP 6 — Payment */}
            {currentStep === 6 && applicationId && (
              <MPesaPayment applicationId={applicationId} userPhone={user?.phone || ''} onSuccess={onPaymentSuccess} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation */}
        {currentStep < 6 && (
          <div className="px-6 lg:px-8 py-4 bg-gray-50 border-t border-gray-100 flex items-center justify-between">
            <button onClick={handleBack} disabled={currentStep === 1}
              className="flex items-center gap-2 px-5 py-2.5 border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-white transition-all disabled:opacity-40 disabled:cursor-not-allowed">
              <ChevronLeft className="w-4 h-4" /> Back
            </button>
            {currentStep === 5 ? (
              <button onClick={handleCreateApplication} disabled={isSubmitting}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-md active:scale-95 disabled:opacity-60">
                {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saving...</> : <>Save &amp; Continue to Payment<ChevronRight className="w-4 h-4" /></>}
              </button>
            ) : (
              <button onClick={handleNext}
                className="flex items-center gap-2 px-6 py-2.5 bg-brand-600 text-white rounded-xl text-sm font-bold hover:bg-brand-700 transition-all shadow-md active:scale-95">
                Next Step <ChevronRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function FileUploadCard({ label, required, file, onChange }: {
  label: string; required: boolean; file?: File; onChange: (f: File | null) => void
}) {
  const ref = useRef<HTMLInputElement>(null)
  return (
    <div onClick={() => ref.current?.click()}
      className={cn('border-2 border-dashed rounded-xl p-4 cursor-pointer transition-all hover:border-brand-400 hover:bg-brand-50/50',
        file ? 'border-emerald-400 bg-emerald-50' : 'border-gray-200 bg-gray-50')}>
      <input ref={ref} type="file" accept=".pdf,.jpg,.jpeg,.png" className="hidden"
        onChange={(e) => onChange(e.target.files?.[0] || null)} />
      <div className="flex items-start gap-3">
        <div className={cn('w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0', file ? 'bg-emerald-100' : 'bg-gray-100')}>
          {file ? <Check className="w-5 h-5 text-emerald-600" /> : <Upload className="w-5 h-5 text-gray-400" />}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-gray-800 truncate">
            {label} {required && <span className="text-red-500">*</span>}
          </p>
          {file
            ? <p className="text-xs text-emerald-600 truncate mt-0.5">{file.name}</p>
            : <p className="text-xs text-gray-400 mt-0.5">Click to upload — PDF, JPG, PNG</p>}
        </div>
      </div>
    </div>
  )
}

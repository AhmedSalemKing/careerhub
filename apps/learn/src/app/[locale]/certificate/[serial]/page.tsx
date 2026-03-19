'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslations, useLocale } from 'next-intl'
import { useParams } from 'next/navigation'
import {
  Download, Printer, Linkedin, CheckCircle, XCircle,
  Award, Calendar, User, FileText, Share2, ExternalLink
} from 'lucide-react'
import { get } from '../../../../lib/api'
import { Button } from '../../../components/ui/button'
import { Skeleton } from '../../../components/ui/skeleton'
import { useToast } from '../../../../lib/toast'

interface Certificate {
  id: string
  serialNumber: string
  studentName: string
  courseName: Record<string, string>
  instructorName: string
  completionDate: string
  issuedDate: string
  duration: string
  score?: number
  isValid: boolean
  verificationUrl: string
}

export default function CertificatePage() {
  const t = useTranslations()
  const locale = useLocale() as 'ar' | 'en'
  const isRTL = locale === 'ar'
  const params = useParams()
  const serial = params.serial as string
  const { toast } = useToast()

  const { data: certificateData, isLoading, error } = useQuery({
    queryKey: ['certificate', serial],
    queryFn: () => get<Certificate>(`/certificates/${serial}/verify`),
  })

  const certificate = certificateData?.data

  const handleDownload = async () => {
    if (!certificate) return

    try {
      const response = await fetch(`/api/certificates/${certificate.serialNumber}/download`)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `certificate-${certificate.serialNumber}.pdf`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      window.URL.revokeObjectURL(url)
      toast({ description: t('certificate.download_success'), variant: 'success' })
    } catch (error) {
      toast({ description: t('errors.download_failed'), variant: 'danger' })
    }
  }

  const handlePrint = () => {
    if (!certificate) return
    window.print()
  }

  const handleLinkedIn = () => {
    if (!certificate) return

    const linkedinUrl = `https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(certificate.courseName[locale] || certificate.courseName.en)}&organizationName=${encodeURIComponent('CareerHub Academy')}&issueYear=${new Date(certificate.issuedDate).getFullYear()}&issueMonth=${new Date(certificate.issuedDate).getMonth() + 1}&certUrl=${encodeURIComponent(certificate.verificationUrl)}&certId=${certificate.serialNumber}`

    window.open(linkedinUrl, '_blank')
  }

  const handleShare = async () => {
    if (!certificate) return

    if (navigator.share) {
      try {
        await navigator.share({
          title: t('certificate.share_title'),
          text: t('certificate.share_text', {
            courseName: certificate.courseName[locale] || certificate.courseName.en,
            studentName: certificate.studentName
          }),
          url: certificate.verificationUrl,
        })
      } catch (error) {
        // User cancelled or error occurred
      }
    } else {
      // Fallback: copy to clipboard
      try {
        await navigator.clipboard.writeText(certificate.verificationUrl)
        toast({ description: t('certificate.link_copied'), variant: 'success' })
      } catch (error) {
        toast({ description: t('errors.copy_failed'), variant: 'danger' })
      }
    }
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-2xl w-full mx-auto p-8">
          <Skeleton className="h-8 w-3/4 mx-auto mb-8" />
          <div className="border rounded-lg p-8 space-y-6">
            <Skeleton className="h-32 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-3/4" />
              <Skeleton className="h-4 w-1/2" />
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !certificate) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 text-center">
          <div className="mb-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-4">{t('certificate.invalid')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('certificate.invalid_description')}
          </p>
          <Button onClick={() => window.history.back()}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    )
  }

  if (!certificate.isValid) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="max-w-md w-full mx-auto p-8 text-center">
          <div className="mb-6">
            <XCircle className="h-16 w-16 text-red-500 mx-auto" />
          </div>
          <h1 className="text-2xl font-bold mb-4">{t('certificate.invalid')}</h1>
          <p className="text-muted-foreground mb-6">
            {t('certificate.revoked_description')}
          </p>
          <Button onClick={() => window.history.back()}>
            {t('common.back')}
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary/5 to-background py-12">
      <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8">
        {/* Certificate Container */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl overflow-hidden">
          {/* Certificate Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-white p-8 text-center">
            <div className="flex items-center justify-center mb-4">
              <Award className="h-12 w-12" />
            </div>
            <h1 className="text-3xl font-bold mb-2">
              {t('certificate.title')}
            </h1>
            <p className="text-lg opacity-90">
              {t('certificate.subtitle')}
            </p>
          </div>

          {/* Certificate Content */}
          <div className="p-8 md:p-12">
            <div className="text-center mb-8">
              <p className="text-lg text-muted-foreground mb-4">
                {t('certificate.this_certifies')}
              </p>
              <h2 className="text-3xl font-bold text-primary mb-8">
                {certificate.studentName}
              </h2>

              <p className="text-lg text-muted-foreground mb-6">
                {t('certificate.has_successfully_completed')}
              </p>

              <h3 className="text-2xl font-semibold mb-8">
                {certificate.courseName[locale] || certificate.courseName.en}
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <Calendar className="h-5 w-5 text-primary mr-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('certificate.completion_date')}</p>
                  <p className="font-semibold">
                    {new Date(certificate.completionDate).toLocaleDateString(locale)}
                  </p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <User className="h-5 w-5 text-primary mr-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('certificate.instructor')}</p>
                  <p className="font-semibold">{certificate.instructorName}</p>
                </div>

                <div className="text-center">
                  <div className="flex items-center justify-center mb-2">
                    <FileText className="h-5 w-5 text-primary mr-2" />
                  </div>
                  <p className="text-sm text-muted-foreground">{t('certificate.duration')}</p>
                  <p className="font-semibold">{certificate.duration}</p>
                </div>
              </div>

              {certificate.score && (
                <div className="mb-8">
                  <p className="text-sm text-muted-foreground mb-2">{t('certificate.score')}</p>
                  <p className="text-2xl font-bold text-primary">{certificate.score}%</p>
                </div>
              )}

              {/* Verification Badge */}
              <div className="flex items-center justify-center mb-8">
                <div className="flex items-center gap-2 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 px-4 py-2 rounded-full">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">{t('certificate.verified')}</span>
                </div>
              </div>

              {/* Certificate Details */}
              <div className="border-t pt-6">
                <p className="text-sm text-muted-foreground mb-2">
                  {t('certificate.serial_number')}
                </p>
                <p className="font-mono text-lg font-semibold mb-4">
                  {certificate.serialNumber}
                </p>

                <p className="text-sm text-muted-foreground mb-2">
                  {t('certificate.verification_url')}
                </p>
                <p className="text-sm text-primary break-all">
                  {certificate.verificationUrl}
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="border-t bg-gray-50 dark:bg-gray-800 p-6">
            <div className="flex flex-wrap gap-4 justify-center">
              <Button onClick={handleDownload} className="gap-2">
                <Download className="h-4 w-4" />
                {t('certificate.download')}
              </Button>

              <Button onClick={handlePrint} variant="outline" className="gap-2">
                <Printer className="h-4 w-4" />
                {t('certificate.print')}
              </Button>

              <Button onClick={handleLinkedIn} variant="outline" className="gap-2">
                <Linkedin className="h-4 w-4" />
                {t('certificate.linkedin')}
              </Button>

              <Button onClick={handleShare} variant="outline" className="gap-2">
                <Share2 className="h-4 w-4" />
                {t('certificate.share')}
              </Button>
            </div>
          </div>
        </div>

        {/* Additional Info */}
        <div className="mt-8 text-center text-sm text-muted-foreground">
          <p>
            {t('certificate.verify_note')}{' '}
            <a
              href={certificate.verificationUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline"
            >
              {certificate.verificationUrl}
            </a>
          </p>
        </div>
      </div>
    </div>
  )
}

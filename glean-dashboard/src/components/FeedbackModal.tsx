'use client'

import { useState, useEffect } from 'react'
import { X, Bug, Lightbulb, HelpCircle, MessageSquare, ExternalLink } from 'lucide-react'

const GITHUB_REPO = 'jessemcnew/glippy-glean-web-clipper'

interface FeedbackModalProps {
  isOpen: boolean
  onClose: () => void
}

type IssueType = 'bug' | 'feature' | 'question' | 'other' | null

export function FeedbackModal({ isOpen, onClose }: FeedbackModalProps) {
  const [issueType, setIssueType] = useState<IssueType>(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [stepsToReproduce, setStepsToReproduce] = useState('')
  const [browserInfo, setBrowserInfo] = useState('')

  // Collect browser info on mount
  useEffect(() => {
    if (typeof window !== 'undefined') {
      setBrowserInfo(navigator.userAgent)
    }
  }, [])

  // Handle escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // Reset form when modal closes
  useEffect(() => {
    if (!isOpen) {
      setIssueType(null)
      setTitle('')
      setDescription('')
      setStepsToReproduce('')
    }
  }, [isOpen])

  const handleSubmit = () => {
    if (!issueType || !title.trim() || !description.trim()) {
      return
    }

    const labels: Record<string, string> = {
      bug: 'bug',
      feature: 'enhancement',
      question: 'question',
      other: 'feedback',
    }

    const typePrefix: Record<string, string> = {
      bug: '[Bug]',
      feature: '[Feature]',
      question: '[Question]',
      other: '[Feedback]',
    }

    // Build GitHub issue body
    let body = `## Description\n${description}\n\n`

    if (issueType === 'bug' && stepsToReproduce.trim()) {
      body += `## Steps to Reproduce\n${stepsToReproduce}\n\n`
    }

    body += `## Environment\n`
    body += `- **Browser:** ${browserInfo}\n`
    body += `- **Extension Version:** Glippy v1.0.0\n`
    body += `\n---\n*Submitted via Glippy Feedback Modal*`

    const fullTitle = `${typePrefix[issueType]} ${title}`

    const params = new URLSearchParams({
      title: fullTitle,
      body: body,
      labels: labels[issueType],
    })

    const githubUrl = `https://github.com/${GITHUB_REPO}/issues/new?${params.toString()}`
    window.open(githubUrl, '_blank')

    onClose()
  }

  const issueTypes = [
    {
      id: 'bug' as const,
      label: 'Bug Report',
      icon: Bug,
      color: 'text-red-500 dark:text-red-400',
      bgColor: 'bg-red-500/10',
      borderColor: 'border-red-500/20',
      hoverBg: 'hover:bg-red-500/20',
    },
    {
      id: 'feature' as const,
      label: 'Feature Request',
      icon: Lightbulb,
      color: 'text-yellow-500 dark:text-yellow-400',
      bgColor: 'bg-yellow-500/10',
      borderColor: 'border-yellow-500/20',
      hoverBg: 'hover:bg-yellow-500/20',
    },
    {
      id: 'question' as const,
      label: 'Question',
      icon: HelpCircle,
      color: 'text-blue-500 dark:text-blue-400',
      bgColor: 'bg-blue-500/10',
      borderColor: 'border-blue-500/20',
      hoverBg: 'hover:bg-blue-500/20',
    },
    {
      id: 'other' as const,
      label: 'Other',
      icon: MessageSquare,
      color: 'text-zinc-500 dark:text-zinc-400',
      bgColor: 'bg-zinc-500/10',
      borderColor: 'border-zinc-500/20',
      hoverBg: 'hover:bg-zinc-500/20',
    },
  ]

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-200 dark:border-zinc-800">
          <h2 className="text-lg font-semibold">Send Feedback</h2>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="px-6 py-5 space-y-5 max-h-[70vh] overflow-y-auto">
          {/* Issue Type Selector */}
          <div className="space-y-3">
            <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              What type of feedback do you have?
            </label>
            <div className="grid grid-cols-2 gap-3">
              {issueTypes.map((type) => {
                const Icon = type.icon
                const isSelected = issueType === type.id

                return (
                  <button
                    key={type.id}
                    onClick={() => setIssueType(type.id)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg border transition-all ${
                      isSelected
                        ? `${type.bgColor} ${type.borderColor} ring-2 ring-offset-2 ring-offset-white dark:ring-offset-zinc-950 ring-blue-500`
                        : `border-zinc-200 dark:border-zinc-800 ${type.hoverBg}`
                    }`}
                  >
                    <Icon
                      className={`w-5 h-5 ${isSelected ? type.color : 'text-zinc-400 dark:text-zinc-500'}`}
                    />
                    <span
                      className={`text-sm font-medium ${isSelected ? 'text-zinc-900 dark:text-zinc-100' : 'text-zinc-600 dark:text-zinc-400'}`}
                    >
                      {type.label}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>

          {/* Title Input */}
          <div className="space-y-2">
            <label htmlFor="title" className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              id="title"
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Brief summary of your feedback"
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
            />
          </div>

          {/* Description Textarea */}
          <div className="space-y-2">
            <label
              htmlFor="description"
              className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
            >
              Description <span className="text-red-500">*</span>
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Provide more details about your feedback..."
              rows={4}
              className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
            />
          </div>

          {/* Steps to Reproduce (Bug Report only) */}
          {issueType === 'bug' && (
            <div className="space-y-2">
              <label
                htmlFor="steps"
                className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
              >
                Steps to Reproduce
              </label>
              <textarea
                id="steps"
                value={stepsToReproduce}
                onChange={(e) => setStepsToReproduce(e.target.value)}
                placeholder={'1. Go to...\n2. Click on...\n3. See error...'}
                rows={4}
                className="w-full px-3 py-2 bg-zinc-50 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-lg text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all resize-none"
              />
            </div>
          )}

          {/* Info Note */}
          <div className="flex items-start gap-2 px-3 py-2.5 bg-blue-50 dark:bg-blue-500/10 border border-blue-200 dark:border-blue-500/20 rounded-lg">
            <HelpCircle className="w-4 h-4 text-blue-500 dark:text-blue-400 mt-0.5 flex-shrink-0" />
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              Clicking &quot;Open GitHub&quot; will open a new tab with your feedback pre-filled in
              a GitHub issue. You&apos;ll need a GitHub account to submit.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 py-4 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
          <button
            onClick={onClose}
            className="px-4 py-2 text-sm font-medium text-zinc-600 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!issueType || !title.trim() || !description.trim()}
            className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-zinc-300 dark:disabled:bg-zinc-800 disabled:text-zinc-500 disabled:cursor-not-allowed rounded-lg transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Open GitHub
          </button>
        </div>
      </div>
    </div>
  )
}

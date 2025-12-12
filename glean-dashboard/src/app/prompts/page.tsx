'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import LoginForm from '@/components/LoginForm'
// Using regular anchor tags instead of next/link to avoid RSC fetch errors in chrome extension
import { 
  Search, 
  Plus,
  Copy,
  Trash2,
  Edit3,
  FileText,
  Home,
  ArrowLeft,
  Check
} from 'lucide-react'

interface Prompt {
  id: string
  title: string
  content: string
  category: string
  createdAt: Date
  usageCount: number
}

const MOCK_PROMPTS: Prompt[] = [
  {
    id: '1',
    title: 'Summarize Document',
    content: 'Please provide a concise summary of the following document, highlighting the key points and main takeaways:',
    category: 'Analysis',
    createdAt: new Date('2025-01-10'),
    usageCount: 45
  },
  {
    id: '2',
    title: 'Extract Action Items',
    content: 'Review the following content and extract all action items, deadlines, and responsible parties:',
    category: 'Productivity',
    createdAt: new Date('2025-01-08'),
    usageCount: 32
  },
  {
    id: '3',
    title: 'Compare Documents',
    content: 'Compare and contrast the following documents, identifying similarities, differences, and any conflicting information:',
    category: 'Analysis',
    createdAt: new Date('2025-01-05'),
    usageCount: 18
  },
  {
    id: '4',
    title: 'Generate FAQ',
    content: 'Based on the following content, generate a comprehensive FAQ section with common questions and answers:',
    category: 'Content',
    createdAt: new Date('2025-01-03'),
    usageCount: 27
  }
]

export default function PromptsPage() {
  const { isAuth, isLoading } = useAuth()
  const [prompts, setPrompts] = useState<Prompt[]>(MOCK_PROMPTS)
  const [searchQuery, setSearchQuery] = useState('')
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [activeCategory, setActiveCategory] = useState<string>('all')

  if (isLoading) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-zinc-700 border-t-blue-500 rounded-full animate-spin" />
      </div>
    )
  }

  if (!isAuth) {
    return <LoginForm />
  }

  const categories = ['all', ...new Set(prompts.map(p => p.category))]

  const filteredPrompts = prompts.filter(prompt => {
    const matchesSearch = !searchQuery || 
      prompt.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      prompt.content.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = activeCategory === 'all' || prompt.category === activeCategory
    return matchesSearch && matchesCategory
  })

  const handleCopy = async (prompt: Prompt) => {
    await navigator.clipboard.writeText(prompt.content)
    setCopiedId(prompt.id)
    setTimeout(() => setCopiedId(null), 2000)
  }

  const handleDelete = (id: string) => {
    setPrompts(prompts.filter(p => p.id !== id))
  }

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-100">
      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <a
              href="../"
              className="p-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-zinc-400" />
            </a>
            <div>
              <h1 className="text-2xl font-semibold flex items-center gap-2">
                <FileText className="w-6 h-6 text-purple-500" />
                Saved Prompts
              </h1>
              <p className="text-zinc-400 text-sm">{prompts.length} prompts saved</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <a
              href="../"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-800 transition-colors text-sm"
            >
              <Home className="w-4 h-4" />
              Dashboard
            </a>
            <button className="flex items-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-700 transition-colors text-sm font-medium">
              <Plus className="w-4 h-4" />
              New Prompt
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-zinc-500" />
            <input
              type="text"
              placeholder="Search prompts..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-zinc-900 border border-zinc-800 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent text-zinc-100 placeholder-zinc-500"
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors capitalize ${
                  activeCategory === cat 
                    ? 'bg-purple-600 text-white' 
                    : 'bg-zinc-900 text-zinc-400 hover:bg-zinc-800'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {filteredPrompts.length === 0 ? (
          <div className="text-center py-20">
            <FileText className="w-12 h-12 text-zinc-700 mx-auto mb-4" />
            <p className="text-zinc-400">
              {searchQuery || activeCategory !== 'all' 
                ? 'No prompts match your search' 
                : 'No prompts yet. Create your first prompt to get started.'}
            </p>
          </div>
        ) : (
          <div className="grid gap-4">
            {filteredPrompts.map((prompt) => (
              <div 
                key={prompt.id}
                className="p-5 bg-zinc-900 border border-zinc-800 rounded-lg hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-medium text-zinc-100">{prompt.title}</h3>
                      <span className="px-2 py-0.5 bg-zinc-800 text-zinc-400 rounded text-xs">
                        {prompt.category}
                      </span>
                    </div>
                    <p className="text-zinc-400 text-sm line-clamp-2 mb-3">{prompt.content}</p>
                    <div className="flex items-center gap-4 text-xs text-zinc-500">
                      <span>Used {prompt.usageCount} times</span>
                      <span>Created {prompt.createdAt.toLocaleDateString()}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleCopy(prompt)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                      title="Copy prompt"
                    >
                      {copiedId === prompt.id ? (
                        <Check className="w-4 h-4 text-green-500" />
                      ) : (
                        <Copy className="w-4 h-4 text-zinc-400" />
                      )}
                    </button>
                    <button
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors"
                      title="Edit prompt"
                    >
                      <Edit3 className="w-4 h-4 text-zinc-400" />
                    </button>
                    <button
                      onClick={() => handleDelete(prompt.id)}
                      className="p-2 rounded-lg bg-zinc-800 hover:bg-red-900/50 transition-colors"
                      title="Delete prompt"
                    >
                      <Trash2 className="w-4 h-4 text-zinc-400 hover:text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

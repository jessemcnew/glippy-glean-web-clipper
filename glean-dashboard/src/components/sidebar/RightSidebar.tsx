'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

// Mock recent activity - will be from real data later
const MOCK_ACTIVITY = [
  { id: '1', type: 'clip_added', message: 'New clip added', time: '2 minutes ago' },
  { id: '2', type: 'collection_updated', message: 'Collection updated', time: '1 hour ago' },
  { id: '3', type: 'sync_completed', message: 'Sync completed', time: '3 hours ago' },
]

// Mock trending topics - will be from real data later
const MOCK_TRENDING_TOPICS = [
  { name: 'Product Roadmap', mentions: 24 },
  { name: 'Engineering Standards', mentions: 18 },
  { name: 'Design System', mentions: 15 },
  { name: 'API Documentation', mentions: 12 },
]

interface RightSidebarProps {
  onToggleCollapse?: () => void
  isCollapsed?: boolean
}

export function RightSidebar({ onToggleCollapse, isCollapsed }: RightSidebarProps) {
  return (
    <div className="flex flex-col h-full w-96 bg-zinc-900 border-l border-zinc-800">
      {/* Header */}
      <div className="p-4 border-b border-zinc-800 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-zinc-100">Quick Actions Assistant</h2>
        <Button
          variant="ghost"
          size="icon"
          onClick={onToggleCollapse}
          className="h-8 w-8 text-zinc-300 hover:text-zinc-100 hover:bg-zinc-800"
          aria-label={isCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
        >
          {isCollapsed ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="space-y-4">
          {/* Recent Activity */}
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-100">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {MOCK_ACTIVITY.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div
                      className={`h-2 w-2 rounded-full mt-1.5 flex-shrink-0 ${
                        activity.type === 'clip_added'
                          ? 'bg-green-500'
                          : activity.type === 'collection_updated'
                            ? 'bg-blue-500'
                            : 'bg-yellow-500'
                      }`}
                    />
                    <div>
                      <p className="text-zinc-300">{activity.message}</p>
                      <p className="text-zinc-500 text-xs">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Trending Topics */}
          <Card className="bg-zinc-800 border-zinc-700">
            <CardHeader>
              <CardTitle className="text-sm text-zinc-100">Trending Topics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {MOCK_TRENDING_TOPICS.map((topic, index) => (
                  <button
                    key={index}
                    className="w-full text-left px-3 py-2 rounded-lg bg-zinc-900 hover:bg-zinc-700 transition-colors"
                  >
                    <p className="text-sm text-zinc-300">{topic.name}</p>
                    <p className="text-xs text-zinc-500 mt-1">{topic.mentions} mentions</p>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}

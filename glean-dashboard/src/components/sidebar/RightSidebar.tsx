'use client'

import { Plus, Upload, Clock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'

// Mock recent activity - will be from real data later
const MOCK_ACTIVITY = [
  { id: '1', type: 'clip_added', message: 'New clip added', time: '2 minutes ago' },
  { id: '2', type: 'collection_updated', message: 'Collection updated', time: '1 hour ago' },
  { id: '3', type: 'sync_completed', message: 'Sync completed', time: '3 hours ago' },
]

interface RightSidebarProps {
  onNewClip?: () => void
  onImportData?: () => void
}

export function RightSidebar({ onNewClip, onImportData }: RightSidebarProps) {
  return (
    <div className="flex flex-col h-full w-80 p-4 space-y-4">
      {/* Quick Actions */}
      <Card className="border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Quick Actions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onNewClip}
          >
            <Plus className="h-4 w-4" />
            New Clip
          </Button>
          <Button
            variant="outline"
            className="w-full justify-start gap-2"
            onClick={onImportData}
          >
            <Upload className="h-4 w-4" />
            Import Data
          </Button>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card className="flex-1 border-zinc-200 dark:border-zinc-800">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-semibold">Recent Activity</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="space-y-3">
            {MOCK_ACTIVITY.map((activity) => (
              <li key={activity.id} className="flex items-start gap-3">
                <div
                  className={`mt-1 h-2 w-2 rounded-full flex-shrink-0 ${
                    activity.type === 'clip_added'
                      ? 'bg-green-500'
                      : activity.type === 'collection_updated'
                        ? 'bg-blue-500'
                        : 'bg-amber-500'
                  }`}
                />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-zinc-700 dark:text-zinc-300">
                    {activity.message}
                  </p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {activity.time}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  )
}

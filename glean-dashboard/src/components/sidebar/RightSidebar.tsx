'use client'

import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Plus, Upload } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useCollapsibleSidebar } from '@/components/CollapsibleSidebar'

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
  const sidebarContext = useCollapsibleSidebar()
  const isCollapsed = sidebarContext?.isCollapsed ?? false

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      {!isCollapsed && (
        <div className="p-4 border-b border-border">
          <h2 className="text-lg font-semibold text-foreground">Quick Actions</h2>
        </div>
      )}

      {/* Scrollable content */}
      <div className={cn("flex-1 overflow-y-auto", isCollapsed ? "p-2" : "p-6")}>
        <div className={cn("space-y-6", isCollapsed && "space-y-4")}>
          {/* Quick Actions */}
          <div>
            {!isCollapsed && (
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                QUICK ACTIONS
              </h3>
            )}
            <div className={cn("space-y-2", isCollapsed && "space-y-3")}>
              <Button
                variant="outline"
                size="sm"
                onClick={onNewClip}
                className={cn(
                  "w-full bg-accent border-border text-foreground hover:bg-accent/80 hover:text-foreground",
                  isCollapsed ? "justify-center p-0 h-auto" : "justify-start"
                )}
              >
                <Plus className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">New Clip</span>}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onImportData}
                className={cn(
                  "w-full bg-accent border-border text-foreground hover:bg-accent/80 hover:text-foreground",
                  isCollapsed ? "justify-center p-0 h-auto" : "justify-start"
                )}
              >
                <Upload className="h-4 w-4" />
                {!isCollapsed && <span className="ml-2">Import</span>}
              </Button>
            </div>
          </div>

          {/* Recent Activity */}
          {!isCollapsed && (
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3">
                RECENT ACTIVITY
              </h3>
              <Card className="bg-accent border-border">
                <CardContent className="pt-6">
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
                          <p className="text-foreground">{activity.message}</p>
                          <p className="text-muted-foreground text-xs">{activity.time}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

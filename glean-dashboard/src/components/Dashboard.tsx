'use client'

import { useState, useEffect } from 'react'
import { useSidebar } from '@/contexts/SidebarContext'
import { CollapsibleSidebar } from '@/components/CollapsibleSidebar'
import { LeftSidebar } from '@/components/sidebar/LeftSidebar'
import { RightSidebar } from '@/components/sidebar/RightSidebar'
import { ClipsList } from '@/components/ClipsList'
import { ReaderPane } from '@/components/ReaderPane'
import { fetchClips, deleteClip, type Clip } from '@/lib/clips-service'

interface DashboardProps {
  onLogout?: () => void
}

export function Dashboard({ onLogout }: DashboardProps) {
  const { leftSidebarOpen, rightSidebarOpen, toggleLeftSidebar, toggleRightSidebar } =
    useSidebar()

  // Collections state
  const [selectedCollectionId, setSelectedCollectionId] = useState<string | null>(null)

  // Clips state
  const [clips, setClips] = useState<Clip[]>([])
  const [isLoadingClips, setIsLoadingClips] = useState(true)
  const [selectedClip, setSelectedClip] = useState<Clip | null>(null)

  // Load clips on mount
  useEffect(() => {
    loadClips()
  }, [])

  const loadClips = async () => {
    setIsLoadingClips(true)
    try {
      const loadedClips = await fetchClips()
      setClips(loadedClips)
    } catch (error) {
      console.error('Failed to load clips:', error)
      setClips([])
    } finally {
      setIsLoadingClips(false)
    }
  }

  // Filter clips by selected collection
  const filteredClips = selectedCollectionId
    ? clips.filter(
        (clip) =>
          clip.collectionId === selectedCollectionId ||
          clip.collectionName === selectedCollectionId
      )
    : clips

  // Get collection name for display
  const selectedCollectionName = selectedCollectionId
    ? clips.find(
        (c) => c.collectionId === selectedCollectionId || c.collectionName === selectedCollectionId
      )?.collectionName || selectedCollectionId
    : undefined

  // Handle clip selection
  const handleSelectClip = (clip: Clip) => {
    setSelectedClip(clip)
  }

  // Handle clip close
  const handleCloseReader = () => {
    setSelectedClip(null)
  }

  // Handle delete clip
  const handleDeleteClip = async (clipId: string | number) => {
    const success = await deleteClip(clipId)
    if (success) {
      await loadClips()
      if (selectedClip?.id === clipId) {
        setSelectedClip(null)
      }
    }
  }

  // Navigation functions for reader
  const navigateToNextClip = () => {
    if (!selectedClip) return
    const currentIndex = filteredClips.findIndex((c) => c.id === selectedClip.id)
    if (currentIndex < filteredClips.length - 1) {
      setSelectedClip(filteredClips[currentIndex + 1])
    }
  }

  const navigateToPreviousClip = () => {
    if (!selectedClip) return
    const currentIndex = filteredClips.findIndex((c) => c.id === selectedClip.id)
    if (currentIndex > 0) {
      setSelectedClip(filteredClips[currentIndex - 1])
    }
  }

  return (
    <div className="flex h-screen bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">
      {/* Left Sidebar - Collections & Navigation */}
      <CollapsibleSidebar
        isOpen={leftSidebarOpen}
        onToggle={toggleLeftSidebar}
        side="left"
        width="w-72"
      >
        <LeftSidebar
          selectedCollectionId={selectedCollectionId}
          onSelectCollection={setSelectedCollectionId}
          totalClipsCount={clips.length}
        />
      </CollapsibleSidebar>

      {/* Center - Clips List */}
      <div className="flex-1 flex flex-col min-w-0 border-x border-zinc-200 dark:border-zinc-800">
        <ClipsList
          clips={filteredClips}
          selectedClipId={selectedClip?.id ?? null}
          onSelectClip={handleSelectClip}
          isLoading={isLoadingClips}
          collectionName={selectedCollectionName}
        />
      </div>

      {/* Right Sidebar - Reader Pane or Quick Actions */}
      <CollapsibleSidebar
        isOpen={rightSidebarOpen}
        onToggle={toggleRightSidebar}
        side="right"
        width={selectedClip ? 'w-96' : 'w-80'}
      >
        {selectedClip ? (
          <ReaderPane
            clip={selectedClip}
            onClose={handleCloseReader}
            onNavigateNext={navigateToNextClip}
            onNavigatePrevious={navigateToPreviousClip}
            onDelete={handleDeleteClip}
          />
        ) : (
          <RightSidebar />
        )}
      </CollapsibleSidebar>
    </div>
  )
}

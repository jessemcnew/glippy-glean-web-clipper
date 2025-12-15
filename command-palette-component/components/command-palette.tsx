"use client"

import type React from "react"

import { useState, useEffect, useRef, useMemo } from "react"
import {
  X,
  Zap,
  Link2,
  FileText,
  Clock,
  Library,
  Sparkles,
  Crop,
  Monitor,
  Maximize2,
  Settings,
  Sliders,
} from "lucide-react"

interface Command {
  id: string
  label: string
  category: string
  icon: React.ReactNode
  shortcut?: string
  action: () => void
}

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
  onCommand?: (commandId: string) => void
}

export default function CommandPalette({ isOpen, onClose, onCommand }: CommandPaletteProps) {
  const [search, setSearch] = useState("")
  const [selectedIndex, setSelectedIndex] = useState(0)
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const commands: Command[] = [
    // Quick Actions
    {
      id: "clip-selection",
      label: "Clip Selection",
      category: "Quick Actions",
      icon: <Zap className="w-4 h-4" />,
      action: () => handleCommand("clip-selection"),
    },
    {
      id: "save-url",
      label: "Save URL",
      category: "Quick Actions",
      icon: <Link2 className="w-4 h-4" />,
      shortcut: "⌘⌥0",
      action: () => handleCommand("save-url"),
    },
    {
      id: "capture-page",
      label: "Capture Page",
      category: "Quick Actions",
      icon: <FileText className="w-4 h-4" />,
      action: () => handleCommand("capture-page"),
    },

    // Navigation
    {
      id: "recent-clips",
      label: "Recent Clips",
      category: "Navigation",
      icon: <Clock className="w-4 h-4" />,
      shortcut: "⌥1",
      action: () => handleCommand("recent-clips"),
    },
    {
      id: "library",
      label: "Library",
      category: "Navigation",
      icon: <Library className="w-4 h-4" />,
      action: () => handleCommand("library"),
    },
    {
      id: "prompts",
      label: "Prompts",
      category: "Navigation",
      icon: <Sparkles className="w-4 h-4" />,
      action: () => handleCommand("prompts"),
    },

    // Capture
    {
      id: "capture-area",
      label: "Capture Area",
      category: "Capture",
      icon: <Crop className="w-4 h-4" />,
      shortcut: "⌥2",
      action: () => handleCommand("capture-area"),
    },
    {
      id: "capture-visible",
      label: "Capture Visible",
      category: "Capture",
      icon: <Monitor className="w-4 h-4" />,
      shortcut: "⌥3",
      action: () => handleCommand("capture-visible"),
    },
    {
      id: "capture-full-page",
      label: "Capture Full Page",
      category: "Capture",
      icon: <Maximize2 className="w-4 h-4" />,
      shortcut: "⌥4",
      action: () => handleCommand("capture-full-page"),
    },

    // Settings
    {
      id: "preferences",
      label: "Preferences",
      category: "Settings",
      icon: <Settings className="w-4 h-4" />,
      action: () => handleCommand("preferences"),
    },
    {
      id: "configuration",
      label: "Configuration",
      category: "Settings",
      icon: <Sliders className="w-4 h-4" />,
      action: () => handleCommand("configuration"),
    },
  ]

  // Fuzzy search filter
  const filteredCommands = useMemo(() => {
    if (!search.trim()) return commands

    const searchLower = search.toLowerCase().replace(/\s+/g, "")

    return commands.filter((command) => {
      const labelLower = command.label.toLowerCase().replace(/\s+/g, "")
      const categoryLower = command.category.toLowerCase().replace(/\s+/g, "")

      // Simple fuzzy matching
      let searchIndex = 0
      for (let i = 0; i < labelLower.length && searchIndex < searchLower.length; i++) {
        if (labelLower[i] === searchLower[searchIndex]) {
          searchIndex++
        }
      }

      return (
        searchIndex === searchLower.length || categoryLower.includes(searchLower) || labelLower.includes(searchLower)
      )
    })
  }, [search])

  // Group filtered commands by category
  const groupedCommands = useMemo(() => {
    const groups: { [key: string]: Command[] } = {}

    filteredCommands.forEach((command) => {
      if (!groups[command.category]) {
        groups[command.category] = []
      }
      groups[command.category].push(command)
    })

    return groups
  }, [filteredCommands])

  const handleCommand = (commandId: string) => {
    onCommand?.(commandId)
    onClose()
  }

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose()
      } else if (e.key === "ArrowDown") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.min(prev + 1, filteredCommands.length - 1))
      } else if (e.key === "ArrowUp") {
        e.preventDefault()
        setSelectedIndex((prev) => Math.max(prev - 1, 0))
      } else if (e.key === "Enter") {
        e.preventDefault()
        if (filteredCommands[selectedIndex]) {
          filteredCommands[selectedIndex].action()
        }
      }
    }

    window.addEventListener("keydown", handleKeyDown)
    return () => window.removeEventListener("keydown", handleKeyDown)
  }, [isOpen, selectedIndex, filteredCommands, onClose])

  // Focus input on open
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus()
      setSearch("")
      setSelectedIndex(0)
    }
  }, [isOpen])

  // Scroll selected item into view
  useEffect(() => {
    if (!listRef.current) return

    const selectedElement = listRef.current.querySelector(`[data-index="${selectedIndex}"]`)
    if (selectedElement) {
      selectedElement.scrollIntoView({ block: "nearest", behavior: "smooth" })
    }
  }, [selectedIndex])

  if (!isOpen) return null

  let commandIndex = -1

  return (
    <div className="fixed inset-0 z-[9999] flex items-start justify-center pt-[15vh] px-4">
      {/* Backdrop with blur */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />

      {/* Command Palette */}
      <div className="relative w-full max-w-2xl bg-[#0f0f11] border border-[#1f2937] rounded-xl shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Search Input */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-[#1f2937]">
          <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
          <input
            ref={inputRef}
            type="text"
            placeholder="Search commands..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value)
              setSelectedIndex(0)
            }}
            className="flex-1 bg-transparent text-[#e5e7eb] placeholder-gray-500 outline-none text-base"
          />
          <button onClick={onClose} className="text-gray-500 hover:text-gray-300 transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Commands List */}
        <div
          ref={listRef}
          className="max-h-[400px] overflow-y-auto scrollbar-thin scrollbar-thumb-[#1f2937] scrollbar-track-transparent"
        >
          {Object.keys(groupedCommands).length === 0 ? (
            <div className="px-4 py-8 text-center text-gray-500">No commands found</div>
          ) : (
            Object.entries(groupedCommands).map(([category, categoryCommands]) => (
              <div key={category} className="py-2">
                {/* Category Header */}
                <div className="px-4 py-1.5 text-xs font-semibold text-gray-500 uppercase tracking-wider">
                  {category}
                </div>

                {/* Commands in Category */}
                {categoryCommands.map((command) => {
                  commandIndex++
                  const currentIndex = commandIndex
                  const isSelected = currentIndex === selectedIndex

                  return (
                    <button
                      key={command.id}
                      data-index={currentIndex}
                      onClick={command.action}
                      onMouseEnter={() => setSelectedIndex(currentIndex)}
                      className={`w-full flex items-center justify-between px-4 py-2.5 transition-all duration-150 ${
                        isSelected
                          ? "bg-white/5 border-l-2 border-blue-500"
                          : "border-l-2 border-transparent hover:bg-white/5"
                      }`}
                    >
                      <div className="flex items-center gap-3">
                        <div className={`transition-colors ${isSelected ? "text-blue-400" : "text-gray-400"}`}>
                          {command.icon}
                        </div>
                        <span
                          className={`text-sm font-medium transition-colors ${
                            isSelected ? "text-white" : "text-[#e5e7eb]"
                          }`}
                        >
                          {command.label}
                        </span>
                      </div>

                      {command.shortcut && (
                        <div className="flex items-center gap-1">
                          {command.shortcut.split("").map((key, i) => (
                            <kbd
                              key={i}
                              className="px-1.5 py-0.5 text-xs font-medium text-gray-400 bg-[#1a1a1c] border border-[#2a2a2e] rounded shadow-sm"
                            >
                              {key}
                            </kbd>
                          ))}
                        </div>
                      )}
                    </button>
                  )
                })}
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between px-4 py-2 border-t border-[#1f2937] bg-[#0a0a0c]">
          <div className="flex items-center gap-4 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#1a1a1c] border border-[#2a2a2e] rounded">↑</kbd>
              <kbd className="px-1.5 py-0.5 bg-[#1a1a1c] border border-[#2a2a2e] rounded">↓</kbd>
              <span>to navigate</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#1a1a1c] border border-[#2a2a2e] rounded">↵</kbd>
              <span>to select</span>
            </span>
            <span className="flex items-center gap-1">
              <kbd className="px-1.5 py-0.5 bg-[#1a1a1c] border border-[#2a2a2e] rounded">esc</kbd>
              <span>to close</span>
            </span>
          </div>
          <div className="text-xs text-gray-600 font-mono">Glippy</div>
        </div>
      </div>
    </div>
  )
}

"use client"

import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"
import type { CollectionFilter } from "@/lib/collections-service"

interface CollectionsFilterProps {
  filter: CollectionFilter
  onFilterChange: (filter: CollectionFilter) => void
}

export function CollectionsFilter({ filter, onFilterChange }: CollectionsFilterProps) {
  return (
    <ToggleGroup
      type="single"
      value={filter}
      onValueChange={(value) => {
        if (value) {
          onFilterChange(value as CollectionFilter)
        }
      }}
      className="w-full"
    >
      <ToggleGroupItem value="all" aria-label="Show all collections">
        All
      </ToggleGroupItem>
      <ToggleGroupItem value="owned" aria-label="Show my collections">
        My Collections
      </ToggleGroupItem>
      <ToggleGroupItem value="shared" aria-label="Show shared collections">
        Shared with me
      </ToggleGroupItem>
    </ToggleGroup>
  )
}


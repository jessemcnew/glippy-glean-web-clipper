'use client';

import { useState } from 'react';
import { X, Check, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { GleanLogo } from './glean-logo';

interface ClipperPopupProps {
  isOpen: boolean;
  onClose: () => void;
  currentUrl: string;
  currentTitle: string;
}

const mockCollections = [
  { id: 1, name: 'Development', count: 12, color: 'bg-blue-500' },
  { id: 2, name: 'Design', count: 8, color: 'bg-purple-500' },
  { id: 3, name: 'Research', count: 5, color: 'bg-green-500' },
  { id: 4, name: 'Marketing', count: 3, color: 'bg-orange-500' },
];

export function ClipperPopup({ isOpen, onClose, currentUrl, currentTitle }: ClipperPopupProps) {
  const [selectedCollection, setSelectedCollection] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [isClipping, setIsClipping] = useState(false);
  const [isClipped, setIsClipped] = useState(false);

  if (!isOpen) return null;

  const filteredCollections = mockCollections.filter(collection =>
    collection.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleClip = async () => {
    if (!selectedCollection) return;

    setIsClipping(true);
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsClipping(false);
    setIsClipped(true);

    // Auto close after success
    setTimeout(() => {
      onClose();
      setIsClipped(false);
      setSelectedCollection(null);
    }, 1500);
  };

  const getDomain = (url: string) => {
    try {
      return new URL(url).hostname.replace('www.', '');
    } catch {
      return url;
    }
  };

  return (
    <div className='fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4'>
      <Card className='w-full max-w-md bg-background border-border shadow-2xl'>
        {/* Header */}
        <div className='flex items-center justify-between p-4 border-b border-border'>
          <div className='flex items-center gap-2'>
            <GleanLogo className='w-5 h-5 text-primary' />
            <h2 className='text-sm font-medium'>Clip to Glean</h2>
          </div>
          <Button variant='ghost' size='sm' className='h-7 w-7 p-0' onClick={onClose}>
            <X className='w-4 h-4' />
          </Button>
        </div>

        {/* Current page info */}
        <div className='p-4 border-b border-border bg-muted/20'>
          <div className='flex items-start gap-3'>
            <div className='w-8 h-8 rounded bg-accent flex items-center justify-center shrink-0 mt-0.5'>
              <div className='w-4 h-4 rounded bg-primary/20'></div>
            </div>
            <div className='flex-1 min-w-0'>
              <h3 className='text-sm font-medium text-foreground line-clamp-2 leading-tight'>
                {currentTitle}
              </h3>
              <p className='text-xs text-muted-foreground mt-1 truncate'>{getDomain(currentUrl)}</p>
            </div>
          </div>
        </div>

        {/* Collection selection */}
        <div className='p-4'>
          <div className='flex items-center justify-between mb-3'>
            <label className='text-sm font-medium text-foreground'>Select Collection</label>
            <Button
              variant='ghost'
              size='sm'
              className='h-6 text-xs text-muted-foreground hover:text-foreground'
            >
              <Plus className='w-3 h-3 mr-1' />
              New
            </Button>
          </div>

          {/* Search collections */}
          <div className='relative mb-3'>
            <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground' />
            <Input
              placeholder='Search collections...'
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className='pl-9 h-8 text-sm'
            />
          </div>

          {/* Collections list */}
          <div className='space-y-2 max-h-48 overflow-y-auto'>
            {filteredCollections.map(collection => (
              <div
                key={collection.id}
                className={`p-3 rounded-lg border cursor-pointer transition-all hover:bg-accent/50 ${
                  selectedCollection === collection.id
                    ? 'border-primary bg-primary/5'
                    : 'border-border'
                }`}
                onClick={() => setSelectedCollection(collection.id)}
              >
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className={`w-3 h-3 rounded-full ${collection.color}`}></div>
                    <div>
                      <p className='text-sm font-medium text-foreground'>{collection.name}</p>
                      <p className='text-xs text-muted-foreground'>{collection.count} links</p>
                    </div>
                  </div>
                  {selectedCollection === collection.id && (
                    <Check className='w-4 h-4 text-primary' />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Actions */}
        <div className='p-4 border-t border-border bg-muted/10'>
          <div className='flex gap-2'>
            <Button
              variant='outline'
              size='sm'
              className='flex-1 h-9 bg-transparent'
              onClick={onClose}
              disabled={isClipping}
            >
              Cancel
            </Button>
            <Button
              size='sm'
              className='flex-1 h-9'
              onClick={handleClip}
              disabled={!selectedCollection || isClipping}
            >
              {isClipping ? (
                <div className='flex items-center gap-2'>
                  <div className='w-3 h-3 border border-current border-t-transparent rounded-full animate-spin'></div>
                  Clipping...
                </div>
              ) : isClipped ? (
                <div className='flex items-center gap-2'>
                  <Check className='w-3 h-3' />
                  Clipped!
                </div>
              ) : (
                'Clip Link'
              )}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}

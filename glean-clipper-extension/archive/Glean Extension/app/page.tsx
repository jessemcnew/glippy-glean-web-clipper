'use client';

import { useState, useEffect } from 'react';
import { Search, Plus, ExternalLink, Folder, Clock, Sun, Moon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { GleanLogo } from '@/components/glean-logo';
import { ClipperPopup } from '@/components/clipper-popup';

// Mock data - replace with your actual data
const mockLinks = [
  {
    id: 1,
    title: 'Advanced React Patterns',
    url: 'https://kentcdodds.com/blog/advanced-react-patterns',
    collection: 'Development',
    timestamp: '2 hours ago',
    domain: 'kentcdodds.com',
    syncStatus: 'synced', // synced, syncing, failed
  },
  {
    id: 2,
    title: 'Design System Guidelines',
    url: 'https://design-system.service.gov.uk/',
    collection: 'Design',
    timestamp: '1 day ago',
    domain: 'design-system.service.gov.uk',
    syncStatus: 'syncing',
  },
  {
    id: 3,
    title: 'TypeScript Best Practices',
    url: 'https://typescript-eslint.io/rules/',
    collection: 'Development',
    timestamp: '3 days ago',
    domain: 'typescript-eslint.io',
    syncStatus: 'failed',
  },
];

const mockCollections = [
  { name: 'Development', count: 12 },
  { name: 'Design', count: 8 },
  { name: 'Research', count: 5 },
];

export default function GleanExtensionPopup() {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState('links');
  const [isDark, setIsDark] = useState(true);
  const [showClipper, setShowClipper] = useState(false);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  const filteredLinks = mockLinks.filter(
    link =>
      link.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      link.collection.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const SyncIndicator = ({ status }: { status: string }) => {
    const getStatusConfig = () => {
      switch (status) {
        case 'synced':
          return {
            color: 'bg-green-500',
            glow: 'shadow-green-500/50',
            title: 'Synced successfully',
          };
        case 'syncing':
          return { color: 'bg-yellow-500', glow: 'shadow-yellow-500/50', title: 'Syncing...' };
        case 'failed':
          return { color: 'bg-red-500', glow: 'shadow-red-500/50', title: 'Sync failed' };
        default:
          return { color: 'bg-gray-500', glow: 'shadow-gray-500/50', title: 'Unknown status' };
      }
    };

    const config = getStatusConfig();

    return (
      <div
        className={`w-2 h-2 rounded-full ${config.color} shadow-lg ${config.glow} animate-pulse`}
        title={config.title}
      />
    );
  };

  return (
    <div className='extension-popup bg-background text-foreground'>
      {/* Header */}
      <div className='border-b border-border p-4'>
        <div className='flex items-center justify-between mb-4'>
          <div className='flex items-center gap-2'>
            <GleanLogo className='w-5 h-5 text-primary' />
            <h1 className='text-sm font-medium text-foreground'>Glean</h1>
          </div>
          <div className='flex items-center gap-1'>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 w-7 p-0'
              onClick={() => setIsDark(!isDark)}
            >
              {isDark ? <Sun className='w-3.5 h-3.5' /> : <Moon className='w-3.5 h-3.5' />}
            </Button>
            <Button
              variant='ghost'
              size='sm'
              className='h-7 w-7 p-0'
              onClick={() => setShowClipper(true)}
            >
              <Plus className='w-3.5 h-3.5' />
            </Button>
          </div>
        </div>

        {/* Search */}
        <div className='relative'>
          <Search className='absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground' />
          <Input
            placeholder='Search links and collections...'
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className='pl-9 h-9 bg-input border-border text-sm'
          />
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className='flex-1'>
        <TabsList className='grid w-full grid-cols-2 bg-muted/30 m-3 h-9'>
          <TabsTrigger value='links' className='text-xs h-7'>
            Links
          </TabsTrigger>
          <TabsTrigger value='collections' className='text-xs h-7'>
            Collections
          </TabsTrigger>
        </TabsList>

        <TabsContent value='links' className='mt-0 px-3 pb-3'>
          <div className='space-y-2 max-h-[480px] overflow-y-auto'>
            {filteredLinks.map(link => (
              <Card key={link.id} className='link-item p-3 cursor-pointer border-border/50'>
                <div className='flex items-start gap-3'>
                  <div className='favicon-placeholder mt-0.5'></div>
                  <div className='flex-1 min-w-0'>
                    <div className='flex items-start justify-between gap-2'>
                      <h3 className='text-sm font-medium text-foreground line-clamp-2 leading-tight'>
                        {link.title}
                      </h3>
                      <div className='flex items-center gap-2 shrink-0'>
                        <SyncIndicator status={link.syncStatus} />
                        <Button
                          variant='ghost'
                          size='sm'
                          className='h-6 w-6 p-0 opacity-60 hover:opacity-100'
                        >
                          <ExternalLink className='w-3 h-3' />
                        </Button>
                      </div>
                    </div>
                    <p className='text-xs text-muted-foreground mt-1 truncate'>{link.domain}</p>
                    <div className='flex items-center justify-between mt-2'>
                      <Badge variant='secondary' className='text-xs px-2 py-0.5 bg-secondary/50'>
                        {link.collection}
                      </Badge>
                      <div className='flex items-center gap-1 text-xs text-muted-foreground'>
                        <Clock className='w-3 h-3' />
                        {link.timestamp}
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value='collections' className='mt-0 px-3 pb-3'>
          <div className='space-y-2 max-h-[480px] overflow-y-auto'>
            {mockCollections.map(collection => (
              <Card key={collection.name} className='link-item p-3 cursor-pointer border-border/50'>
                <div className='flex items-center justify-between'>
                  <div className='flex items-center gap-3'>
                    <div className='w-7 h-7 rounded bg-accent flex items-center justify-center'>
                      <Folder className='w-3.5 h-3.5 text-accent-foreground' />
                    </div>
                    <div>
                      <h3 className='text-sm font-medium text-foreground'>{collection.name}</h3>
                      <p className='text-xs text-muted-foreground'>{collection.count} links</p>
                    </div>
                  </div>
                  <Button
                    variant='ghost'
                    size='sm'
                    className='h-6 w-6 p-0 opacity-60 hover:opacity-100'
                  >
                    <ExternalLink className='w-3 h-3' />
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      {/* Clipper Popup */}
      <ClipperPopup
        isOpen={showClipper}
        onClose={() => setShowClipper(false)}
        currentUrl='https://example.com/article'
        currentTitle='How to Build Better Chrome Extensions'
      />
    </div>
  );
}

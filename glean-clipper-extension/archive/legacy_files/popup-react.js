// v0-inspired popup UI using vanilla JavaScript (CSP-compliant)
// Mimics the v0 design system without external dependencies

(function () {
  // Simple state management
  let state = {
    activeTab: 'clip',
    isClipping: false,
    isClipped: false,
    searchQuery: '',
    selectedCollection: null,
    clips: [],
    page: { url: '', title: '' },
    config: {}
  };

  // Mock collections (v0 inspired)
  const mockCollections = [
    { id: 1, name: 'Development', count: 12, color: '#3b82f6' },
    { id: 2, name: 'Design', count: 8, color: '#a855f7' },
    { id: 3, name: 'Research', count: 5, color: '#22c55e' },
    { id: 4, name: 'Marketing', count: 3, color: '#fb923c' },
  ];

  function useChromeStorage(keys, defaults) {
    const [state, setState] = useState(defaults);

    useEffect(() => {
      if (typeof chrome === 'undefined' || !chrome.storage) return;
      chrome.storage.local.get(keys, (result) => {
        setState({ ...defaults, ...result });
      });
    }, []);

    const set = (patch) => {
      const next = { ...state, ...patch };
      setState(next);
      if (typeof chrome !== 'undefined' && chrome.storage) {
        chrome.storage.local.set(patch);
      }
    };

    return [state, set];
  }

  function getDomain(url) {
    try { return new URL(url).hostname.replace('www.', ''); } catch { return url; }
  }

  function Button(props) {
    const { variant = 'primary', size = 'sm', className = '', ...rest } = props;
    const cls = ['btn', `btn-${variant}`, size === 'sm' ? 'btn-sm' : '', className].join(' ').trim();
    return createElement('button', { ...rest, className: cls });
  }

  function Input(props) {
    return createElement('input', { ...props, className: ['input', props.className || ''].join(' ').trim() });
  }

  function Card(props) {
    return createElement('div', { ...props, className: ['card', props.className || ''].join(' ').trim() });
  }

  function PopupApp() {
    const [ui, setUI] = useState({ 
      isOpen: true, 
      isClipping: false, 
      isClipped: false, 
      activeTab: 'clip', // 'clip', 'clips', 'settings'
      showSettings: false 
    });
    const [form, setForm] = useState({ search: '', selectedCollection: null });
    const [page, setPage] = useState({ url: '', title: '' });
    const [clips, setClips] = useState([]);
    const [filteredClips, setFilteredClips] = useState([]);

    const [store, setStore] = useChromeStorage(['clips', 'gleanConfig'], { clips: [], gleanConfig: {} });

    useEffect(() => {
      if (!chrome?.tabs?.query) return;
      try {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
          const t = tabs && tabs[0];
          setPage({ url: t?.url || '', title: t?.title || '' });
        });
      } catch (e) {}
    }, []);

    useEffect(() => {
      setClips(store.clips || []);
      setFilteredClips(store.clips || []);
    }, [store.clips]);

    function formatDate(timestamp) {
      const date = new Date(timestamp);
      const now = new Date();
      const diffMs = now - date;
      const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
      if (diffHours < 1) return 'Just now';
      if (diffHours < 24) return `${diffHours}h ago`;
      return date.toLocaleDateString();
    }

    const mockCollections = [
      { id: 1, name: 'Development', count: 12, color: '#3b82f6' },
      { id: 2, name: 'Design', count: 8, color: '#a855f7' },
      { id: 3, name: 'Research', count: 5, color: '#22c55e' },
      { id: 4, name: 'Marketing', count: 3, color: '#fb923c' },
    ];

    const filtered = mockCollections.filter((c) => c.name.toLowerCase().includes((form.search || '').toLowerCase()));

    async function handleClip() {
      if (!form.selectedCollection) return;
      setUI((s) => ({ ...s, isClipping: true }));

      try {
        const [{ id: tabId }] = await chrome.tabs.query({ active: true, currentWindow: true });
        const result = await chrome.scripting.executeScript({
          target: { tabId },
          func: () => window.getSelection()?.toString() || '',
        });
        const selectedText = (result && result[0] && result[0].result) || '';

        await chrome.runtime.sendMessage({
          action: 'saveClip',
          data: {
            url: page.url,
            title: page.title,
            selectedText,
            domain: getDomain(page.url),
            timestamp: Date.now(),
          },
        });

        setUI((s) => ({ ...s, isClipping: false, isClipped: true }));
        setTimeout(() => window.close(), 1200);
      } catch (e) {
        console.error('Failed to clip:', e);
        setUI((s) => ({ ...s, isClipping: false }));
      }
    }

    if (ui.activeTab === 'clip') {
      return createElement(
        'div',
        { style: { width: 400, minHeight: 500 } },
        // Header with tabs
        createElement(
          'div',
          { className: 'flex items-center justify-between p-4 border-b border-border bg-primary', style: { color: 'white' } },
          createElement(
            'div',
            { className: 'flex items-center gap-2' },
            createElement('div', { style: { fontSize: '18px' } }, '📎'),
            createElement('h2', { className: 'font-medium' }, 'Glean Clipper'),
          ),
          createElement(
            'div',
            { className: 'flex items-center gap-1' },
            createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => setUI(u => ({ ...u, activeTab: 'clips' })), style: { color: 'white', fontSize: '12px' } }, 'Clips'),
            createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => setUI(u => ({ ...u, activeTab: 'settings' })), style: { color: 'white', fontSize: '12px' } }, '⚙️'),
            createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => window.close(), style: { color: 'white' } }, '✕'),
          ),
        ),
        // Current page info
        createElement(
          'div',
          { className: 'p-4 border-b border-border bg-muted/20' },
          createElement(
            'div',
            { className: 'flex items-start gap-3' },
            createElement('div', { className: 'w-8 h-8 rounded bg-accent flex items-center justify-center shrink-0 mt-0.5' },
              createElement('div', { className: 'w-4 h-4 rounded', style: { background: '#3b82f6', opacity: 0.2 } }),
            ),
            createElement(
              'div',
              { className: 'flex-1 min-w-0' },
              createElement('h3', { className: 'text-sm font-medium text-foreground line-clamp-2 leading-tight' }, page.title || 'Current page'),
              createElement('p', { className: 'text-xs text-muted-foreground mt-1 truncate' }, getDomain(page.url)),
            ),
          ),
        ),
        // Collections selection
        createElement(
          'div',
          { className: 'p-4' },
          createElement(
            'div',
            { className: 'flex items-center justify-between mb-3' },
            createElement('label', { className: 'text-sm font-medium text-foreground' }, 'Select Collection'),
            createElement(Button, { variant: 'ghost', size: 'sm', className: 'h-6 text-xs' }, '+ New'),
          ),
          createElement(
            'div',
            { className: 'relative mb-3' },
            createElement(Input, {
              placeholder: 'Search collections...',
              value: form.search,
              onChange: (e) => setForm((f) => ({ ...f, search: e.target.value })),
              className: 'h-8 text-sm',
            }),
          ),
          createElement(
            'div',
            { className: 'space-y-2', style: { maxHeight: 180, overflowY: 'auto' } },
            filtered.map((c) =>
              createElement(
                'div',
                {
                  key: c.id,
                  className: `p-3 rounded-lg border cursor-pointer transition-all ${form.selectedCollection === c.id ? 'border-primary bg-primary/5' : 'border-border'} hover:bg-accent/50`,
                  onClick: () => setForm((f) => ({ ...f, selectedCollection: c.id })),
                },
                createElement(
                  'div',
                  { className: 'flex items-center justify-between' },
                  createElement(
                    'div',
                    { className: 'flex items-center gap-3' },
                    createElement('div', { style: { width: 12, height: 12, borderRadius: 9999, background: c.color } }),
                    createElement(
                      'div',
                      null,
                      createElement('p', { className: 'text-sm font-medium text-foreground' }, c.name),
                      createElement('p', { className: 'text-xs text-muted-foreground' }, `${c.count} links`),
                    ),
                  ),
                  form.selectedCollection === c.id ? createElement('span', { className: 'text-primary' }, '✓') : null,
                ),
              ),
            ),
          ),
        ),
        // Actions
        createElement(
          'div',
          { className: 'p-4 border-t border-border bg-muted/10' },
          createElement(
            'div',
            { className: 'flex gap-2' },
            createElement(Button, { variant: 'outline', size: 'sm', className: 'flex-1 h-9', onClick: () => window.close(), disabled: ui.isClipping }, 'Cancel'),
            createElement(Button, { size: 'sm', className: 'flex-1 h-9', onClick: handleClip, disabled: !form.selectedCollection || ui.isClipping }, 
              ui.isClipping ? createElement('div', { className: 'flex items-center gap-2' }, createElement('div', { className: 'spinner' }), 'Clipping...') : 
              ui.isClipped ? createElement('div', { className: 'flex items-center gap-2' }, '✓', 'Clipped!') : 
              'Clip Link'
            ),
          ),
        ),
      );
    }
    
    if (ui.activeTab === 'clips') {
      return createElement(
        'div',
        { style: { width: 400, height: 500 } },
        // Header
        createElement(
          'div',
          { className: 'flex items-center justify-between p-4 border-b border-border bg-primary', style: { color: 'white' } },
          createElement(
            'div',
            { className: 'flex items-center gap-2' },
            createElement('div', { style: { fontSize: '18px' } }, '📋'),
            createElement('div', null,
              createElement('h2', { className: 'font-medium' }, 'Your Clips'),
              createElement('div', { style: { fontSize: '12px', opacity: 0.8 } }, `${clips.length} clips saved`),
            ),
          ),
          createElement(
            'div',
            { className: 'flex items-center gap-1' },
            createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => setUI(u => ({ ...u, activeTab: 'clip' })), style: { color: 'white', fontSize: '12px' } }, 'Clip'),
            createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => setUI(u => ({ ...u, activeTab: 'settings' })), style: { color: 'white', fontSize: '12px' } }, '⚙️'),
            createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => window.close(), style: { color: 'white' } }, '✕'),
          ),
        ),
        // Search
        createElement(
          'div',
          { className: 'p-3 bg-white border-b border-border' },
          createElement(Input, {
            placeholder: 'Search your clips...',
            className: 'h-8 text-sm',
          }),
        ),
        // Clips list
        createElement(
          'div',
          { style: { height: 400, overflowY: 'auto' } },
          clips.length === 0 ? 
            createElement(
              'div',
              { style: { textAlign: 'center', padding: '40px 20px', color: '#6b7280' } },
              createElement('div', { style: { fontSize: '48px', marginBottom: '16px' } }, '📋'),
              createElement('div', { style: { fontWeight: '500' } }, 'No clips yet'),
              createElement('div', { style: { fontSize: '12px', marginTop: '4px' } }, 'Select text on any webpage and click the clip button'),
            ) :
            clips.map((clip) =>
              createElement(
                'div',
                {
                  key: clip.id,
                  className: 'p-3 border-b border-border cursor-pointer hover:bg-muted/50 transition-all',
                  onClick: () => chrome.tabs.create({ url: clip.url }),
                },
                createElement(
                  'div',
                  { className: 'flex justify-between items-start mb-2' },
                  createElement('div', { className: 'text-sm font-medium text-foreground line-clamp-1', style: { flex: 1 } }, clip.title),
                  createElement('div', { className: 'text-xs px-2 py-1 bg-muted rounded', style: { whiteSpace: 'nowrap', marginLeft: '8px' } }, getDomain(clip.url)),
                ),
                createElement('div', { className: 'text-sm text-muted-foreground line-clamp-2 mb-2' }, clip.selectedText),
                createElement(
                  'div',
                  { className: 'flex justify-between items-center' },
                  createElement(
                    'div',
                    { className: 'flex gap-2' },
                    clip.synced ? createElement('span', { className: 'status-synced' }, '✓ Synced') : null,
                    clip.syncError ? createElement('span', { className: 'status-failed' }, '✗ Failed') : null,
                  ),
                  createElement('div', { className: 'text-xs text-muted-foreground' }, formatDate(clip.timestamp)),
                ),
              ),
            ),
        ),
      );
    }

    if (ui.activeTab === 'settings') {
      return createElement(
        'div',
        { style: { width: 400, height: 500 } },
        // Header
        createElement(
          'div',
          { className: 'flex items-center justify-between p-4 border-b border-border bg-primary', style: { color: 'white' } },
          createElement(
            'div',
            { className: 'flex items-center gap-2' },
            createElement('div', { style: { fontSize: '18px' } }, '⚙️'),
            createElement('h2', { className: 'font-medium' }, 'Settings'),
          ),
          createElement(
            'div',
            { className: 'flex items-center gap-1' },
            createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => setUI(u => ({ ...u, activeTab: 'clip' })), style: { color: 'white', fontSize: '12px' } }, 'Clip'),
            createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => setUI(u => ({ ...u, activeTab: 'clips' })), style: { color: 'white', fontSize: '12px' } }, 'Clips'),
            createElement(Button, { variant: 'ghost', size: 'sm', onClick: () => window.close(), style: { color: 'white' } }, '✕'),
          ),
        ),
        // Settings content
        createElement(
          'div',
          { className: 'p-4', style: { height: 456, overflowY: 'auto' } },
          createElement('div', { className: 'text-sm text-muted-foreground mb-4' }, 'Configure your Glean integration'),
          createElement(
            'div',
            { style: { marginBottom: '16px' } },
            createElement('label', { className: 'text-sm font-medium text-foreground', style: { display: 'block', marginBottom: '4px' } }, 'Glean Domain'),
            createElement(Input, { placeholder: 'linkedin-be.glean.com', className: 'h-9' }),
          ),
          createElement(
            'div',
            { style: { marginBottom: '16px' } },
            createElement('label', { className: 'text-sm font-medium text-foreground', style: { display: 'block', marginBottom: '4px' } }, 'API Token'),
            createElement(Input, { type: 'password', placeholder: 'Your Glean API token', className: 'h-9' }),
            createElement('div', { className: 'text-xs text-muted-foreground', style: { marginTop: '4px' } }, 'Get this from Glean Admin → API Tokens'),
          ),
          createElement(
            'div',
            { style: { marginBottom: '16px' } },
            createElement('label', { className: 'text-sm font-medium text-foreground', style: { display: 'block', marginBottom: '4px' } }, 'Collection ID'),
            createElement(Input, { placeholder: 'e.g., 14191', className: 'h-9' }),
            createElement('div', { className: 'text-xs text-muted-foreground', style: { marginTop: '4px' } }, 'Find this in your collection URL'),
          ),
          createElement(
            'div',
            { className: 'flex items-center gap-2', style: { marginBottom: '16px' } },
            createElement('input', { type: 'checkbox', id: 'sync-enabled' }),
            createElement('label', { htmlFor: 'sync-enabled', className: 'text-sm' }, 'Sync clips to Glean'),
          ),
          createElement(
            'div',
            { className: 'flex gap-2' },
            createElement(Button, { size: 'sm', className: 'flex-1' }, 'Save Settings'),
            createElement(Button, { variant: 'outline', size: 'sm' }, 'Test Connection'),
          ),
        ),
      );
    }
  }

  const root = createRoot(document.getElementById('root'));
  root.render(createElement(PopupApp));
})();

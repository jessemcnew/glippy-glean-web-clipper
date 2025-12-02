interface GleanConfig {
  baseUrl: string
  apiKey?: string
  domain?: string
}

interface GleanSearchResponse {
  results: GleanSearchResult[]
  facets: any[]
  query: string
  total: number
}

interface GleanSearchResult {
  id: string
  title: string
  snippet: string
  url: string
  documentType: string
  author?: {
    name: string
    email: string
  }
  createdAt?: string
  updatedAt?: string
  score: number
}

export class GleanAPI {
  private config: GleanConfig

  constructor(config: GleanConfig) {
    this.config = config
  }

  async search(query: string, options: {
    filters?: string[]
    limit?: number
    offset?: number
  } = {}): Promise<GleanSearchResponse> {
    const { filters = [], limit = 10, offset = 0 } = options

    // For remote MCP server endpoint
    if (this.config.baseUrl.includes('/mcp')) {
      return this.searchViaMCP(query, options)
    }

    // For direct Glean API
    return this.searchViaDirect(query, options)
  }

  private async searchViaMCP(query: string, options: any): Promise<GleanSearchResponse> {
    try {
      const response = await fetch(`${this.config.baseUrl}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(this.config.apiKey && { 'Authorization': `Bearer ${this.config.apiKey}` })
        },
        body: JSON.stringify({
          method: 'search',
          params: {
            query,
            ...options
          }
        })
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeResults(data)
    } catch (error) {
      console.error('MCP search failed:', error)
      throw error
    }
  }

  private async searchViaDirect(query: string, options: any): Promise<GleanSearchResponse> {
    try {
      const searchParams = new URLSearchParams({
        query,
        pageSize: options.limit?.toString() || '10',
        pageToken: options.offset?.toString() || '0'
      })

      const response = await fetch(`${this.config.baseUrl}/api/index/v1/search?${searchParams}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${this.config.apiKey}`,
          'Content-Type': 'application/json'
        }
      })

      if (!response.ok) {
        throw new Error(`Search failed: ${response.statusText}`)
      }

      const data = await response.json()
      return this.normalizeResults(data)
    } catch (error) {
      console.error('Direct API search failed:', error)
      throw error
    }
  }

  private normalizeResults(data: any): GleanSearchResponse {
    // Normalize different response formats to our standard interface
    const results = (data.results || data.items || []).map((item: any) => ({
      id: item.id || item.documentId,
      title: item.title,
      snippet: item.snippet || item.summary || '',
      url: item.url || item.viewUrl,
      documentType: item.documentType || item.type || 'document',
      author: item.author ? {
        name: item.author.name || item.author.displayName,
        email: item.author.email
      } : undefined,
      createdAt: item.createdAt || item.createTime,
      updatedAt: item.updatedAt || item.updateTime,
      score: item.score || item.relevanceScore || 0
    }))

    return {
      results,
      facets: data.facets || [],
      query: data.query || '',
      total: data.total || data.totalCount || results.length
    }
  }
}

// Factory function for easy setup
export function createGleanAPI(domain: string, apiKey?: string): GleanAPI {
  // Try remote MCP server first (simpler setup)
  const mcpUrl = `https://${domain.replace('.glean.com', '')}-be.glean.com/mcp`
  
  return new GleanAPI({
    baseUrl: mcpUrl,
    domain,
    apiKey
  })
}

// Usage example:
// const glean = createGleanAPI('yourcompany.glean.com', 'optional-api-key')
// const results = await glean.search('product roadmap Q4')
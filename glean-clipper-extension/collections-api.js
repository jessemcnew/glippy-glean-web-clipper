// Collections API service for Glean integration
// Handles all Collections-related API calls to Glean
// Reference: https://developers.glean.com/api/client-api/collections/overview

// Import unified fetch helpers
import {
  fetchJSON,
  createCollectionsAPIHeaders,
  normalizeDomain,
} from './modules/apiFetch.js';

class GleanCollectionsAPI {
  constructor(config) {
    this.config = config;
    this.baseUrl = normalizeDomain(config.domain);
  }

  async makeRequest(endpoint, method = 'POST', data = null) {
    console.log('🌐 Collections API makeRequest called:', { endpoint, method, hasData: !!data });

    if (!this.config.enabled || !this.config.domain || !this.config.apiToken) {
      const error = new Error('Collections API not properly configured');
      console.log('❌ Collections API config check failed:', {
        enabled: this.config.enabled,
        domain: this.config.domain,
        hasApiToken: !!this.config.apiToken,
      });
      throw error;
    }

    const url = `${this.baseUrl}/rest/api/v1/${endpoint}`;

    // Use unified header creation with OAuth auth type
    const headers = createCollectionsAPIHeaders(this.config.apiToken);

    console.log(`📡 Collections API Request: ${method} ${url}`);
    console.log('📦 Request data:', data);

    try {
      const result = await fetchJSON(url, {
        method,
        headers,
        body: data ? JSON.stringify(data) : null,
        mode: 'cors',
        credentials: 'omit',
      });

      console.log('✅ Parsed API response:', result);
      return result;
    } catch (error) {
      console.error('❌ Collections API Error:', error);
      throw error;
    }
  }

  // List all existing Collections
  async listCollections(filters = {}) {
    return await this.makeRequest('listcollections', 'POST', filters);
  }

  // Create a new Collection
  async createCollection(collectionData) {
    const payload = {
      name: collectionData.name,
      description: collectionData.description || '',
      visibility: collectionData.visibility || 'PUBLIC', // PUBLIC, PRIVATE
      isPublic: collectionData.isPublic !== false, // Default to public
      ...collectionData,
    };

    return await this.makeRequest('createcollection', 'POST', payload);
  }

  // Get details of a specific Collection
  async getCollection(collectionId) {
    return await this.makeRequest('getcollection', 'POST', {
      collectionId: collectionId,
    });
  }

  // Update an existing Collection
  async editCollection(collectionId, updates) {
    const payload = {
      collectionId: collectionId,
      ...updates,
    };

    return await this.makeRequest('editcollection', 'POST', payload);
  }

  // Delete a Collection
  async deleteCollection(collectionId) {
    return await this.makeRequest('deletecollection', 'POST', {
      collectionId: collectionId,
    });
  }

  // Add items to a Collection
  async addItemsToCollection(collectionId, items) {
    // items should be an array of objects with:
    // - documentId (optional) - for existing Glean documents
    // - url (optional) - for external URLs
    // - description (optional)
    const payload = {
      collectionId: collectionId,
      items: items.map(item => ({
        documentId: item.documentId,
        url: item.url,
        description: item.description || '',
      })),
    };

    return await this.makeRequest('addcollectionitems', 'POST', payload);
  }

  // Remove an item from a Collection
  async removeItemFromCollection(collectionId, itemId) {
    return await this.makeRequest('deletecollectionitem', 'POST', {
      collectionId: collectionId,
      itemId: itemId,
    });
  }

  // Update an item in a Collection
  async editCollectionItem(collectionId, itemId, updates) {
    const payload = {
      collectionId: collectionId,
      itemId: itemId,
      ...updates,
    };

    return await this.makeRequest('editcollectionitem', 'POST', payload);
  }

  // Helper: Add a web clip to a collection
  async addClipToCollection(collectionId, clip) {
    const item = {
      url: clip.url,
      description: `${clip.title}\n\n${clip.selectedText}`,
    };

    // If the clip was indexed as a document, use documentId instead
    if (clip.gleanDocumentId) {
      item.documentId = clip.gleanDocumentId;
      delete item.url;
    }

    return await this.addItemsToCollection(collectionId, [item]);
  }

  // Helper: Create a collection for clips with a specific tag
  async createCollectionFromTag(tag, clips) {
    const collection = await this.createCollection({
      name: `Web Clips: ${tag}`,
      description: `Collection of web clips tagged with "${tag}"`,
      isPublic: false,
    });

    // Add all clips with this tag to the collection
    const items = clips
      .filter(clip => clip.tags && clip.tags.includes(tag))
      .map(clip => ({
        url: clip.url,
        description: `${clip.title}\n\n${clip.selectedText}`,
      }));

    if (items.length > 0) {
      await this.addItemsToCollection(collection.id, items);
    }

    return collection;
  }
}

// Export for use in other parts of the extension
export { GleanCollectionsAPI };

// Also export to window for non-module contexts
if (typeof window !== 'undefined') {
  window.GleanCollectionsAPI = GleanCollectionsAPI;
}

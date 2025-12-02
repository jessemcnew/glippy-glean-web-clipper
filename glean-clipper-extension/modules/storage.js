// Storage Module
// Handles local storage operations and Glean API synchronization

/**
 * Saves a clip to local storage and attempts to sync with Glean APIs
 * @param {Object} clipData - The clip data to save
 * @param {Function} collectionsSync - Collections API sync function
 * @param {Function} indexingSync - Indexing API sync function
 * @returns {Promise<void>}
 */
async function saveClip(clipData, collectionsSync, indexingSync) {
  try {
    // Generate unique ID if not provided
    if (!clipData.id) {
      clipData.id = 'clip-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9);
    }

    // Add metadata
    clipData.timestamp = clipData.timestamp || Date.now();
    clipData.syncStatus = 'pending';
    clipData.syncAttempts = 0;

    // Get current clips from storage
    const result = await chrome.storage.local.get(['clips']);
    const clips = result.clips || [];

    // Add new clip to the beginning of the array
    clips.unshift(clipData);

    // Keep only the most recent 1000 clips to prevent storage bloat
    if (clips.length > 1000) {
      clips.splice(1000);
    }

    // Save to local storage first
    await chrome.storage.local.set({ clips });

    // Attempt to sync with Glean APIs
    const syncResults = [];
    let hasError = false;

    // Try Collections API if available
    if (collectionsSync) {
      try {
        const config = await getGleanConfig();
        if (config.enabled && config.apiToken && config.collectionId) {
          console.log('Attempting to sync to Glean Collections:', {
            clipId: clipData.id,
            title: clipData.title?.substring(0, 50) + '...',
            collectionId: config.collectionId,
            collectionName: config.collectionName,
          });

          // If collection name is not in config, try to get it from collections list
          let collectionName = config.collectionName || '';
          if (!collectionName && config.collectionId) {
            // Try to fetch collections to get the name
            try {
              const { fetchGleanCollections } = await import('./gleanApi.js');
              const collectionsResult = await fetchGleanCollections();
              if (collectionsResult.success && collectionsResult.collections) {
                const collection = collectionsResult.collections.find(c => String(c.id) === String(config.collectionId));
                if (collection) {
                  collectionName = collection.name || '';
                  console.log('Found collection name from API:', collectionName);
                }
              }
            } catch (e) {
              console.debug('Could not fetch collection name:', e);
            }
          }

          await collectionsSync(clipData, config);
          console.log('SUCCESS: Clip added to Glean collection successfully');
          syncResults.push('Collections API');
          
          // Save collection info to clip
          clipData.collectionId = config.collectionId;
          clipData.collectionName = collectionName;
          
          // Update the clip in storage immediately with collection info
          const currentResult = await chrome.storage.local.get(['clips']);
          const currentClips = currentResult.clips || [];
          const clipIndex = currentClips.findIndex(c => c.id === clipData.id);
          if (clipIndex !== -1) {
            currentClips[clipIndex].collectionId = clipData.collectionId;
            currentClips[clipIndex].collectionName = clipData.collectionName;
            await chrome.storage.local.set({ clips: currentClips });
          }
        }
      } catch (error) {
        console.error('Collections API failed:', error.message);
        hasError = true;
      }
    }

    // Try Indexing API if available
    if (indexingSync) {
      try {
        const config = await getGleanConfig();
        if (config.indexingEnabled && config.indexingToken) {
          console.log('Attempting to sync to Glean Indexing API:', {
            clipId: clipData.id,
            title: clipData.title?.substring(0, 50) + '...',
          });

          await indexingSync(clipData, config);
          console.log('SUCCESS: Clip indexed to Glean successfully');
          syncResults.push('Indexing API');
        }
      } catch (error) {
        console.error('Indexing API failed:', error.message);
        hasError = true;
      }
    }

    // Update sync status
    if (syncResults.length > 0) {
      clipData.syncStatus = 'synced';
      console.log(`OVERALL SUCCESS: Synced via ${syncResults.join(', ')}`);
    } else {
      console.error('ERROR: All sync methods failed, saving locally only');
      clipData.syncStatus = hasError ? 'failed' : 'local';
    }

    // Update the clip in storage with final sync status
    const updatedResult = await chrome.storage.local.get(['clips']);
    const updatedClips = updatedResult.clips || [];
    const clipIndex = updatedClips.findIndex(c => c.id === clipData.id);
    if (clipIndex !== -1) {
      updatedClips[clipIndex] = clipData;
      await chrome.storage.local.set({ clips: updatedClips });
    }
  } catch (error) {
    console.error('Error saving clip:', error);
    throw error;
  }
}

/**
 * Retrieves all clips from local storage
 * @returns {Promise<Array>} Array of clips
 */
async function getClips() {
  try {
    const result = await chrome.storage.local.get(['clips']);
    return result.clips || [];
  } catch (error) {
    console.error('Error retrieving clips:', error);
    return [];
  }
}

/**
 * Deletes a clip from local storage
 * @param {string} clipId - The ID of the clip to delete
 * @returns {Promise<boolean>} Success status
 */
async function deleteClip(clipId) {
  try {
    const result = await chrome.storage.local.get(['clips']);
    const clips = result.clips || [];
    const filteredClips = clips.filter(clip => clip.id !== clipId);

    await chrome.storage.local.set({ clips: filteredClips });
    return true;
  } catch (error) {
    console.error('Error deleting clip:', error);
    return false;
  }
}

/**
 * Updates a clip in local storage
 * @param {string} clipId - The ID of the clip to update
 * @param {Object} updates - The updates to apply
 * @returns {Promise<boolean>} Success status
 */
async function updateClip(clipId, updates) {
  try {
    const result = await chrome.storage.local.get(['clips']);
    const clips = result.clips || [];
    const clipIndex = clips.findIndex(clip => clip.id === clipId);

    if (clipIndex === -1) {
      return false;
    }

    clips[clipIndex] = { ...clips[clipIndex], ...updates };
    await chrome.storage.local.set({ clips });
    return true;
  } catch (error) {
    console.error('Error updating clip:', error);
    return false;
  }
}

/**
 * Clears all clips from local storage
 * @returns {Promise<boolean>} Success status
 */
async function clearAllClips() {
  try {
    await chrome.storage.local.set({ clips: [] });
    return true;
  } catch (error) {
    console.error('Error clearing clips:', error);
    return false;
  }
}

/**
 * Gets Glean configuration from Chrome storage
 * Note: Changed from chrome.storage.sync to chrome.storage.local for consistency with popup.js
 * @returns {Promise<Object>} Glean configuration
 */
async function getGleanConfig() {
  return new Promise(resolve => {
    // Use chrome.storage.local to match popup.js usage
    chrome.storage.local.get(['gleanConfig'], result => {
      const config = result.gleanConfig || {};
      resolve({
        enabled: config.enabled || false,
        domain: config.domain || 'app.glean.com', // Pre-configured default domain
        apiToken: config.apiToken || config.clientToken || '',
        clientToken: config.clientToken || config.apiToken || '',
        collectionId: config.collectionId || '',
        indexingEnabled: config.indexingEnabled || false,
        indexingToken: config.indexingToken || '',
        datasource: config.datasource || 'WEBCLIPPER',
      });
    });
  });
}

/**
 * Retries syncing a failed clip to Glean
 * @param {string} clipId - The ID of the clip to retry
 * @param {Function} collectionsSync - Collections API sync function
 * @param {Function} indexingSync - Indexing API sync function
 * @returns {Promise<boolean>} Success status
 */
async function retryClipSync(clipId, collectionsSync, indexingSync) {
  try {
    const clips = await getClips();
    const clip = clips.find(c => c.id === clipId);

    if (!clip) {
      throw new Error('Clip not found');
    }

    // Increment retry attempts
    clip.syncAttempts = (clip.syncAttempts || 0) + 1;

    // Try to sync again
    await saveClip(clip, collectionsSync, indexingSync);

    console.log('Retry sync successful for clip:', clipId);
    return true;
  } catch (error) {
    console.error('Retry sync failed for clip:', clipId, error);
    return false;
  }
}

 // Export functions for use in other modules
 export {
   saveClip,
   getClips,
   deleteClip,
   updateClip,
   clearAllClips,
   getGleanConfig,
   retryClipSync,
 };
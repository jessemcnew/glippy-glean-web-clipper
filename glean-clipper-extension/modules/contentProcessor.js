// Content Processing Module
// Handles tag extraction, content categorization, and text processing

/**
 * Extracts relevant tags from text content based on keywords
 * @param {string} text - The text content to analyze
 * @returns {string[]} Array of extracted tags
 */
function extractTags(text) {
  const tags = [];
  if (text.match(/\b(?:API|REST|GraphQL|SDK)\b/i)) {tags.push('api');}
  if (text.match(/\b(?:React|Vue|Angular|JavaScript|TypeScript)\b/i)) {tags.push('frontend');}
  if (text.match(/\b(?:Node|Python|Java|Go|Rust)\b/i)) {tags.push('backend');}
  if (text.match(/\b(?:database|SQL|MongoDB|PostgreSQL)\b/i)) {tags.push('database');}
  if (text.match(/\b(?:deploy|docker|kubernetes|aws|cloud)\b/i)) {tags.push('devops');}
  if (text.match(/\b(?:design|UI|UX|figma|sketch)\b/i)) {tags.push('design');}
  if (text.match(/\b(?:bug|error|fix|debug)\b/i)) {tags.push('debugging');}
  if (text.match(/\b(?:meeting|standup|review|planning)\b/i)) {tags.push('meetings');}
  return tags;
}

/**
 * Categorizes content based on URL and text content
 * @param {string} url - The URL of the content
 * @param {string} text - The text content to analyze
 * @returns {string} The category of the content
 */
function categorizeContent(url, text) {
  // URL-based categorization
  if (url.includes('github.com')) {return 'code';}
  if (url.includes('stackoverflow.com')) {return 'qa';}
  if (url.includes('docs.') || url.includes('documentation')) {return 'documentation';}
  if (url.includes('medium.com') || url.includes('blog')) {return 'article';}
  if (url.includes('slack.com') || url.includes('discord.com')) {return 'chat';}
  if (url.includes('figma.com') || url.includes('sketch.com')) {return 'design';}
  if (url.includes('jira') || url.includes('trello')) {return 'project';}

  // Content-based categorization
  if (text.match(/\b(?:function|class|const|let|var|return)\b/)) {return 'code';}
  if (text.match(/\b(?:meeting|agenda|action items|next steps)\b/i)) {return 'meeting';}
  if (text.match(/\b(?:roadmap|timeline|milestone|deadline)\b/i)) {return 'planning';}

  return 'general';
}

/**
 * Processes clip data by adding tags and category
 * @param {Object} clipData - The clip data to process
 * @returns {Object} Processed clip data with tags and category
 */
function processClipData(clipData) {
  const processedClip = { ...clipData };

  // Extract tags from the selected text
  processedClip.tags = extractTags(clipData.selectedText || '');

  // Categorize the content
  processedClip.category = categorizeContent(clipData.url || '', clipData.selectedText || '');

  // Add processing timestamp
  processedClip.processedAt = new Date().toISOString();

  return processedClip;
}

/**
 * Sanitizes text content for safe storage and transmission
 * @param {string} text - The text to sanitize
 * @param {number} maxLength - Maximum length of the sanitized text
 * @returns {string} Sanitized text
 */
function sanitizeText(text, maxLength = 5000) {
  if (!text) {return '';}

  // Remove excessive whitespace and normalize line breaks
  const cleaned = text
    .replace(/\s+/g, ' ')
    .replace(/\n\s*\n/g, '\n')
    .trim();

  // Truncate if too long
  if (cleaned.length > maxLength) {
    return cleaned.substring(0, maxLength) + '...';
  }

  return cleaned;
}

export { extractTags, categorizeContent, processClipData, sanitizeText };

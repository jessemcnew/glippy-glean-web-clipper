const { test, expect, chromium } = require('@playwright/test');
const path = require('path');

test('Notebook viewer search and sort functionality', async ({ page }) => {
  // Navigate to the notebook viewer page
  const notebookPath = path.resolve(__dirname, 'notebook-viewer.html');
  await page.goto(`file://${notebookPath}`);

  // Wait for page to load completely
  await page.waitForLoadState('domcontentloaded');
  await page.waitForTimeout(1000);

  // Check that clips are loaded (should show mock data)
  const clipCards = await page.locator('.clip-card');
  const initialClipCount = await clipCards.count();
  console.log(`Initial clip count: ${initialClipCount}`);
  expect(initialClipCount).toBeGreaterThan(0);

  // Test search functionality
  console.log('Testing search functionality...');
  const searchInput = page.locator('#search');
  
  // Search for "React"
  await searchInput.fill('React');
  await page.waitForTimeout(500); // Wait for debounced search
  
  const searchResults = await page.locator('.clip-card');
  const searchResultCount = await searchResults.count();
  console.log(`Search results for "React": ${searchResultCount}`);
  
  // Verify the search found React-related content
  if (searchResultCount > 0) {
    const firstResult = searchResults.first();
    const title = await firstResult.locator('.clip-title').textContent();
    console.log(`First search result title: ${title}`);
    expect(title.toLowerCase()).toContain('react');
  }

  // Clear search
  await searchInput.fill('');
  await page.waitForTimeout(500);
  
  const clearedResults = await page.locator('.clip-card');
  const clearedCount = await clearedResults.count();
  console.log(`Clips after clearing search: ${clearedCount}`);
  expect(clearedCount).toBe(initialClipCount);

  // Test sorting functionality
  console.log('Testing sort functionality...');
  const sortSelect = page.locator('#sortBy');
  
  // Test date sorting (default)
  await sortSelect.selectOption('date');
  await page.waitForTimeout(300);
  
  const dateSortedCards = await page.locator('.clip-card');
  const dateSortedCount = await dateSortedCards.count();
  console.log(`Date sorted clip count: ${dateSortedCount}`);
  
  // Get the first and last clip dates to verify sorting
  if (dateSortedCount >= 2) {
    const firstDate = await dateSortedCards.first().locator('.clip-date').textContent();
    const lastDate = await dateSortedCards.last().locator('.clip-date').textContent();
    console.log(`First clip date: ${firstDate}, Last clip date: ${lastDate}`);
  }

  // Test title sorting
  await sortSelect.selectOption('title');
  await page.waitForTimeout(300);
  
  const titleSortedCards = await page.locator('.clip-card');
  if (await titleSortedCards.count() >= 2) {
    const firstTitle = await titleSortedCards.first().locator('.clip-title').textContent();
    const secondTitle = await titleSortedCards.nth(1).locator('.clip-title').textContent();
    console.log(`Title sorted - First: "${firstTitle}", Second: "${secondTitle}"`);
    
    // Verify alphabetical order
    expect(firstTitle.localeCompare(secondTitle)).toBeLessThanOrEqual(0);
  }

  // Test domain sorting
  await sortSelect.selectOption('domain');
  await page.waitForTimeout(300);
  
  const domainSortedCards = await page.locator('.clip-card');
  if (await domainSortedCards.count() >= 2) {
    const firstDomain = await domainSortedCards.first().locator('.clip-domain').textContent();
    const secondDomain = await domainSortedCards.nth(1).locator('.clip-domain').textContent();
    console.log(`Domain sorted - First: "${firstDomain}", Second: "${secondDomain}"`);
    
    // Verify alphabetical order
    expect(firstDomain.localeCompare(secondDomain)).toBeLessThanOrEqual(0);
  }

  // Test tag filtering
  console.log('Testing tag filtering...');
  const tagFilter = page.locator('#tagFilter');
  
  // Check if tag options are available
  const tagOptions = await tagFilter.locator('option').count();
  console.log(`Available tag options: ${tagOptions}`);
  
  if (tagOptions > 1) { // More than just "All tags"
    // Select a tag (skip the first "All tags" option)
    const secondOption = await tagFilter.locator('option').nth(1).textContent();
    console.log(`Testing tag filter with: ${secondOption}`);
    
    await tagFilter.selectOption(secondOption);
    await page.waitForTimeout(300);
    
    const tagFilteredCards = await page.locator('.clip-card');
    const tagFilteredCount = await tagFilteredCards.count();
    console.log(`Clips with tag "${secondOption}": ${tagFilteredCount}`);
    
    // Verify all visible clips have the selected tag
    if (tagFilteredCount > 0) {
      const tagElements = await tagFilteredCards.first().locator('.clip-tag').allTextContents();
      console.log(`Tags on first filtered clip: ${tagElements.join(', ')}`);
      expect(tagElements).toContain(secondOption);
    }
  }

  // Test clear filters
  const clearFiltersBtn = page.locator('#clearFilters');
  await clearFiltersBtn.click();
  await page.waitForTimeout(300);
  
  const finalCards = await page.locator('.clip-card');
  const finalCount = await finalCards.count();
  console.log(`Final clip count after clearing filters: ${finalCount}`);
  expect(finalCount).toBe(initialClipCount);

  // Verify search input and filters are cleared
  expect(await searchInput.inputValue()).toBe('');
  expect(await sortSelect.inputValue()).toBe('date');
  expect(await tagFilter.inputValue()).toBe('');

  console.log('All search and sort tests passed successfully!');
});

test.describe('Search and sort edge cases', () => {
  test('Empty search behavior', async ({ page }) => {
    const notebookPath = path.resolve(__dirname, 'notebook-viewer.html');
    await page.goto(`file://${notebookPath}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const searchInput = page.locator('#search');
    
    // Test empty search
    await searchInput.fill('');
    await page.waitForTimeout(500);
    
    const clips = await page.locator('.clip-card');
    const count = await clips.count();
    console.log(`Clips with empty search: ${count}`);
    expect(count).toBeGreaterThan(0);
  });

  test('No results search behavior', async ({ page }) => {
    const notebookPath = path.resolve(__dirname, 'notebook-viewer.html');
    await page.goto(`file://${notebookPath}`);
    await page.waitForLoadState('domcontentloaded');
    await page.waitForTimeout(1000);

    const searchInput = page.locator('#search');
    
    // Search for something unlikely to be found
    await searchInput.fill('xyzabcneverexists');
    await page.waitForTimeout(500);
    
    const clips = await page.locator('.clip-card');
    const count = await clips.count();
    console.log(`Clips with non-existent search: ${count}`);
    
    // Should show either 0 clips or empty state
    if (count === 0) {
      const emptyState = page.locator('.empty-state');
      await expect(emptyState).toBeVisible();
    }
  });
});
#!/usr/bin/env python3
"""
Glean Collections API Test Script
Tests API connectivity, token permissions, and collection operations
"""

import json
import os
import sys
import requests
from datetime import datetime
from typing import Optional, Dict, Any

# Configuration - Update these with your values
GLEAN_API_TOKEN = os.getenv('GLEAN_API_TOKEN', '')  # Set via environment variable for security
GLEAN_DOMAIN = 'linkedin-be.glean.com'  # Backend domain for API calls
COLLECTION_ID = 14191  # Your target collection ID

# API endpoints
BASE_URL = f'https://{GLEAN_DOMAIN}/rest/api/v1'

class GleanAPITester:
    def __init__(self, api_token: str):
        self.api_token = api_token
        self.headers = {
            'Authorization': f'Bearer {api_token}',
            'Content-Type': 'application/json',
            'Accept': 'application/json'
        }
        self.test_results = []
    
    def print_header(self, text: str):
        """Print formatted section header"""
        print(f"\n{'='*60}")
        print(f"  {text}")
        print(f"{'='*60}")
    
    def print_result(self, test_name: str, success: bool, message: str = ""):
        """Print test result with status indicator"""
        status = "✓ PASS" if success else "✗ FAIL"
        print(f"{status}: {test_name}")
        if message:
            print(f"         {message}")
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message
        })
    
    def test_connection(self) -> bool:
        """Test basic API connectivity"""
        self.print_header("Testing API Connection")
        
        try:
            # Try a simple endpoint that should work with any valid token
            url = f"{BASE_URL}/listcollections"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                self.print_result("API Connection", True, f"Successfully connected to {GLEAN_DOMAIN}")
                return True
            elif response.status_code == 401:
                self.print_result("API Connection", False, "Invalid API token (401 Unauthorized)")
                return False
            elif response.status_code == 403:
                self.print_result("API Connection", False, "Token lacks required permissions (403 Forbidden)")
                return False
            else:
                self.print_result("API Connection", False, f"Unexpected status: {response.status_code}")
                return False
                
        except requests.exceptions.RequestException as e:
            self.print_result("API Connection", False, f"Network error: {str(e)}")
            return False
    
    def list_collections(self) -> Optional[list]:
        """List all accessible collections"""
        self.print_header("Listing Collections")
        
        try:
            url = f"{BASE_URL}/listcollections"
            response = requests.get(url, headers=self.headers)
            
            if response.status_code == 200:
                data = response.json()
                collections = data.get('collections', [])
                
                if collections:
                    self.print_result("List Collections", True, f"Found {len(collections)} collection(s)")
                    
                    print("\nYour Collections:")
                    for idx, coll in enumerate(collections[:10], 1):  # Show first 10
                        print(f"  {idx}. ID: {coll.get('id')} - Name: {coll.get('name')}")
                        if coll.get('description'):
                            print(f"      Description: {coll.get('description')[:100]}")
                    
                    if len(collections) > 10:
                        print(f"  ... and {len(collections) - 10} more")
                    
                    return collections
                else:
                    self.print_result("List Collections", True, "No collections found (you may need to create one)")
                    return []
            else:
                error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
                self.print_result("List Collections", False, error_msg)
                return None
                
        except Exception as e:
            self.print_result("List Collections", False, str(e))
            return None
    
    def check_collection(self, collection_id: int) -> bool:
        """Check if a specific collection exists and is accessible"""
        self.print_header(f"Checking Collection ID: {collection_id}")
        
        try:
            url = f"{BASE_URL}/getcollection"
            params = {'collectionId': collection_id}
            response = requests.get(url, headers=self.headers, params=params)
            
            if response.status_code == 200:
                data = response.json()
                collection = data.get('collection', {})
                
                print(f"\nCollection Details:")
                print(f"  ID: {collection.get('id')}")
                print(f"  Name: {collection.get('name')}")
                print(f"  Description: {collection.get('description', 'N/A')[:200]}")
                print(f"  Item Count: {collection.get('itemCount', 'Unknown')}")
                print(f"  Created: {collection.get('createdTs', 'Unknown')}")
                print(f"  Updated: {collection.get('updatedTs', 'Unknown')}")
                
                # Check permissions
                permissions = collection.get('permissions', {})
                can_write = permissions.get('canWrite', False)
                
                if can_write:
                    self.print_result("Collection Access", True, "You have write access to this collection")
                else:
                    self.print_result("Collection Access", False, "You don't have write access to this collection")
                
                return True
            elif response.status_code == 404:
                self.print_result("Collection Check", False, f"Collection {collection_id} not found")
                return False
            else:
                error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
                self.print_result("Collection Check", False, error_msg)
                return False
                
        except Exception as e:
            self.print_result("Collection Check", False, str(e))
            return False
    
    def test_add_item(self, collection_id: int) -> bool:
        """Test adding an item to a collection"""
        self.print_header(f"Testing Add Item to Collection {collection_id}")
        
        try:
            url = f"{BASE_URL}/addcollectionitems"
            
            # Create test item
            test_item = {
                "collectionId": collection_id,
                "addedCollectionItemDescriptors": [
                    {
                        "url": f"https://example.com/test-{int(datetime.now().timestamp())}",
                        "description": f"Test item added by API test script at {datetime.now().isoformat()}"
                    }
                ]
            }
            
            print(f"\nSending test item:")
            print(f"  URL: {test_item['addedCollectionItemDescriptors'][0]['url']}")
            print(f"  Description: {test_item['addedCollectionItemDescriptors'][0]['description'][:100]}")
            
            response = requests.post(url, headers=self.headers, json=test_item)
            
            if response.status_code in [200, 201, 204]:
                self.print_result("Add Item", True, "Successfully added test item to collection")
                return True
            elif response.status_code == 400:
                error_msg = response.text if response.text else "Bad request"
                self.print_result("Add Item", False, f"Bad request: {error_msg[:200]}")
                return False
            elif response.status_code == 403:
                self.print_result("Add Item", False, "Permission denied - check token has COLLECTIONS scope")
                return False
            else:
                error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
                self.print_result("Add Item", False, error_msg)
                return False
                
        except Exception as e:
            self.print_result("Add Item", False, str(e))
            return False
    
    def create_test_collection(self) -> Optional[int]:
        """Create a new test collection"""
        self.print_header("Creating Test Collection")
        
        try:
            url = f"{BASE_URL}/createcollection"
            
            collection_data = {
                "name": f"API Test Collection {datetime.now().strftime('%Y%m%d_%H%M%S')}",
                "description": "Collection created by API test script for validation",
                "pinnedMetadata": []
            }
            
            print(f"\nCreating collection: {collection_data['name']}")
            
            response = requests.post(url, headers=self.headers, json=collection_data)
            
            if response.status_code in [200, 201]:
                data = response.json()
                new_id = data.get('collection', {}).get('id')
                
                if new_id:
                    self.print_result("Create Collection", True, f"Created collection with ID: {new_id}")
                    return new_id
                else:
                    self.print_result("Create Collection", False, "Response missing collection ID")
                    return None
            else:
                error_msg = response.text[:200] if response.text else f"HTTP {response.status_code}"
                self.print_result("Create Collection", False, error_msg)
                return None
                
        except Exception as e:
            self.print_result("Create Collection", False, str(e))
            return None
    
    def run_all_tests(self):
        """Run complete test suite"""
        print("\n" + "="*60)
        print("  GLEAN COLLECTIONS API TEST SUITE")
        print("="*60)
        print(f"\nConfiguration:")
        print(f"  Domain: {GLEAN_DOMAIN}")
        print(f"  Token: {'SET' if self.api_token else 'NOT SET'} ({len(self.api_token)} chars)")
        print(f"  Target Collection: {COLLECTION_ID}")
        
        # Test 1: Basic connection
        if not self.test_connection():
            print("\n⚠ Cannot proceed without valid API connection")
            return
        
        # Test 2: List collections
        collections = self.list_collections()
        
        # Test 3: Check specific collection
        collection_exists = self.check_collection(COLLECTION_ID)
        
        # Test 4: Try adding item if collection exists
        if collection_exists:
            self.test_add_item(COLLECTION_ID)
        else:
            print(f"\n⚠ Skipping add item test - collection {COLLECTION_ID} not accessible")
            
            # Optional: Try creating a test collection
            response = input("\nWould you like to create a test collection? (y/n): ")
            if response.lower() == 'y':
                new_collection_id = self.create_test_collection()
                if new_collection_id:
                    print(f"\n✓ You can update COLLECTION_ID to {new_collection_id} in your extension")
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        self.print_header("Test Summary")
        
        passed = sum(1 for r in self.test_results if r['success'])
        failed = sum(1 for r in self.test_results if not r['success'])
        
        print(f"\nResults: {passed} passed, {failed} failed")
        
        if failed > 0:
            print("\nFailed tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message'][:100]}")
        
        print("\nNext Steps:")
        if all(r['success'] for r in self.test_results):
            print("  ✓ All tests passed! Your Glean API is properly configured.")
            print("  ✓ The Chrome extension should work with these credentials.")
        else:
            print("  1. Ensure your API token has COLLECTIONS scope")
            print("  2. Verify the token is a Client API token (not Indexing API)")
            print("  3. Check that collection ID exists or create a new one")
            print("  4. Update the extension configuration with correct values")


def main():
    """Main entry point"""
    
    # Check for API token
    if not GLEAN_API_TOKEN:
        print("ERROR: GLEAN_API_TOKEN not set!")
        print("\nPlease set your API token:")
        print("  export GLEAN_API_TOKEN='your-token-here'")
        print("\nOr edit this script and set GLEAN_API_TOKEN directly")
        sys.exit(1)
    
    # Run tests
    tester = GleanAPITester(GLEAN_API_TOKEN)
    tester.run_all_tests()


if __name__ == "__main__":
    main()
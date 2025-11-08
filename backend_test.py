import requests
import sys
import json
from datetime import datetime

class HACCPAPITester:
    def __init__(self, base_url="https://bar-safety-check.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []

    def log_test(self, name, success, details=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {name} - PASSED")
        else:
            print(f"❌ {name} - FAILED: {details}")
        
        self.test_results.append({
            "test": name,
            "success": success,
            "details": details
        })

    def run_test(self, name, method, endpoint, expected_status, data=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, timeout=10)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers, timeout=10)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers, timeout=10)
            elif method == 'DELETE':
                response = requests.delete(url, headers=headers, timeout=10)

            success = response.status_code == expected_status
            details = f"Status: {response.status_code}"
            
            if success:
                try:
                    response_data = response.json()
                    details += f", Response: {json.dumps(response_data, indent=2)[:200]}..."
                except:
                    details += f", Response: {response.text[:100]}..."
            else:
                details += f", Expected: {expected_status}, Response: {response.text[:200]}"

            self.log_test(name, success, details)
            return success, response.json() if success and response.text else {}

        except Exception as e:
            self.log_test(name, False, f"Error: {str(e)}")
            return False, {}

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        return self.run_test("Dashboard Stats", "GET", "dashboard/stats", 200)

    def test_create_item(self, name, interval):
        """Test creating a cleaning item"""
        data = {"name": name, "interval": interval}
        return self.run_test(f"Create Item ({name})", "POST", "items", 200, data)

    def test_get_items(self):
        """Test getting all items"""
        return self.run_test("Get All Items", "GET", "items", 200)

    def test_update_item(self, item_id, name, interval):
        """Test updating an item"""
        data = {"name": name, "interval": interval}
        return self.run_test(f"Update Item ({item_id})", "PUT", f"items/{item_id}", 200, data)

    def test_delete_item(self, item_id):
        """Test deleting an item"""
        return self.run_test(f"Delete Item ({item_id})", "DELETE", f"items/{item_id}", 200)

    def test_create_check(self, item_id, item_name, employee_initials):
        """Test creating a cleaning check"""
        data = {
            "item_id": item_id,
            "item_name": item_name,
            "employee_initials": employee_initials
        }
        return self.run_test(f"Create Check ({item_name})", "POST", "checks", 200, data)

    def test_get_checks(self):
        """Test getting all checks"""
        return self.run_test("Get All Checks", "GET", "checks", 200)

def main():
    print("🧪 Starting HACCP API Tests")
    print("=" * 50)
    
    tester = HACCPAPITester()
    
    # Test 1: Dashboard stats (should work even with empty data)
    tester.test_dashboard_stats()
    
    # Test 2: Get items (should return empty array initially)
    tester.test_get_items()
    
    # Test 3: Create test items
    success1, item1_data = tester.test_create_item("Kühlschrank", "daily")
    success2, item2_data = tester.test_create_item("Arbeitsfläche", "weekly")
    success3, item3_data = tester.test_create_item("Spülmaschine", "monthly")
    
    # Test 4: Get items again (should now have items)
    tester.test_get_items()
    
    # Test 5: Update an item (if creation was successful)
    if success1 and 'id' in item1_data:
        tester.test_update_item(item1_data['id'], "Kühlschrank Hauptküche", "daily")
    
    # Test 6: Create cleaning checks (if items were created successfully)
    if success1 and 'id' in item1_data:
        tester.test_create_check(item1_data['id'], item1_data['name'], "JD")
    if success2 and 'id' in item2_data:
        tester.test_create_check(item2_data['id'], item2_data['name'], "MS")
    
    # Test 7: Get checks
    tester.test_get_checks()
    
    # Test 8: Dashboard stats again (should now show data)
    tester.test_dashboard_stats()
    
    # Test 9: Delete an item (if creation was successful)
    if success3 and 'id' in item3_data:
        tester.test_delete_item(item3_data['id'])
    
    # Test 10: Final get items to verify deletion
    tester.test_get_items()
    
    # Print final results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print("⚠️  Some tests failed!")
        return 1

if __name__ == "__main__":
    sys.exit(main())
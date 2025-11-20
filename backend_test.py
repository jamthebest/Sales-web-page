#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for Spanish E-commerce Application
Tests all endpoints including auth, products, requests, and admin functionality
"""

import requests
import sys
import json
from datetime import datetime
import time

class EcommerceAPITester:
    def __init__(self, base_url="https://emarket-portal.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.session_token = None
        self.admin_session_token = None
        self.test_user_id = None
        self.admin_user_id = None
        self.tests_run = 0
        self.tests_passed = 0
        self.test_results = []
        
        # Test data
        self.test_phone = "+52123456789"
        self.verification_code = None
        self.test_product_id = None

    def log_result(self, test_name, success, details="", error_msg=""):
        """Log test result"""
        self.tests_run += 1
        if success:
            self.tests_passed += 1
            print(f"✅ {test_name}")
        else:
            print(f"❌ {test_name} - {error_msg}")
        
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details,
            "error": error_msg
        })

    def make_request(self, method, endpoint, data=None, headers=None, use_admin=False):
        """Make API request with proper headers"""
        url = f"{self.api_url}/{endpoint}"
        
        default_headers = {'Content-Type': 'application/json'}
        if headers:
            default_headers.update(headers)
            
        # Add auth token if available
        token = self.admin_session_token if use_admin else self.session_token
        if token:
            default_headers['Authorization'] = f'Bearer {token}'

        try:
            if method == 'GET':
                response = requests.get(url, headers=default_headers)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=default_headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=default_headers)
            elif method == 'DELETE':
                response = requests.delete(url, headers=default_headers)
            
            return response
        except Exception as e:
            print(f"Request error: {str(e)}")
            return None

    def setup_test_users(self):
        """Setup test users in database using MongoDB"""
        print("\n🔧 Setting up test users...")
        
        import subprocess
        
        # Create regular user
        user_script = f'''
        use('test_database');
        var userId = 'test-user-{int(time.time())}';
        var sessionToken = 'test_session_{int(time.time())}';
        db.users.insertOne({{
          id: userId,
          email: 'test.user.{int(time.time())}@example.com',
          name: 'Test User',
          picture: 'https://via.placeholder.com/150',
          role: 'user',
          created_at: new Date().toISOString()
        }});
        db.user_sessions.insertOne({{
          user_id: userId,
          session_token: sessionToken,
          expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
          created_at: new Date().toISOString()
        }});
        print('USER_SESSION:' + sessionToken);
        print('USER_ID:' + userId);
        '''
        
        try:
            result = subprocess.run(['mongosh', '--eval', user_script], 
                                  capture_output=True, text=True, timeout=30)
            
            for line in result.stdout.split('\n'):
                if 'USER_SESSION:' in line:
                    self.session_token = line.split('USER_SESSION:')[1].strip()
                elif 'USER_ID:' in line:
                    self.test_user_id = line.split('USER_ID:')[1].strip()
            
            print(f"✅ Regular user created with session: {self.session_token[:20]}...")
        except Exception as e:
            print(f"❌ Failed to create regular user: {str(e)}")
            return False

        # Create admin user
        admin_script = f'''
        use('test_database');
        var adminId = 'admin-user-{int(time.time())}';
        var adminToken = 'admin_session_{int(time.time())}';
        db.users.insertOne({{
          id: adminId,
          email: 'admin.user.{int(time.time())}@example.com',
          name: 'Admin User',
          picture: 'https://via.placeholder.com/150',
          role: 'admin',
          created_at: new Date().toISOString()
        }});
        db.user_sessions.insertOne({{
          user_id: adminId,
          session_token: adminToken,
          expires_at: new Date(Date.now() + 7*24*60*60*1000).toISOString(),
          created_at: new Date().toISOString()
        }});
        print('ADMIN_SESSION:' + adminToken);
        print('ADMIN_ID:' + adminId);
        '''
        
        try:
            result = subprocess.run(['mongosh', '--eval', admin_script], 
                                  capture_output=True, text=True, timeout=30)
            
            for line in result.stdout.split('\n'):
                if 'ADMIN_SESSION:' in line:
                    self.admin_session_token = line.split('ADMIN_SESSION:')[1].strip()
                elif 'ADMIN_ID:' in line:
                    self.admin_user_id = line.split('ADMIN_ID:')[1].strip()
            
            print(f"✅ Admin user created with session: {self.admin_session_token[:20]}...")
        except Exception as e:
            print(f"❌ Failed to create admin user: {str(e)}")
            return False

        return self.session_token and self.admin_session_token

    def test_auth_endpoints(self):
        """Test authentication endpoints"""
        print("\n🔐 Testing Authentication Endpoints...")
        
        # Test /auth/me with regular user
        response = self.make_request('GET', 'auth/me')
        if response and response.status_code == 200:
            user_data = response.json()
            self.log_result("GET /auth/me (regular user)", True, 
                          f"User: {user_data.get('name')} ({user_data.get('role')})")
        else:
            self.log_result("GET /auth/me (regular user)", False, 
                          error_msg=f"Status: {response.status_code if response else 'No response'}")

        # Test /auth/me with admin user
        response = self.make_request('GET', 'auth/me', use_admin=True)
        if response and response.status_code == 200:
            admin_data = response.json()
            self.log_result("GET /auth/me (admin user)", True, 
                          f"Admin: {admin_data.get('name')} ({admin_data.get('role')})")
        else:
            self.log_result("GET /auth/me (admin user)", False, 
                          error_msg=f"Status: {response.status_code if response else 'No response'}")

        # Test logout
        response = self.make_request('POST', 'auth/logout')
        success = response and response.status_code == 200
        self.log_result("POST /auth/logout", success, 
                      error_msg=f"Status: {response.status_code if response else 'No response'}")

    def test_product_endpoints(self):
        """Test product-related endpoints"""
        print("\n📦 Testing Product Endpoints...")
        
        # Test get all products
        response = self.make_request('GET', 'products')
        if response and response.status_code == 200:
            products = response.json()
            self.log_result("GET /products", True, f"Found {len(products)} products")
            
            # Store first product ID for later tests
            if products:
                self.test_product_id = products[0]['id']
        else:
            self.log_result("GET /products", False, 
                          error_msg=f"Status: {response.status_code if response else 'No response'}")

        # Test get single product
        if self.test_product_id:
            response = self.make_request('GET', f'products/{self.test_product_id}')
            success = response and response.status_code == 200
            self.log_result("GET /products/{id}", success, 
                          error_msg=f"Status: {response.status_code if response else 'No response'}")

        # Test create product with image gallery and transformations (admin only)
        test_product = {
            "name": "Producto de Prueba",
            "description": "Descripción del producto de prueba",
            "price": 99.99,
            "stock": 10,
            "category": "Pruebas",
            "image_url": "https://example.com/main-image.jpg",
            "images": [
                {
                    "url": "https://example.com/gallery1.jpg",
                    "description": "Vista frontal",
                    "transform": {
                        "scale": 1.5,
                        "x": 60,
                        "y": 40
                    }
                },
                {
                    "url": "https://example.com/gallery2.jpg",
                    "description": "Vista lateral",
                    "transform": {
                        "scale": 1.2,
                        "x": 30,
                        "y": 70
                    }
                }
            ]
        }
        
        response = self.make_request('POST', 'products', data=test_product, use_admin=True)
        if response and response.status_code == 200:
            created_product = response.json()
            self.test_product_id = created_product['id']  # Update for further tests
            self.log_result("POST /products (admin)", True, f"Created product: {created_product['name']}")
        else:
            self.log_result("POST /products (admin)", False, 
                          error_msg=f"Status: {response.status_code if response else 'No response'}")

        # Test update product (admin only)
        if self.test_product_id:
            update_data = {"price": 89.99, "stock": 15}
            response = self.make_request('PUT', f'products/{self.test_product_id}', 
                                       data=update_data, use_admin=True)
            success = response and response.status_code == 200
            self.log_result("PUT /products/{id} (admin)", success, 
                          error_msg=f"Status: {response.status_code if response else 'No response'}")

    def test_request_endpoints(self):
        """Test request-related endpoints"""
        print("\n📋 Testing Request Endpoints...")
        
        if not self.test_product_id:
            print("⚠️ No test product available, skipping request tests")
            return

        # Test phone verification
        verify_data = {"phone": self.test_phone}
        response = self.make_request('POST', 'requests/verify-phone', data=verify_data)
        
        if response and response.status_code == 200:
            verify_result = response.json()
            self.log_result("POST /requests/verify-phone", True, 
                          f"Mock code: {verify_result.get('mock_code', 'N/A')}")
            self.verification_code = verify_result.get('mock_code')
        else:
            self.log_result("POST /requests/verify-phone", False, 
                          error_msg=f"Status: {response.status_code if response else 'No response'}")

        # Test code validation
        if self.verification_code:
            validate_data = {"phone": self.test_phone, "code": self.verification_code}
            response = self.make_request('POST', 'requests/validate-code', data=validate_data)
            success = response and response.status_code == 200
            self.log_result("POST /requests/validate-code", success, 
                          error_msg=f"Status: {response.status_code if response else 'No response'}")

        # Test purchase request
        purchase_data = {
            "user_email": "test@example.com",
            "user_name": "Test User",
            "user_phone": self.test_phone,
            "product_id": self.test_product_id,
            "quantity": 2
        }
        
        response = self.make_request('POST', 'requests/purchase', data=purchase_data)
        success = response and response.status_code == 200
        self.log_result("POST /requests/purchase", success, 
                      error_msg=f"Status: {response.status_code if response else 'No response'}")

        # Test out-of-stock request
        outofstock_data = {
            "product_id": self.test_product_id,
            "phone": self.test_phone,
            "quantity": 1
        }
        
        response = self.make_request('POST', 'requests/out-of-stock', data=outofstock_data)
        success = response and response.status_code == 200
        self.log_result("POST /requests/out-of-stock", success, 
                      error_msg=f"Status: {response.status_code if response else 'No response'}")

        # Test custom request
        custom_data = {
            "phone": self.test_phone,
            "description": "Producto personalizado de prueba",
            "quantity": 1
        }
        
        response = self.make_request('POST', 'requests/custom', data=custom_data)
        success = response and response.status_code == 200
        self.log_result("POST /requests/custom", success, 
                      error_msg=f"Status: {response.status_code if response else 'No response'}")

        # Test get all requests (admin only)
        response = self.make_request('GET', 'requests', use_admin=True)
        if response and response.status_code == 200:
            requests_data = response.json()
            total_requests = (len(requests_data.get('purchase_requests', [])) + 
                            len(requests_data.get('out_of_stock_requests', [])) + 
                            len(requests_data.get('custom_requests', [])))
            self.log_result("GET /requests (admin)", True, f"Total requests: {total_requests}")
        else:
            self.log_result("GET /requests (admin)", False, 
                          error_msg=f"Status: {response.status_code if response else 'No response'}")

    def test_config_endpoints(self):
        """Test configuration endpoints"""
        print("\n⚙️ Testing Configuration Endpoints...")
        
        # Test get config (admin only)
        response = self.make_request('GET', 'config', use_admin=True)
        success = response and response.status_code == 200
        self.log_result("GET /config (admin)", success, 
                      error_msg=f"Status: {response.status_code if response else 'No response'}")

        # Test update config (admin only)
        config_data = {
            "email": "admin@tienda.com",
            "phone": "+52987654321"
        }
        
        response = self.make_request('PUT', 'config', data=config_data, use_admin=True)
        success = response and response.status_code == 200
        self.log_result("PUT /config (admin)", success, 
                      error_msg=f"Status: {response.status_code if response else 'No response'}")

    def test_unauthorized_access(self):
        """Test unauthorized access to protected endpoints"""
        print("\n🚫 Testing Unauthorized Access...")
        
        # Temporarily remove tokens
        temp_session = self.session_token
        temp_admin = self.admin_session_token
        self.session_token = None
        self.admin_session_token = None
        
        # Test protected endpoints without auth
        response = self.make_request('GET', 'auth/me')
        success = response and response.status_code == 401
        self.log_result("GET /auth/me (no auth)", success, 
                      error_msg=f"Expected 401, got {response.status_code if response else 'No response'}")

        response = self.make_request('POST', 'products', data={"name": "test"})
        success = response and response.status_code == 401
        self.log_result("POST /products (no auth)", success, 
                      error_msg=f"Expected 401, got {response.status_code if response else 'No response'}")

        # Test admin endpoints with regular user
        self.session_token = temp_session
        response = self.make_request('GET', 'requests')
        success = response and response.status_code == 403
        self.log_result("GET /requests (user role)", success, 
                      error_msg=f"Expected 403, got {response.status_code if response else 'No response'}")

        # Restore tokens
        self.session_token = temp_session
        self.admin_session_token = temp_admin

    def cleanup_test_data(self):
        """Clean up test data from database"""
        print("\n🧹 Cleaning up test data...")
        
        import subprocess
        
        cleanup_script = '''
        use('test_database');
        db.users.deleteMany({email: /test\.user\./});
        db.users.deleteMany({email: /admin\.user\./});
        db.user_sessions.deleteMany({session_token: /test_session/});
        db.user_sessions.deleteMany({session_token: /admin_session/});
        db.products.deleteMany({name: "Producto de Prueba"});
        print('Cleanup completed');
        '''
        
        try:
            subprocess.run(['mongosh', '--eval', cleanup_script], 
                          capture_output=True, text=True, timeout=30)
            print("✅ Test data cleaned up")
        except Exception as e:
            print(f"⚠️ Cleanup warning: {str(e)}")

    def run_all_tests(self):
        """Run all test suites"""
        print("🚀 Starting Comprehensive Backend API Testing")
        print(f"🎯 Target: {self.base_url}")
        print("=" * 60)
        
        # Setup
        if not self.setup_test_users():
            print("❌ Failed to setup test users. Aborting tests.")
            return False
        
        # Run test suites
        self.test_auth_endpoints()
        self.test_product_endpoints()
        self.test_request_endpoints()
        self.test_config_endpoints()
        self.test_unauthorized_access()
        
        # Cleanup
        self.cleanup_test_data()
        
        # Results
        print("\n" + "=" * 60)
        print(f"📊 Test Results: {self.tests_passed}/{self.tests_run} passed")
        
        if self.tests_passed == self.tests_run:
            print("🎉 All tests passed!")
            return True
        else:
            print("⚠️ Some tests failed. Check details above.")
            return False

    def get_test_summary(self):
        """Get detailed test summary"""
        return {
            "total_tests": self.tests_run,
            "passed_tests": self.tests_passed,
            "success_rate": f"{(self.tests_passed/self.tests_run*100):.1f}%" if self.tests_run > 0 else "0%",
            "test_results": [
                {
                    "test": result["test"],
                    "success": result["success"],
                    "details": result["details"],
                    "error": result["error"]
                } for result in self.test_results
            ]
        }

def main():
    """Main test execution"""
    tester = EcommerceAPITester()
    
    try:
        success = tester.run_all_tests()
        
        # Save detailed results
        summary = tester.get_test_summary()
        with open('/app/backend_test_results.json', 'w') as f:
            json.dump(summary, f, indent=2)
        
        return 0 if success else 1
        
    except KeyboardInterrupt:
        print("\n⚠️ Tests interrupted by user")
        return 1
    except Exception as e:
        print(f"\n❌ Test execution failed: {str(e)}")
        return 1

if __name__ == "__main__":
    sys.exit(main())
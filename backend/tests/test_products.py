import pytest

def test_list_products(client):
    """Test listing products"""
    response = client.get("/api/products")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)

def test_list_products_by_category(client):
    """Test listing products filtered by category"""
    response = client.get("/api/products?category=fruits")
    assert response.status_code == 200

def test_get_product_not_found(client):
    """Test getting non-existent product"""
    response = client.get("/api/products/99999")
    assert response.status_code == 404

def test_vendor_can_create_product(client):
    """Test that vendor can create product"""
    # Register vendor first
    vendor_response = client.post(
        "/api/vendors/register",
        json={
            "email": "vendor@test.com",
            "password": "testpassword123",
            "business_name": "Test Vendor",
            "phone": "555-1234"
        }
    )
    vendor_id = vendor_response.json()["id"]

    # Create product
    response = client.post(
        f"/api/products",
        json={
            "vendor_id": vendor_id,
            "name": "Fresh Mango",
            "description": "Delicious fresh mango",
            "category": "Fruits",
            "price": 5.99,
            "quantity_available": 20
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["name"] == "Fresh Mango"
    assert data["price"] == 5.99

def test_get_vendor_products(client):
    """Test getting vendor's products"""
    # Register vendor
    vendor_response = client.post(
        "/api/vendors/register",
        json={
            "email": "vendor@test.com",
            "password": "testpassword123",
            "business_name": "Test Vendor",
            "phone": "555-1234"
        }
    )
    vendor_id = vendor_response.json()["id"]

    # Create product
    client.post(
        f"/api/products",
        json={
            "vendor_id": vendor_id,
            "name": "Fresh Mango",
            "category": "Fruits",
            "price": 5.99,
            "quantity_available": 20
        }
    )

    # Get vendor products
    response = client.get(f"/api/products/vendor/{vendor_id}")
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 1
    assert data[0]["name"] == "Fresh Mango"

import pytest
from app.models import Vendor
from app.database import get_db

def test_vendor_registration(client):
    """Test vendor registration endpoint"""
    response = client.post(
        "/api/vendors/register",
        json={
            "email": "vendor@test.com",
            "password": "testpassword123",
            "business_name": "Test Vendor",
            "phone": "555-1234",
            "description": "A test vendor business"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert data["email"] == "vendor@test.com"
    assert data["business_name"] == "Test Vendor"

def test_vendor_registration_duplicate_email(client):
    """Test vendor registration with duplicate email"""
    client.post(
        "/api/vendors/register",
        json={
            "email": "vendor@test.com",
            "password": "testpassword123",
            "business_name": "Test Vendor 1",
            "phone": "555-1234"
        }
    )

    response = client.post(
        "/api/vendors/register",
        json={
            "email": "vendor@test.com",
            "password": "testpassword123",
            "business_name": "Test Vendor 2",
            "phone": "555-5678"
        }
    )
    assert response.status_code == 400

def test_vendor_login(client):
    """Test vendor login"""
    client.post(
        "/api/vendors/register",
        json={
            "email": "vendor@test.com",
            "password": "testpassword123",
            "business_name": "Test Vendor",
            "phone": "555-1234"
        }
    )

    response = client.post(
        "/api/vendors/login",
        json={
            "email": "vendor@test.com",
            "password": "testpassword123"
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "access_token" in data
    assert data["token_type"] == "bearer"

def test_vendor_login_invalid_credentials(client):
    """Test vendor login with invalid credentials"""
    response = client.post(
        "/api/vendors/login",
        json={
            "email": "nonexistent@test.com",
            "password": "wrongpassword"
        }
    )
    assert response.status_code == 401

def test_get_vendor(client):
    """Test getting vendor profile"""
    register_response = client.post(
        "/api/vendors/register",
        json={
            "email": "vendor@test.com",
            "password": "testpassword123",
            "business_name": "Test Vendor",
            "phone": "555-1234"
        }
    )
    vendor_id = register_response.json()["id"]

    response = client.get(f"/api/vendors/{vendor_id}")
    assert response.status_code == 200
    data = response.json()
    assert data["business_name"] == "Test Vendor"

def test_get_nonexistent_vendor(client):
    """Test getting non-existent vendor"""
    response = client.get("/api/vendors/99999")
    assert response.status_code == 404

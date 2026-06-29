#!/bin/bash

# Run all tests
echo "Running all tests..."
pytest --cov=app --cov-report=html

# Run specific test
# pytest tests/test_vendors.py -v

# Run with markers
# pytest -m unit -v
# pytest -m integration -v

# Run with output
# pytest -v -s

#!/bin/bash

# Script to remove duplicate files from 2dots1line repository

echo "Removing duplicate files from the repository..."

# Root directory duplicates
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/NEXT-STEPS-SUMMARY 2.md"
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/SERVER-MANAGEMENT-GUIDE 2.md"

# Backend directory duplicates
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/backend/README-VECTORIZATION 2.md"
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/backend/nohup 2.out"
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/backend/restart-backend 2.sh"
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/backend/restart-backend-venv 2.sh"
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/backend/restart_backend 2.py"
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/backend/test_db_upgrade 2.py"
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/backend/test_embedding 2.py"
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/backend/test_health 2.py"
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/backend/test_simple 2.py"
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/backend/test_simple_vector 2.py"
rm -v "/Users/danniwang/Documents/GitHub/2dots1line/backend/test_vectorization 2.py"

echo "Duplicate removal complete!" 
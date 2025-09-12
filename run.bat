@echo off
echo 🚀 Starting VTT Tables API...
echo.
echo Installing dependencies...
pip install -r requirements.txt
echo.
echo Starting server on http://localhost:8000
echo API Documentation: http://localhost:8000/docs
echo.
uvicorn main:app --reload --port 8000
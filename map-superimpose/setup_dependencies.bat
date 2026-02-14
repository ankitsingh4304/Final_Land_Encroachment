@echo off
echo Installing Python dependencies for encroachment analysis...
echo.

cd /d "%~dp0"

echo Activating virtual environment...
call ppgvenv2\Scripts\activate.bat

echo Installing required packages...
pip install opencv-python numpy pytesseract reportlab matplotlib

echo.
echo Installation complete!
echo.
echo Note: You also need to install Tesseract OCR from:
echo https://github.com/UB-Mannheim/tesseract/wiki
echo.
echo The script expects Tesseract at: C:\Program Files\Tesseract-OCR\tesseract.exe
echo.
pause

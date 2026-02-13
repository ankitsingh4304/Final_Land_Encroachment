# Analyze Encroachment Pipeline - Setup Guide

## Current Status
✅ **Mock mode is ENABLED** - The analysis will work immediately with test data.

## Issue Found
The Python dependencies required for the actual encroachment analysis are not installed in your virtual environment.

## Quick Fix (Already Applied)
Mock mode has been enabled in `.env.local`:
```env
MAP_ANALYSIS_USE_MOCK="true"
```

This allows the UI to work immediately without Python dependencies.

## To Enable Real Analysis

### Step 1: Install Python Dependencies

Run the setup script:
```bash
cd map-superimpose
setup_dependencies.bat
```

Or manually:
```bash
cd map-superimpose
.\ppgvenv2\Scripts\activate
pip install opencv-python numpy pytesseract reportlab
```

### Step 2: Install Tesseract OCR

1. Download from: https://github.com/UB-Mannheim/tesseract/wiki
2. Install to: `C:\Program Files\Tesseract-OCR\`
3. The script expects it at: `C:\Program Files\Tesseract-OCR\tesseract.exe`

If installed elsewhere, update `final9.py` line 13:
```python
pytesseract.pytesseract.tesseract_cmd = r'C:\Your\Path\To\Tesseract-OCR\tesseract.exe'
```

### Step 3: Verify Installation

Test the dependencies:
```bash
cd map-superimpose
.\ppgvenv2\Scripts\python.exe -c "import cv2, numpy, pytesseract, reportlab; print('All dependencies installed')"
```

### Step 4: Disable Mock Mode

In `.env.local`, change:
```env
MAP_ANALYSIS_USE_MOCK="false"
```

### Step 5: Restart Next.js Server

Restart your development server for environment variable changes to take effect.

## Configuration

Your `.env.local` is configured with:
- ✅ Python path: Points to virtual environment
- ✅ Script path: Points to `final9.py`
- ✅ Mock mode: Currently enabled for testing

## Expected Output

When working correctly, the script generates:
- `encroachment-report.pdf` - PDF report with violations
- `encroachment-overlay.png` - Annotated overlay image

Saved to: `public/reports/{area-id}/`

## Troubleshooting

### Error: "Python executable not found"
- Check `MAP_ANALYSIS_PYTHON_BIN` in `.env.local`
- Verify the virtual environment path is correct

### Error: "ModuleNotFoundError"
- Run `setup_dependencies.bat` or install packages manually
- Make sure you're using the virtual environment Python

### Error: "Tesseract OCR not found"
- Install Tesseract OCR
- Update path in `final9.py` if installed elsewhere

### Error: "Image files not found"
- Verify images exist at:
  - `public/assets/industrial-areas/area-1/official_map.jpg`
  - `public/assets/industrial-areas/area-1/satellite_map.jpg`
  - (Same for area-2 and area-3)

## Testing

Test the script manually:
```bash
cd map-superimpose
.\ppgvenv2\Scripts\python.exe final9.py "path/to/official.jpg" "path/to/satellite.jpg" "path/to/output"
```

# Analyze Encroachment Pipeline - Fix Guide

## Issue Identified
The Python dependencies required for the encroachment analysis are not installed in your Python environment.

## Required Dependencies
The `final9.py` script requires:
- `opencv-python` (cv2)
- `numpy`
- `pytesseract`
- `reportlab`
- Tesseract OCR (system installation)

## Quick Fix Options

### Option 1: Install Dependencies (Recommended for Production)

1. **Install Python packages:**
   ```bash
   pip install opencv-python numpy pytesseract reportlab
   ```

2. **Install Tesseract OCR:**
   - Download from: https://github.com/UB-Mannheim/tesseract/wiki
   - Install to: `C:\Program Files\Tesseract-OCR\`
   - The script expects it at: `C:\Program Files\Tesseract-OCR\tesseract.exe`

3. **Verify installation:**
   ```bash
   python -c "import cv2, numpy, pytesseract, reportlab; print('All dependencies installed')"
   ```

### Option 2: Use Mock Mode (Quick Testing)

For immediate testing without Python setup, enable mock mode in `.env.local`:

```env
MAP_ANALYSIS_USE_MOCK="true"
```

This will skip the Python script execution and return mock results.

### Option 3: Use Virtual Environment (Recommended)

If you have a virtual environment in `map-superimpose/ppgvenv2`:

1. **Activate the virtual environment:**
   ```bash
   cd map-superimpose
   .\ppgvenv2\Scripts\activate
   ```

2. **Install dependencies:**
   ```bash
   pip install opencv-python numpy pytesseract reportlab
   ```

3. **Update `.env.local` to use the virtual environment Python:**
   ```env
   MAP_ANALYSIS_PYTHON_BIN="X:\\codes\\Final_Land_Encroachment\\map-superimpose\\ppgvenv2\\Scripts\\python.exe"
   ```

## Expected Output Files

The Python script generates:
- `encroachment-report.pdf` - PDF report with violations
- `encroachment-overlay.png` - Annotated overlay image

These are saved to: `public/reports/{area-id}/`

## Troubleshooting

### Error: "Python executable not found"
- Check `MAP_ANALYSIS_PYTHON_BIN` in `.env.local`
- Try `python3` instead of `python` on some systems

### Error: "Python script not found"
- Verify `MAP_ANALYSIS_SCRIPT_PATH` points to the correct file
- Use absolute path: `X:\\codes\\Final_Land_Encroachment\\map-superimpose\\final9.py`

### Error: "ModuleNotFoundError"
- Install missing Python packages
- Use virtual environment if available

### Error: "Tesseract OCR not found"
- Install Tesseract OCR
- Update path in `final9.py` line 13 if installed elsewhere

## Testing the Script Manually

Test the script directly:
```bash
cd X:\codes\Final_Land_Encroachment\map-superimpose
python final9.py "path/to/official_map.jpg" "path/to/satellite_map.jpg" "path/to/output/dir"
```

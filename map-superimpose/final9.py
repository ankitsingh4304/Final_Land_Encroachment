import cv2
import numpy as np
import pytesseract
import os
import sys
from reportlab.lib.pagesizes import A4
from reportlab.pdfgen import canvas
from reportlab.lib.utils import ImageReader

# Optional: for encroachment distribution chart
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    HAS_MATPLOTLIB = True
except ImportError:
    HAS_MATPLOTLIB = False

# ==========================================
# CONFIGURATION
# ==========================================
pytesseract.pytesseract.tesseract_cmd = r'C:\Program Files\Tesseract-OCR\tesseract.exe'

# IMAGE FILES (defaults; can be overridden by CLI args)
OFFICIAL_MAP = "lelo_org.png"       
SATELLITE_MAP = "pelo_org.png" 

# OUTPUT DIRECTORY (default, can be overridden by CLI args)
OUTPUT_DIR = os.getcwd()

# --- PRECISE COLOR DEFINITIONS (RGB -> HSV) ---

# 1. RED (Industrial Plots)
LOWER_RED1, UPPER_RED1 = np.array([0, 160, 100]), np.array([10, 255, 255])
LOWER_RED2, UPPER_RED2 = np.array([170, 160, 100]), np.array([180, 255, 255])

# 2. PARKING (Yellowish)
LOWER_PARKING = np.array([20, 100, 150])
UPPER_PARKING = np.array([40, 180, 255])

# 3. GREEN AREA / PARK (Light Green)
LOWER_PARK = np.array([40, 80, 180]) 
UPPER_PARK = np.array([58, 195, 255])

# 4. UNALLOCATED LAND (Bold Green)
LOWER_UNALLOTTED = np.array([55, 200, 200])
UPPER_UNALLOTTED = np.array([75, 255, 255])

# 5. WATER BODY (Cyan)
LOWER_WATER = np.array([80, 50, 200])
UPPER_WATER = np.array([110, 255, 255])

# 6. ROAD (Grey: 156, 156, 156) [NEW EXPLICIT DETECTION]
# Saturation must be very low (0-30) to ensure it's Grey, not colored.
# Value (Brightness) is centered around 156 (range 130-185).
LOWER_ROAD = np.array([0, 0, 130])
UPPER_ROAD = np.array([180, 40, 185])

# Minimum pixels in a zone to count as encroachment (reduces noise)
NOISE_THRESHOLD = 50

# Chart colors (for matplotlib bar chart)
PLOT_COLORS = {
    "PARK": "#2ecc71",
    "UNALLOTTED": "#e74c3c",
    "PARKING": "#8B4513",
    "ROAD": "#f1c40f",
    "WATER": "#3498db",
}

# --- DRAWING COLORS (BGR Format) ---
COLOR_YELLOW = (0, 255, 255)  # Road
COLOR_BLUE   = (255, 0, 0)    # Water
COLOR_GREEN  = (0, 255, 0)    # Park
COLOR_RED    = (0, 0, 255)    # Unallotted
COLOR_BROWN  = (42, 42, 165)  # Parking

# ==========================================

def ensure_output_dir():
    """Ensure the global OUTPUT_DIR exists on disk."""
    os.makedirs(OUTPUT_DIR, exist_ok=True)


def save_image(filename, image):
    """Save an image inside the configured OUTPUT_DIR."""
    ensure_output_dir()
    output_path = os.path.join(OUTPUT_DIR, filename)
    cv2.imwrite(output_path, image)
    print(f"Saved: {output_path}")


def generate_encroachment_chart(stats, output_dir):
    """
    Generate a bar chart of encroachment distribution (percentage by type).
    Returns path to saved chart image, or None if matplotlib not available.
    """
    if not stats or len(stats) == 0:
        print("No statistics to generate chart")
        return None
    
    if not HAS_MATPLOTLIB:
        print("WARNING: matplotlib not available, skipping chart generation")
        return None
    
    try:
        ensure_output_dir()
        labels = list(stats.keys())
        values = list(stats.values())
        colors = [PLOT_COLORS.get(lbl, "#95a5a6") for lbl in labels]
        
        plt.figure(figsize=(8, 5))
        bars = plt.bar(labels, values, color=colors, edgecolor='black', linewidth=1.2)
        
        # Add value labels on top of bars
        for bar in bars:
            height = bar.get_height()
            plt.text(bar.get_x() + bar.get_width()/2., height,
                    f'{height:.1f}%',
                    ha='center', va='bottom', fontsize=10, fontweight='bold')
        
        plt.xlabel("Encroachment Type", fontsize=11, fontweight='bold')
        plt.ylabel("Percentage of Total Violation (%)", fontsize=11, fontweight='bold')
        plt.title("Encroachment Distribution Analysis", fontsize=13, fontweight='bold')
        plt.ylim(0, max(values) * 1.15 if values else 100)
        plt.grid(axis='y', alpha=0.3, linestyle='--')
        
        chart_path = os.path.join(output_dir, "encroachment_chart.png")
        plt.savefig(chart_path, bbox_inches="tight", dpi=150, facecolor='white')
        plt.close()
        print(f"Chart saved: {chart_path}")
        return chart_path
    except Exception as e:
        print(f"ERROR generating chart: {e}")
        import traceback
        traceback.print_exc()
        return None


def generate_pdf_report(output_dir, overlay_path, alerts, stats=None, chart_path=None):
    """
    Generate encroachment PDF report with:
    - Title and metadata
    - Annotated overlay map image
    - Optional: bar chart of encroachment distribution
    - Optional: statistics table (percentage per type)
    - Bullet list of detected violations (alerts)
    """
    pdf_path = os.path.join(output_dir, "encroachment-report.pdf")
    c = canvas.Canvas(pdf_path, pagesize=A4)
    width, height = A4

    # Title
    c.setFont("Helvetica-Bold", 16)
    c.drawString(50, height - 50, "Land Encroachment Analysis Report")
    c.setFont("Helvetica", 10)
    c.drawString(50, height - 70, "Generated by Govt Land Analyzer")
    y = height - 90

    # Overlay Image (if present)
    # Reserve space for chart and statistics - make map smaller if chart exists
    if os.path.exists(overlay_path):
        try:
            img = ImageReader(overlay_path)
            iw, ih = img.getSize()
            # Reserve more space if chart will be shown
            reserved_space = 250 if (chart_path and os.path.exists(chart_path)) else 180
            max_w, max_h = width - 100, height - reserved_space
            scale = min(max_w / iw, max_h / ih)
            img_w, img_h = iw * scale, ih * scale
            c.drawImage(
                img, 50, y - img_h,
                width=img_w, height=img_h,
                preserveAspectRatio=True, mask="auto",
            )
            y = y - img_h - 20
        except Exception as e:
            c.drawString(50, y, f"(Failed to embed overlay image: {e})")
            y -= 20

    # Encroachment statistics chart (if available)
    # Place chart AFTER map but BEFORE statistics table for better visual flow
    if chart_path and os.path.exists(chart_path):
        try:
            print(f"Attempting to embed chart from: {chart_path}")
            
            # Check if we have enough space, if not, start a new page
            if y < 200:
                c.showPage()
                y = height - 50
                c.setFont("Helvetica-Bold", 14)
                c.drawString(50, y, "Encroachment Analysis - Statistics")
                y -= 30
            
            c.setFont("Helvetica-Bold", 12)
            c.drawString(50, y, "Encroachment Distribution Chart:")
            y -= 20
            
            chart_img = ImageReader(chart_path)
            cw, ch = chart_img.getSize()
            print(f"Chart dimensions: {cw}x{ch}")
            
            # Allocate space for chart - make it prominent but ensure it fits
            max_chart_h = min(180, y - 100)  # Ensure chart fits with room for text below
            max_chart_w = width - 100
            scale_c = min(max_chart_w / cw, max_chart_h / ch)
            chart_w = cw * scale_c
            chart_h = ch * scale_c
            
            # Center the chart horizontally
            chart_x = (width - chart_w) / 2
            
            print(f"Embedding chart at x={chart_x}, y={y - chart_h}, size={chart_w}x{chart_h}")
            c.drawImage(
                chart_path, 
                chart_x, 
                y - chart_h, 
                width=chart_w, 
                height=chart_h,
                preserveAspectRatio=True,
                mask='auto'
            )
            y = y - chart_h - 20
            print(f"Chart successfully embedded in PDF at y={y}")
        except Exception as e:
            print(f"ERROR embedding chart in PDF: {e}")
            import traceback
            traceback.print_exc()
            c.setFont("Helvetica", 9)
            c.drawString(50, y, f"(Chart could not be embedded: {str(e)[:50]})")
            y -= 15
    elif stats and len(stats) > 0:
        # Chart was supposed to be generated but wasn't
        c.setFont("Helvetica", 9)
        c.drawString(50, y, "(Chart generation skipped - install matplotlib: pip install matplotlib)")
        y -= 15

    # Statistics table (percentage per type)
    if stats:
        c.setFont("Helvetica-Bold", 12)
        c.drawString(50, y, "Detected Violation Types (% of total illegal area):")
        y -= 18
        c.setFont("Helvetica", 10)
        for e_type, pct in sorted(stats.items(), key=lambda x: -x[1]):
            c.drawString(60, y, f"- {e_type}: {pct:.1f}% of total illegal area")
            y -= 14
        y -= 10

    # Violations list (plot-level alerts)
    c.setFont("Helvetica-Bold", 12)
    c.drawString(50, y, "Detected Violations (by plot):")
    y -= 20
    c.setFont("Helvetica", 10)
    if alerts:
        for alert in alerts:
            if y < 60:
                c.showPage()
                y = height - 60
                c.setFont("Helvetica", 10)
            c.drawString(60, y, f"- {alert}")
            y -= 14
    else:
        c.drawString(60, y, "No violations detected by the current analysis.")

    c.showPage()
    c.save()
    print(f"Saved PDF report: {pdf_path}")
    return pdf_path

def smart_ocr_reader(roi):
    gray = cv2.cvtColor(roi, cv2.COLOR_BGR2GRAY)
    _, binary = cv2.threshold(gray, 180, 255, cv2.THRESH_BINARY)
    cnts, _ = cv2.findContours(binary, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    if not cnts: return "?"
    largest_char = max(cnts, key=cv2.contourArea)
    x, y, w, h = cv2.boundingRect(largest_char)
    if w < 5 or h < 10: return "?"
    digit_crop = binary[y:y+h, x:x+w]
    digit_crop = cv2.copyMakeBorder(digit_crop, 10, 10, 10, 10, cv2.BORDER_CONSTANT, value=0)
    digit_crop = cv2.bitwise_not(digit_crop)
    digit_crop = cv2.resize(digit_crop, None, fx=2, fy=2, interpolation=cv2.INTER_CUBIC)
    text = pytesseract.image_to_string(digit_crop, config='--psm 10 -c tessedit_char_whitelist=0123456789ABCDEF')
    return text.strip() if text.strip() else "?"

def find_nearest_red_plot(violation_contour, plot_contours, plot_labels, debug_img=None):
    M = cv2.moments(violation_contour)
    if M["m00"] == 0: return None, None
    vX, vY = int(M["m10"] / M["m00"]), int(M["m01"] / M["m00"])
    min_dist = float('inf')
    culprit_id = -1
    for i, plot_cnt in enumerate(plot_contours):
        dist = abs(cv2.pointPolygonTest(plot_cnt, (vX, vY), True))
        if dist < min_dist:
            min_dist = dist
            culprit_id = i
    if min_dist > 300: return "Unknown", None
    
    if debug_img is not None and culprit_id != -1:
        M_plot = cv2.moments(plot_contours[culprit_id])
        if M_plot["m00"] > 0:
            pX, pY = int(M_plot["m10"] / M_plot["m00"]), int(M_plot["m01"] / M_plot["m00"])
            cv2.line(debug_img, (vX, vY), (pX, pY), (255, 0, 0), 2)
            cv2.circle(debug_img, (pX, pY), 5, (255, 0, 0), -1)
    
    return plot_labels.get(culprit_id, "Unknown"), min_dist

def main():
    global OFFICIAL_MAP, SATELLITE_MAP, OUTPUT_DIR

    # Allow CLI overrides: python final9.py <official_map> <satellite_map> <output_dir>
    if len(sys.argv) >= 4:
        OFFICIAL_MAP = sys.argv[1]
        SATELLITE_MAP = sys.argv[2]
        OUTPUT_DIR = sys.argv[3]
    else:
        # Default to current working directory for output
        OUTPUT_DIR = os.path.join(os.getcwd(), "output")

    ensure_output_dir()

    print(f"--- STARTING FINAL ANALYSIS ---")
    print(f"Official map : {OFFICIAL_MAP}")
    print(f"Satellite map: {SATELLITE_MAP}")
    print(f"Output dir   : {OUTPUT_DIR}")
    img_official = cv2.imread(OFFICIAL_MAP)
    
    if img_official is None:
        print(f"ERROR: Image '{OFFICIAL_MAP}' not found!")
        return

    img_satellite = cv2.imread(SATELLITE_MAP)
    img_satellite = cv2.resize(img_satellite, (img_official.shape[1], img_official.shape[0]))
    hsv = cv2.cvtColor(img_official, cv2.COLOR_BGR2HSV)

    # --- STEP 1: GENERATE MASKS (Explicit Detection) ---
    print("Generating Masks...")
    
    # Red Plots
    mask_red_raw = cv2.inRange(hsv, LOWER_RED1, UPPER_RED1) + cv2.inRange(hsv, LOWER_RED2, UPPER_RED2)
    kernel = np.ones((3,3), np.uint8)
    mask_red_clean = cv2.erode(mask_red_raw, kernel, iterations=3)
    mask_red_clean = cv2.dilate(mask_red_clean, kernel, iterations=1)

    # Zones
    mask_park = cv2.inRange(hsv, LOWER_PARK, UPPER_PARK)
    mask_unallotted = cv2.inRange(hsv, LOWER_UNALLOTTED, UPPER_UNALLOTTED)
    mask_water = cv2.inRange(hsv, LOWER_WATER, UPPER_WATER)
    mask_parking = cv2.inRange(hsv, LOWER_PARKING, UPPER_PARKING)
    
    # NEW: Explicit Road Detection (Not "Bitwise Not")
    mask_road = cv2.inRange(hsv, LOWER_ROAD, UPPER_ROAD)

    # Force Update Debug Images
    save_image("debug_1_park.jpg", mask_park)
    save_image("debug_2_unallotted.jpg", mask_unallotted)
    save_image("debug_3_parking.jpg", mask_parking)
    save_image("debug_4_road.jpg", mask_road)
    save_image("debug_5_water.jpg", mask_water)

    # --- STEP 2: IDENTIFY PLOTS ---
    print("\nIdentifying Plots...")
    plot_contours, _ = cv2.findContours(mask_red_clean, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
    valid_plot_contours = []
    plot_labels = {}
    
    for cnt in plot_contours:
        area = cv2.contourArea(cnt)
        if area > 1000 and area < (img_official.shape[0]*img_official.shape[1]*0.9):
            x, y, w, h = cv2.boundingRect(cnt)
            roi = img_official[y:y+h, x:x+w]
            plot_id = smart_ocr_reader(roi)
            valid_plot_contours.append(cnt)
            plot_labels[len(valid_plot_contours)-1] = plot_id

    # --- STEP 3: DETECT VIOLATIONS ---
    print("\nScanning for Encroachments...")
    gray1 = cv2.cvtColor(img_official, cv2.COLOR_BGR2GRAY)
    gray2 = cv2.cvtColor(img_satellite, cv2.COLOR_BGR2GRAY)
    diff = cv2.absdiff(gray1, gray2)
    thresh = cv2.threshold(diff, 30, 255, cv2.THRESH_BINARY)[1]
    
    mask_all_encroachments = cv2.erode(thresh, kernel, iterations=1)
    mask_all_encroachments = cv2.dilate(mask_all_encroachments, kernel, iterations=1)

    # Save Overall Evidence
    mask_overall_illegal = cv2.bitwise_and(mask_all_encroachments, cv2.bitwise_not(mask_red_clean))
    save_image("evidence_overall_encroachment.jpg", mask_overall_illegal)

    # Save Specific Zone Evidence
    save_image("evidence_park.jpg", cv2.bitwise_and(mask_all_encroachments, mask_park))
    save_image("evidence_unallotted.jpg", cv2.bitwise_and(mask_all_encroachments, mask_unallotted))
    save_image("evidence_parking.jpg", cv2.bitwise_and(mask_all_encroachments, mask_parking))
    save_image("evidence_road.jpg", cv2.bitwise_and(mask_all_encroachments, mask_road))
    save_image("evidence_water.jpg", cv2.bitwise_and(mask_all_encroachments, mask_water))

    # --- STEP 4: DRAW FINAL REPORT & COLLECT STATISTICS ---
    print("\n--- VIOLATION REPORT ---")
    violation_cnts, _ = cv2.findContours(mask_all_encroachments, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)

    alerts = []
    total_illegal_area = 0.0
    area_stats = {"PARK": 0.0, "UNALLOTTED": 0.0, "PARKING": 0.0, "ROAD": 0.0, "WATER": 0.0}

    for cnt in violation_cnts:
        area = cv2.contourArea(cnt)
        if area < 50:
            continue

        blob_mask = np.zeros_like(gray1)
        cv2.drawContours(blob_mask, [cnt], -1, 255, -1)

        # Skip legal (red plot) areas
        if cv2.countNonZero(cv2.bitwise_and(blob_mask, mask_red_clean)) > (area * 0.5):
            continue

        total_illegal_area += area
        culprit_name, dist = find_nearest_red_plot(cnt, valid_plot_contours, plot_labels, img_official)
        x, y, w, h = cv2.boundingRect(cnt)

        crimes = []
        box_gap = 0
        gap_increment = 4

        # 1. PARK -> GREEN
        if cv2.countNonZero(cv2.bitwise_and(blob_mask, mask_park)) > NOISE_THRESHOLD:
            crimes.append("PARK")
            area_stats["PARK"] += area
            cv2.rectangle(img_official, (x - box_gap, y - box_gap), (x + w + box_gap, y + h + box_gap), COLOR_GREEN, 2)
            box_gap += gap_increment

        # 2. UNALLOTTED -> RED
        if cv2.countNonZero(cv2.bitwise_and(blob_mask, mask_unallotted)) > NOISE_THRESHOLD:
            crimes.append("UNALLOTTED")
            area_stats["UNALLOTTED"] += area
            cv2.rectangle(img_official, (x - box_gap, y - box_gap), (x + w + box_gap, y + h + box_gap), COLOR_RED, 2)
            box_gap += gap_increment

        # 3. PARKING -> BROWN
        if cv2.countNonZero(cv2.bitwise_and(blob_mask, mask_parking)) > NOISE_THRESHOLD:
            crimes.append("PARKING")
            area_stats["PARKING"] += area
            cv2.rectangle(img_official, (x - box_gap, y - box_gap), (x + w + box_gap, y + h + box_gap), COLOR_BROWN, 2)
            box_gap += gap_increment

        # 4. ROAD -> YELLOW
        if cv2.countNonZero(cv2.bitwise_and(blob_mask, mask_road)) > NOISE_THRESHOLD:
            crimes.append("ROAD")
            area_stats["ROAD"] += area
            cv2.rectangle(img_official, (x - box_gap, y - box_gap), (x + w + box_gap, y + h + box_gap), COLOR_YELLOW, 2)
            box_gap += gap_increment

        # 5. WATER -> BLUE
        if cv2.countNonZero(cv2.bitwise_and(blob_mask, mask_water)) > NOISE_THRESHOLD:
            crimes.append("WATER")
            area_stats["WATER"] += area
            cv2.rectangle(img_official, (x - box_gap, y - box_gap), (x + w + box_gap, y + h + box_gap), COLOR_BLUE, 2)
            box_gap += gap_increment

        if crimes:
            alert_text = f"Plot {culprit_name}: {', '.join(crimes)} encroachment"
            print(f"ALERT: {alert_text}")
            alerts.append(alert_text)

    # Compute percentage of total illegal area per type
    final_percentages = {}
    if total_illegal_area > 0:
        for k, v in area_stats.items():
            if v > 0:
                final_percentages[k] = (v / total_illegal_area) * 100
    print("Encroachment stats (%):", final_percentages)

    # Save annotated overlay image (for UI) and full-resolution debug copy
    ensure_output_dir()
    overlay_path = os.path.join(OUTPUT_DIR, "encroachment-overlay.png")
    cv2.imwrite(overlay_path, img_official)
    print(f"Saved overlay image: {overlay_path}")
    save_image("final_report_map.jpg", img_official)

    # Generate bar chart of encroachment distribution
    chart_path = None
    if final_percentages and len(final_percentages) > 0:
        print(f"\nGenerating chart with stats: {final_percentages}")
        chart_path = generate_encroachment_chart(final_percentages, OUTPUT_DIR)
        if chart_path:
            print(f"Chart generated successfully at: {chart_path}")
        else:
            print("WARNING: Chart generation returned None")
    else:
        print("No statistics available for chart generation")

    # Generate PDF report with overlay, chart, stats, and alerts
    print(f"\nGenerating PDF report with chart_path={chart_path}")
    generate_pdf_report(
        OUTPUT_DIR,
        overlay_path,
        alerts,
        stats=final_percentages if final_percentages else None,
        chart_path=chart_path,
    )

    print("\nDone! Report includes encroachment distribution chart and statistics.")

if __name__ == "__main__":
    main()
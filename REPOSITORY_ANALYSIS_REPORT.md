# Final Land Encroachment Repository - Comprehensive Analysis Report

**Date:** February 13, 2026  
**Repository:** Final_Land_Encroachment  
**Analysis Type:** Complete Codebase Flow Analysis

---

## Executive Summary

This repository contains a **Government Land Allocation and Encroachment Detection System** built with:
- **Frontend/Backend:** Next.js 16 (App Router) with TypeScript
- **Database:** MongoDB with Mongoose ODM
- **Image Processing:** Python script using OpenCV, NumPy, and Tesseract OCR
- **Authentication:** JWT-based with role-based access control

The system enables citizens to apply for government land plots and allows administrators to detect encroachments by comparing official maps with satellite imagery.

---

## 1. Project Structure

### 1.1 Main Components

```
Final_Land_Encroachment/
├── Govt-Land-Analyser/          # Next.js web application
│   ├── src/
│   │   ├── app/                 # Next.js App Router pages & API routes
│   │   ├── components/          # React components
│   │   ├── lib/                 # Utilities (auth, db, config)
│   │   ├── models/              # Mongoose schemas
│   │   └── middleware.ts        # Route protection
│   └── public/                  # Static assets (maps, images)
│
└── map-superimpose/             # Python image processing script
    ├── final9.py                # Main encroachment detection script
    └── ppgvenv2/                # Python virtual environment
```

---

## 2. Data Models & Database Schema

### 2.1 User Model (`User.ts`)
- **Fields:**
  - `name`, `email` (unique), `passwordHash`, `contactNumber`
  - `role`: `"user" | "state_admin" | "district_admin" | "block_admin"`
  - `plotId`: String (optional, links to Plot)
  - `areaId`: String (optional, e.g., "area-1", "area-2", "area-3")
  - `createdAt`: Timestamp

- **Purpose:** Manages both citizen users and admin accounts with hierarchical permissions.

### 2.2 Plot Model (`Plot.ts`)
- **Fields:**
  - `plotId`: Number (unique identifier)
  - `points`: String (SVG polygon coordinates)
  - `bought`: Boolean (allocation status)
  - `leasePrice`: Number
  - `leaseDuration`: Number (years)
  - `boughtBy`: String (user email)
  - `allotmentDateTime`: Date

- **Collections:** Uses multiple MongoDB collections:
  - `plots` (default, area-1)
  - `plots1` (area-2)
  - `plots2` (area-3)

### 2.3 Application Model (`Application.ts`)
- **Fields:**
  - `user`: ObjectId (reference to User)
  - `userName`, `userEmail`, `contactNumber`
  - `latitude`, `longitude`: Number (GPS coordinates)
  - `addressDescription`: String (optional)
  - `quotedPrice`: Number
  - `status`: `"pending" | "approved" | "rejected"`
  - `createdAt`, `updatedAt`: Timestamps

- **Purpose:** Stores citizen applications for land allocation via map selection.

### 2.4 PendingRequest Model (`PendingRequest.ts`)
- **Fields:**
  - `plotId`: Number
  - `points`: String (plot polygon)
  - `quotedPrice`: Number
  - `purpose`: String
  - `quotedBy`: String (user email/ID)
  - `status`: String (default: "pending")
  - `submittedAt`: Date

- **Purpose:** Temporary requests awaiting admin approval/rejection.

### 2.5 Lease Model (`Lease.ts`)
- **Fields:**
  - `user`: ObjectId (reference to User)
  - `userEmail`: String
  - `plotId`: Number (unique)
  - `areaId`: String (optional)
  - `leaseYears`: Number
  - `allotmentDate`, `leaseEndDate`: Date
  - `status`: `"active" | "expired" | "warning_sent"`
  - `bidPrice`: Number
  - `createdAt`, `updatedAt`: Timestamps

- **Purpose:** Tracks active leases and expiration status.

### 2.6 Violation Model (`Violation.ts`)
- **Fields:**
  - `user`: ObjectId (optional, reference to User)
  - `plotId`: String
  - `areaId`: String
  - `violationStatus`: Boolean
  - `reportPdfPath`: String (legacy file path)
  - `reportFileId`: ObjectId (GridFS file reference)
  - `outputImagePath`: String (annotated image)
  - `adminComments`: String (optional)
  - `analyzedAt`, `createdAt`, `updatedAt`: Timestamps

- **Indexes:** Unique on `(areaId, plotId)`
- **Purpose:** Records encroachment violations detected by image analysis.

---

## 3. Authentication & Authorization

### 3.1 Authentication Flow
1. **Signup:**
   - Citizens: `/api/auth/signup` (creates `role: "user"`)
   - Admins: `/api/auth/admin/signup` (requires `ADMIN_SECRET` env var)

2. **Login:** `/api/auth/login`
   - Validates email/password
   - Returns JWT token stored in httpOnly cookie (`auth_token`)
   - Token expires in 7 days

3. **Session Check:** `/api/auth/me`
   - Returns current user info from JWT

### 3.2 Role-Based Access Control

**User Roles:**
- `user`: Citizens who can apply for plots
- `block_admin`: Can manage area-1 only
- `district_admin`: Can manage area-1 and area-2
- `state_admin`: Can manage all areas (area-1, area-2, area-3)

**Middleware Protection:**
- `/admin/*` routes require admin role
- `/user/*` routes require authentication
- Redirects to `/login` if unauthorized

### 3.3 Authorization Functions
- `getCurrentUser()`: Returns current user from JWT
- `requireAdmin()`: Returns admin user or null
- `isStateAdmin()`, `isDistrictAdmin()`, `isBlockAdmin()`: Type helpers

---

## 4. API Endpoints

### 4.1 Authentication APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/auth/signup` | POST | None | Citizen registration |
| `/api/auth/admin/signup` | POST | None | Admin registration (requires secret) |
| `/api/auth/login` | POST | None | User login |
| `/api/auth/login` | DELETE | None | Logout (clears cookie) |
| `/api/auth/me` | GET | Cookie | Get current user |

### 4.2 Plot Management APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/plots` | GET | None | Get plots (supports `?area=area-1`) |
| `/api/requests` | POST | Cookie | Submit land request |
| `/api/requests/all` | GET | Admin | Get all pending requests |
| `/api/admin/decision` | POST | Admin | Accept/reject request |

### 4.3 Application APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/applications` | POST | User | Create application |
| `/api/applications` | GET | Cookie | List applications (user sees own, admin sees all) |
| `/api/applications/[id]/status` | PATCH | Admin | Update application status |

### 4.4 Lease Management APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/lease/plot` | GET | Admin | Get lease for plot |
| `/api/lease/mine` | GET | User | Get user's lease |
| `/api/lease/flag` | POST | Admin | Flag lease as expired/warning |

### 4.5 Violation Detection APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/analyze` | POST | Admin | Run encroachment analysis (calls Python script) |
| `/api/violations/flag` | POST | Admin | Flag plot for violation |
| `/api/violations/mine` | GET | User | Get user's violation status |
| `/api/reports/[id]` | GET | None | Download PDF report (GridFS) |

### 4.6 Admin Management APIs

| Endpoint | Method | Auth | Description |
|----------|--------|------|-------------|
| `/api/admin/users` | GET | Admin | List all citizen users |
| `/api/admin/users` | POST | Admin | Assign plot/area to user |

---

## 5. Frontend Pages & Components

### 5.1 Public Pages

**`/` (Home Page)**
- Landing page with feature overview
- Links to signup/login

**`/signup`**
- Citizen registration form
- Creates user account with `role: "user"`

**`/login`**
- Dual-mode login (user/admin toggle)
- Redirects based on role after login

**`/admin/signup`**
- Admin registration (requires `ADMIN_SECRET`)
- Allows selecting admin level

### 5.2 User Dashboard (`/user`)

**Features:**
- **Map Selection:** Interactive SVG map with clickable plots
- **Plot Application:** Form to submit land request with purpose and quoted price
- **Lease Status:** Shows active lease with remaining days
- **Violation Alerts:** Displays encroachment warnings if detected
- **Multi-Area Support:** Dropdown to switch between industrial sectors

**Components:**
- `MapPicker`: SVG-based plot selector
- `LandRequestForm`: Application submission form

**Data Flow:**
1. User selects area → Fetches plots from `/api/plots?area=area-X`
2. User clicks plot → Shows application form
3. User submits → POST to `/api/requests`
4. Polls every 5 seconds for updates

### 5.3 Admin Dashboard (`/admin`)

**Features:**
- **Area Analysis Panel:** Select area and trigger encroachment analysis
- **Violation Map:** Click plots to flag violations
- **Pending Requests:** List of all land applications
- **Live Sync:** Polls every 3 seconds for new requests

**Components:**
- `AreaAnalysisPanel`: Area selector and analysis trigger
- `ViolationMap`: Plot selector for flagging violations
- Request approval/rejection buttons

**Data Flow:**
1. Admin selects area → Shows official/satellite maps
2. Admin clicks "Analyze" → POST to `/api/analyze`
3. Python script runs → Generates PDF + overlay image
4. Admin flags violations → POST to `/api/violations/flag`
5. Admin approves/rejects requests → POST to `/api/admin/decision`

### 5.4 Admin Lease Page (`/admin/lease`)

**Features:**
- View lease details for any plot
- Flag leases as expired/warning
- Filter by industrial area (role-based)

**Data Flow:**
1. Admin selects plot → GET `/api/lease/plot?plotId=X`
2. Admin flags lease → POST `/api/lease/flag`

---

## 6. Image Processing Pipeline (Python)

### 6.1 Script: `map-superimpose/final9.py`

**Purpose:** Compare official government maps with satellite imagery to detect encroachments.

**Dependencies:**
- OpenCV (`cv2`)
- NumPy
- Tesseract OCR (`pytesseract`)
- ReportLab (PDF generation)

### 6.2 Processing Steps

**1. Input:**
- Official map image (government layout)
- Satellite map image (current state)
- Output directory path

**2. Color-Based Zone Detection:**
- **Red:** Industrial plots (target areas)
- **Green:** Parks
- **Bold Green:** Unallocated land
- **Yellow:** Parking areas
- **Cyan:** Water bodies
- **Grey:** Roads

**3. Plot Identification:**
- Extracts red contours (plots)
- Uses OCR to read plot IDs from each contour
- Stores plot labels for violation attribution

**4. Encroachment Detection:**
- Converts both images to grayscale
- Computes absolute difference
- Thresholds differences to find changes
- Filters out legal plot areas

**5. Violation Attribution:**
- For each violation blob:
  - Finds nearest plot using centroid distance
  - Identifies zone type (park, road, water, etc.)
  - Generates alert message

**6. Output Generation:**
- **Overlay Image:** Annotated map with violation rectangles
- **PDF Report:** Includes overlay image + violation list
- **Debug Images:** Masks for each zone type

**7. Integration with Next.js:**
- Called via `/api/analyze` endpoint
- Spawns Python process: `python final9.py <official> <satellite> <output>`
- Uploads PDF to MongoDB GridFS
- Returns report URL and file ID

---

## 7. Key Workflows

### 7.1 Citizen Land Application Flow

```
1. User signs up → Creates account
2. User logs in → Gets JWT cookie
3. User selects industrial area → Fetches plots
4. User clicks plot on map → Shows application form
5. User fills form (purpose, quoted price) → Submits
6. POST /api/requests → Creates PendingRequest
7. Admin sees request in dashboard
8. Admin approves → Creates Lease, updates Plot, deletes PendingRequest
9. User sees lease status in dashboard
```

### 7.2 Encroachment Detection Flow

```
1. Admin selects industrial area
2. Admin clicks "Analyze Encroachment"
3. POST /api/analyze → Validates admin auth
4. Spawns Python script with map paths
5. Python script:
   - Loads official + satellite maps
   - Detects zones and plots
   - Compares images for differences
   - Generates violation report
   - Saves PDF + overlay image
6. Next.js uploads PDF to GridFS
7. Returns report URL to admin
8. Admin views report and flags violations
9. POST /api/violations/flag → Creates Violation record
10. User sees violation alert in dashboard
```

### 7.3 Lease Management Flow

```
1. Admin approves request → Creates Lease record
2. Lease has:
   - allotmentDate (now)
   - leaseEndDate (allotmentDate + leaseYears)
   - status: "active"
3. User dashboard shows remaining days
4. When lease expires → Status auto-updates to "expired"
5. Admin can flag lease → Status becomes "warning_sent"
6. User sees warning in dashboard
```

---

## 8. Environment Variables

### Required:
- `MONGODB_URI`: MongoDB connection string
- `MONGODB_DB`: Database name (optional)
- `JWT_SECRET`: Secret for JWT signing
- `ADMIN_SECRET`: Secret for admin registration (optional)

### Optional (for Python integration):
- `MAP_ANALYSIS_PYTHON_BIN`: Python executable path (default: "python")
- `MAP_ANALYSIS_SCRIPT_PATH`: Path to `final9.py`
- `MAP_ANALYSIS_OUTPUT_DIR`: Output directory for reports
- `MAP_ANALYSIS_USE_MOCK`: Set to "true" to skip Python execution (for testing)
- `MAP_ANALYSIS_PDF_NAME`: PDF filename (default: "encroachment-report.pdf")
- `MAP_ANALYSIS_IMAGE_NAME`: Overlay image filename (default: "encroachment-overlay.png")

---

## 9. Security Considerations

### 9.1 Authentication
- ✅ JWT tokens in httpOnly cookies (prevents XSS)
- ✅ Password hashing with bcrypt (salt rounds: 10)
- ✅ Role-based access control
- ⚠️ No CSRF protection (cookies use `sameSite: "lax"`)

### 9.2 Authorization
- ✅ Middleware protects admin/user routes
- ✅ API routes check user roles
- ✅ Admin secret required for admin signup
- ⚠️ No rate limiting on API endpoints

### 9.3 Data Validation
- ✅ Mongoose schema validation
- ✅ TypeScript type checking
- ⚠️ Limited input sanitization (relies on Mongoose)

---

## 10. Technical Stack

### Frontend:
- **Framework:** Next.js 16.1.6 (App Router)
- **Language:** TypeScript 5
- **Styling:** Tailwind CSS 4
- **React:** 19.2.3

### Backend:
- **Runtime:** Node.js (via Next.js API routes)
- **Database:** MongoDB with Mongoose 8.23.0
- **Auth:** JWT (jsonwebtoken 9.0.3, jose 6.1.3)
- **Password:** bcryptjs 3.0.3

### Image Processing:
- **Language:** Python 3
- **Libraries:** OpenCV, NumPy, Tesseract OCR, ReportLab

---

## 11. Database Collections

### MongoDB Collections:
1. **users** - User accounts (citizens + admins)
2. **plots** - Plot data for area-1
3. **plots1** - Plot data for area-2
4. **plots2** - Plot data for area-3
5. **applications** - Citizen applications
6. **pendingrequests** - Pending land requests
7. **leases** - Active lease records
8. **violations** - Encroachment violations
9. **reports.files** - GridFS bucket for PDF reports
10. **reports.chunks** - GridFS chunks for PDF reports

---

## 12. Industrial Areas Configuration

**Defined Areas:**
- **area-1:** Industrial Sector 1
  - Official map: `/assets/industrial-areas/area-1/official_map.jpg`
  - Satellite map: `/assets/industrial-areas/area-1/satellite_map.jpg`
  - Dimensions: 1020x872
  - Collection: `plots`

- **area-2:** Industrial Sector 2
  - Official map: `/assets/industrial-areas/area-2/official_map.jpg`
  - Satellite map: `/assets/industrial-areas/area-2/satellite_map.jpg`
  - Dimensions: 1274x564
  - Collection: `plots1`

- **area-3:** Industrial Sector 3
  - Official map: `/assets/industrial-areas/area-3/official_map.jpg`
  - Satellite map: `/assets/industrial-areas/area-3/satellite_map.jpg`
  - Dimensions: 1532x479
  - Collection: `plots2`

---

## 13. Known Issues & Limitations

### 13.1 Code Issues:
1. **🚨 CRITICAL BUG - JWT Payload Mismatch:** 
   - `/api/requests` route (line 36) expects `payload.id` but JWT token is signed with `payload.sub` (see `auth.ts` line 27)
   - This will cause all land request submissions to fail with "Invalid session data"
   - **Fix:** Change `payload.id` to `payload.sub` in `/api/requests/route.ts`

2. **Missing Error Handling:** Some API routes lack comprehensive error handling
3. **No Input Validation:** Limited validation on user inputs (e.g., email format, price ranges)
4. **Inconsistent JWT Libraries:** Uses both `jsonwebtoken` and `jose` libraries for JWT operations

### 13.2 Architecture Issues:
1. **No Transaction Support:** Multi-step operations (e.g., approve request) aren't atomic
2. **Polling Instead of WebSockets:** Frontend polls every 3-5 seconds instead of real-time updates
3. **Hardcoded Python Path:** Tesseract path hardcoded in Python script

### 13.3 Security Issues:
1. **No Rate Limiting:** API endpoints vulnerable to brute force
2. **No CSRF Protection:** Only relies on sameSite cookie
3. **Admin Secret in Code:** Should use secure secret management

---

## 14. Testing Recommendations

### API Testing:
- Test all authentication flows
- Test role-based access control
- Test plot allocation workflow
- Test violation detection pipeline
- Test lease expiration logic

### Integration Testing:
- Test Python script execution from Next.js
- Test GridFS file upload/download
- Test multi-area plot switching
- Test concurrent request handling

### Security Testing:
- Test JWT token expiration
- Test unauthorized access attempts
- Test SQL injection (MongoDB injection)
- Test XSS vulnerabilities

---

## 15. Deployment Considerations

### Prerequisites:
1. MongoDB instance (local or cloud)
2. Node.js 18+ runtime
3. Python 3.x with required packages
4. Tesseract OCR installed
5. Environment variables configured

### Build Steps:
```bash
cd Govt-Land-Analyser
npm install
npm run build
npm start
```

### Python Setup:
```bash
cd map-superimpose
# Activate virtual environment
source ppgvenv2/bin/activate  # Linux/Mac
# or
ppgvenv2\Scripts\activate    # Windows
# Install dependencies (if needed)
pip install opencv-python numpy pytesseract reportlab
```

---

## 16. Summary

This is a **comprehensive land management system** with:
- ✅ Full-stack web application (Next.js + MongoDB)
- ✅ Image processing pipeline (Python + OpenCV)
- ✅ Role-based access control
- ✅ Real-time violation detection
- ✅ Lease management
- ✅ Multi-area support

**Strengths:**
- Well-structured codebase
- Clear separation of concerns
- Modern tech stack
- Comprehensive feature set

**Areas for Improvement:**
- Add comprehensive error handling
- Implement WebSockets for real-time updates
- Add input validation and sanitization
- Implement rate limiting
- Add comprehensive test coverage

---

---

## 17. Critical Findings & Action Items

### 🚨 Critical Bug Found:

**Issue:** JWT Payload Field Mismatch in `/api/requests`
- **Location:** `Govt-Land-Analyser/src/app/api/requests/route.ts:36`
- **Problem:** Code tries to access `payload.id` but JWT token uses `payload.sub`
- **Impact:** All land request submissions will fail with "Invalid session data" error
- **Fix:** Change line 36 from:
  ```typescript
  const userId = payload.id as string || payload.email as string;
  ```
  To:
  ```typescript
  const userId = payload.sub as string || payload.email as string;
  ```

### ⚠️ High Priority Issues:

1. **Inconsistent JWT Libraries:**
   - Uses `jsonwebtoken` for signing (auth.ts)
   - Uses `jose` for verification (requests/route.ts)
   - **Recommendation:** Standardize on one library

2. **Missing Input Validation:**
   - No email format validation
   - No price range validation
   - No plot ID format validation
   - **Recommendation:** Add Zod or similar validation library

3. **No Transaction Support:**
   - Approving a request involves multiple DB operations (Plot update, Lease create, PendingRequest delete)
   - If any step fails, data can be inconsistent
   - **Recommendation:** Use MongoDB transactions

### 📋 Medium Priority Improvements:

1. Replace polling with WebSockets for real-time updates
2. Add rate limiting to prevent API abuse
3. Add comprehensive error logging
4. Add unit tests for critical flows
5. Add API documentation (OpenAPI/Swagger)

---

## 18. API Testing Notes

**Note:** API testing was not performed due to:
- No running server instance available
- No MongoDB connection configured
- No environment variables set up

**Recommended Testing Approach:**
1. Set up local MongoDB instance
2. Configure environment variables
3. Run `npm run dev` in `Govt-Land-Analyser`
4. Test all API endpoints using Postman/curl
5. Verify Python script execution with sample images

---

**Report Generated:** February 13, 2026  
**Analysis Completed:** ✅  
**Critical Bugs Found:** 1  
**Recommendations:** 8

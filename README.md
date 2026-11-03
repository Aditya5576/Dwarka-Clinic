# Dr. Baldawa's Dwarka Clinic — Patient Intake & Receptionist Management PWA

> **Location:** Lane No. 8, Opp. Terapanthi Bhavan, Purtiwadi, Jaysingpur  
> **Type:** Mobile-First, Offline-Resilient Progressive Web Application (PWA) with IndexedDB & CSV Export

---

## 1. Multi-Laptop Git Workflow

This project is configured for continuous synchronization between laptops (e.g., Clinic Desk Laptop & Personal/Doctor's Laptop).

### Initial Setup on Second Laptop (Personal Laptop)
Run these commands once on the second machine:
```bash
# 1. Clone repository from GitHub
git clone https://github.com/Aditya5576/Dwarka-Clinic.git

# 2. Enter workspace directory
cd Dwarka-Clinic

# 3. Install dependencies
npm install

# 4. Start local development
npm run dev
```

### Daily Dual-Laptop Handover Workflow
Use the provided one-click sync scripts to avoid merge conflicts:

#### 1. Before Starting Work (On Any Laptop)
Fetch and rebase the latest commits from `origin main`:
- **Windows:** Double-click or run `.\sync-pull.bat`
- **Linux/macOS:** Run `./sync-pull.sh`

#### 2. After Finishing Work (Before Switching Laptops)
Stage, commit, and push your changes to GitHub:
- **Windows:** Double-click or run `.\sync-push.bat "your commit message"`
- **Linux/macOS:** Run `./sync-push.sh "your commit message"`

---

## 2. Local Development & Testing

```bash
# Install dependencies
npm install

# Start local development server
npm run dev

# Run production build & typecheck
npm run build

# Preview production build locally
npm run preview
```

Open `http://localhost:5173` on your browser. To preview the mobile receptionist experience, press `F12` and toggle Device Toolbar (`Ctrl+Shift+M`) to a smartphone viewport (e.g. Pixel 7 or iPhone 14 Pro).

---

## 3. Operational Credentials

- **Receptionist Login:**
  - **Email:** `reception@dwarkaclinic.com`
  - **Password:** `reception123`

---

## 4. Key Architectural Guarantees

1. **Zero-Cost Infrastructure:** Runs 100% client-side via IndexedDB and Service Worker cache. No server hosting fees or subscription lock-in.
2. **Offline-First:** All patient check-ins and queue entries persist directly to the browser's IndexedDB. Works seamlessly without an active internet connection.
3. **Automated Fee Calculation:**
   - ₹100 for existing patients within a 30-day follow-up window.
   - ₹200 for new patients or visits exceeding 30 days.
4. **Digital Receipt & WhatsApp Slip:** Instant 1-click printable receipt and prefilled WhatsApp message generator.


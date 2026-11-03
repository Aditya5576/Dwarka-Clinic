# FLOW.md — Operational & Clinical Workflows

> Dr. Baldawa's Dwarka Clinic (Jaysingpur) — Milestone 1 Intake & Financial Operations

---

## 1. System Navigation & Architecture Flow

```mermaid
flowchart TD
    A["Receptionist Enters App"] --> B{"Session Stored in LocalStorage?"}
    B -->|No| C["Login Screen<br/>(reception@dwarkaclinic.com)"]
    C -->|Success| D["Check IndexedDB & Pre-Seed Test Patients"]
    B -->|Yes| D
    D --> E["Navigation Shell (Mobile Bottom Bar / Desktop Header)"]
    E --> F["Tab 1: Check-In (Default)"]
    E --> G["Tab 2: Reminders (Due 25-30 Days)"]
    E --> H["Tab 3: Reports (Shift Tallies & Cash vs UPI)"]
    E --> I["Tab 4: Logs (Historical Patient Intakes)"]
```

---

## 2. Check-In & Fee Automation Workflow

```mermaid
flowchart TD
    A["Receptionist Types 10-Digit Mobile"] --> B{"Lookup in IndexedDB"}
    B -->|No Match| C["Display New Patient Form<br/>(Pre-filled Phone)"]
    C --> D["Assign Next Sequential ID (e.g. DC-0004)"]
    D --> E["System Enforced Fee: ₹200 (New Patient)"]
    
    B -->|Multiple Family Members| F["Display Member Selection Cards"]
    F -->|Choose Member| G["Load Patient Record"]
    F -->|'+ Add Family Member'| H["New Intake with Same Mobile"]
    H --> D
    
    B -->|Single Match| G
    G --> I{"Days Since lastVisitDate <= 30?"}
    I -->|Yes| J["System Enforced Fee: ₹100<br/>(Follow-Up Subsidized)"]
    I -->|No| K["System Enforced Fee: ₹200<br/>(Renewal Rate)"]
    
    E --> L["Select Payment Mode [ Cash / UPI ]"]
    J --> L
    K --> L
    
    L --> M["Auto-Detect Shift<br/>(Morning: 11am-2pm / Evening: 5pm-8:30pm)"]
    M --> N["Submit Check-In"]
    N --> O["IndexedDB Atomic Transaction:<br/>1. Save Visit Record<br/>2. Update/Save Patient Record (lastVisitDate = NOW)"]
    O --> P["Open Digital Receipt Modal"]
```

---

## 3. Receipt & WhatsApp Dispatch Workflow

```mermaid
flowchart TD
    A["Receipt Modal Opened"] --> B["Display Details:<br/>Clinic Header, Patient ID, Name, Phone, Shift, Paid Amount, Mode"]
    B --> C["Compute 30-Day Follow-Up Expiry:<br/>Valid Until = Visit Date + 30 Days"]
    C --> D["Options:"]
    D --> E["[ Print Slip ] → window.print() (Thermal/A4 Printable Layout)"]
    D --> F["[ WhatsApp ] → Opens wa.me/91<phone> with Pre-Formatted Bill Text"]
    D --> G["[ Next Check-in ] → Resets Intake Form for Next Patient"]
```

---

## 4. 30-Day Subsidized Follow-Up Reminders Workflow

```mermaid
flowchart TD
    A["Receptionist Opens 'Reminders' Tab"] --> B["Scan All Patients in IndexedDB"]
    B --> C{"Days Since lastVisitDate between 25 and 30?"}
    C -->|Yes| D["Add to Urgent Reminder List (Sorted by Days Remaining)"]
    C -->|No| E["Exclude"]
    D --> F["Display Patient Card with Remaining Days Warning"]
    F --> G["1-Click WhatsApp Reminder Button"]
    G --> H["Dispatches Polite Marathi/English Follow-up Notice via wa.me"]
```

---

## 5. Shift Tallies & Financial Reports Workflow

```mermaid
flowchart TD
    A["Receptionist Opens 'Reports' Tab"] --> B["Select Date (Defaults to Today)"]
    B --> C["Aggregate Visits in IndexedDB:"]
    C --> D["Morning Shift (11:00 AM – 2:00 PM):<br/>Cash + UPI + Subtotal"]
    C --> E["Evening Shift (5:00 PM – 8:30 PM):<br/>Cash + UPI + Subtotal"]
    C --> F["Grand Total (Total Cash, Total UPI, Revenue, Patient Count)"]
    B --> G["[ Export All Records (CSV) ] → Downloads Formatted .csv File"]
```

---

## 6. Multi-Laptop Git Synchronization Flow

```mermaid
sequenceDiagram
    participant Laptop1 as Clinic Desk Laptop
    participant GitHub as Remote Repository (origin main)
    participant Laptop2 as Doctor's / Home Laptop

    Note over Laptop1: Receptionist completes evening shift
    Laptop1->>GitHub: sync-push.bat (git add . + git commit + git push)
    Note over GitHub: Changes updated on origin main
    
    Note over Laptop2: Doctor opens home laptop
    Laptop2->>GitHub: sync-pull.bat (git pull --rebase origin main)
    Note over Laptop2: Working tree synchronized without merge conflicts!
```

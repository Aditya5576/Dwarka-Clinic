import { test, expect, Page } from '@playwright/test';

/**
 * Helper to seed a test patient and today's visits (both Morning & Evening shifts)
 * into IndexedDB directly so Doctor Desk queue is populated immediately.
 */
async function seedPatientAndVisits(page: Page) {
  await page.evaluate(async () => {
    return new Promise((resolve, reject) => {
      const openReq = indexedDB.open('DwarkaClinicDB');
      openReq.onsuccess = () => {
        const idb = openReq.result;
        if (!idb.objectStoreNames.contains('patients') || !idb.objectStoreNames.contains('visits')) {
          return resolve(false);
        }
        const stores = ['patients', 'visits'];
        if (idb.objectStoreNames.contains('prescriptions')) {
          stores.push('prescriptions');
        }
        const tx = idb.transaction(stores, 'readwrite');
        const now = new Date().toISOString();

        const patient = {
          id: 'DC-0001',
          name: 'Ramesh Patil',
          phone: '9876543210',
          city: 'Jaysingpur',
          createdAt: now,
          lastVisitDate: now,
        };

        const visitMorningId = 'VST-TEST-M-001';
        const visitMorning = {
          id: visitMorningId,
          patientId: 'DC-0001',
          phone: '9876543210',
          date: new Date(Date.now() - 3600000).toISOString(),
          shift: 'Morning',
          mode: 'Cash',
          amount: 200,
        };

        const visitMorningWaiting = {
          id: `VST-TEST-M-WAITING-${Date.now()}`,
          patientId: 'DC-0001',
          phone: '9876543210',
          date: now,
          shift: 'Morning',
          mode: 'Cash',
          amount: 200,
        };

        const visitEvening = {
          id: `VST-TEST-E-${Date.now()}`,
          patientId: 'DC-0001',
          phone: '9876543210',
          date: now,
          shift: 'Evening',
          mode: 'Cash',
          amount: 200,
        };

        const completedPrescription = {
          id: 'RX-TEST-COMPLETED-001',
          visitId: visitMorningId,
          patientId: 'DC-0001',
          patientName: 'Ramesh Patil',
          patientPhone: '9876543210',
          patientCity: 'Jaysingpur',
          consultationDate: now.slice(0, 10),
          shift: 'Morning',
          doctorFee: 200,
          diagnosisNotes: 'Acne Vulgaris & Melasma',
          medications: [
            {
              name: 'Itraconazole 100mg',
              type: 'Capsule',
              dosage: '1 Cap',
              timing: 'After Lunch',
              duration: '15 Days'
            },
            {
              name: 'Minocycline 100mg',
              type: 'Capsule',
              dosage: '1 Cap',
              timing: 'After Dinner',
              duration: '10 Days'
            },
            {
              name: 'Minoxidil 5% Solution',
              type: 'Lotion',
              dosage: '1 ml',
              timing: 'Night',
              duration: '30 Days'
            }
          ],
          procedures: [
            {
              name: 'Salicylic Acid Peel (20%)',
              category: 'Chemical Peel',
              fee: 500
            }
          ],
          procedureFeeTotal: 500,
          followUpDays: 15,
          nextFollowUpDate: new Date(Date.now() + 15 * 86400000).toISOString().slice(0, 10),
          paperRxPhoto: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==',
          createdAt: now
        };

        const pastPrescription = {
          id: 'RX-TEST-001',
          visitId: 'VST-TEST-PAST',
          patientId: 'DC-0001',
          patientName: 'Ramesh Patil',
          patientPhone: '9876543210',
          patientCity: 'Jaysingpur',
          consultationDate: '2026-11-01',
          shift: 'Morning',
          doctorFee: 200,
          diagnosisNotes: 'Acne Vulgaris Grade II',
          medications: [
            {
              name: 'Itraconazole',
              type: 'Capsule',
              dosage: '100mg',
              timing: 'After lunch',
              duration: '15 Days'
            }
          ],
          followUpDays: 15,
          nextFollowUpDate: '2026-11-16',
          createdAt: now
        };

        const pastDate = new Date(Date.now() - 20 * 86400000).toISOString();
        const expectedFollowUp = new Date(Date.now() - 5 * 86400000).toISOString().slice(0, 10);

        const overduePatient = {
          id: 'DC-0002',
          name: 'Sunita Khot',
          phone: '9421198765',
          city: 'Purtiwadi',
          createdAt: pastDate,
          lastVisitDate: pastDate,
          nextFollowUpDate: expectedFollowUp
        };

        const overdueVisit = {
          id: 'VST-OVERDUE-002',
          patientId: 'DC-0002',
          patientName: 'Sunita Khot',
          phone: '9421198765',
          date: pastDate,
          shift: 'Morning',
          mode: 'UPI',
          amount: 200,
          expectedFollowUpDate: expectedFollowUp
        };

        const overduePrescription = {
          id: 'RX-OVERDUE-002',
          visitId: 'VST-OVERDUE-002',
          patientId: 'DC-0002',
          patientName: 'Sunita Khot',
          patientPhone: '9421198765',
          patientCity: 'Purtiwadi',
          consultationDate: pastDate.slice(0, 10),
          shift: 'Morning',
          doctorFee: 200,
          diagnosisNotes: 'Chemical Peel Follow-up',
          medications: [],
          procedures: [
            {
              name: 'Salicylic Acid Peel (20%)',
              category: 'Chemical Peel',
              fee: 500
            }
          ],
          procedureFeeTotal: 500,
          followUpDays: 15,
          nextFollowUpDate: expectedFollowUp,
          createdAt: pastDate
        };

        tx.objectStore('patients').put(patient);
        tx.objectStore('patients').put(overduePatient);
        tx.objectStore('visits').put(visitMorning);
        tx.objectStore('visits').put(visitMorningWaiting);
        tx.objectStore('visits').put(visitEvening);
        tx.objectStore('visits').put(overdueVisit);
        if (stores.includes('prescriptions')) {
          tx.objectStore('prescriptions').put(completedPrescription);
          tx.objectStore('prescriptions').put(pastPrescription);
          tx.objectStore('prescriptions').put(overduePrescription);
        }

        tx.oncomplete = () => resolve(true);
        tx.onerror = (e) => reject(e);
      };
      openReq.onerror = (e) => reject(e);
    });
  });
}

async function dismissSplash(page: Page) {
  const splash = page.locator('[data-testid="splash-screen"]');
  if (await splash.count() > 0) {
    await splash.dispatchEvent('click').catch(() => {});
    await splash.waitFor({ state: 'detached', timeout: 5000 }).catch(() => {});
  }
}

/**
 * Standard Doctor Desk Login Flow:
 * 1. Dismiss Splash Screen
 * 2. Switch to 'Doctor Consultation' tab
 * 3. Enter password 'doctor2009'
 * 4. Submit and await Doctor Desk rendering
 */
async function loginAsDoctor(page: Page) {
  const doctorDeskTitle = page.locator('[data-testid="doctor-desk-title"]');
  if (await doctorDeskTitle.isVisible().catch(() => false)) {
    return;
  }

  await dismissSplash(page);

  // Wait for login screen
  await page.waitForSelector('[data-testid="tab-doctor-login"]', { timeout: 10000 });
  await page.click('[data-testid="tab-doctor-login"]');

  // Fill Doctor password and submit
  await page.waitForSelector('[data-testid="doctor-password-input"]', { timeout: 10000 });
  await page.fill('[data-testid="doctor-password-input"]', 'doctor2009');
  await page.click('[data-testid="btn-unlock-doctor-desk"]');

  // Await Doctor Desk
  await page.waitForSelector('[data-testid="doctor-desk-title"]', { timeout: 10000 });
}

/**
 * Helper to transition from Doctor Home to Active Consultation Room
 */
async function openConsultationRoom(page: Page) {
  await loginAsDoctor(page);
  const startBtn = page.locator('[data-testid="btn-start-consultation"]', { hasText: 'Start Consultation' }).first();
  await expect(startBtn).toBeVisible({ timeout: 10000 });
  await startBtn.click();
  await page.waitForSelector('[data-testid="btn-back-to-queue"]', { timeout: 10000 });
}

/**
 * Helper to log in as Receptionist
 */
async function loginAsReceptionist(page: Page) {
  const clinicTitle = page.locator('[data-testid="navbar-clinic-title"]');
  if (await clinicTitle.isVisible().catch(() => false)) {
    return;
  }

  await dismissSplash(page);

  // Wait for login screen
  await page.waitForSelector('[data-testid="tab-reception-login"]', { timeout: 10000 });
  await page.click('[data-testid="tab-reception-login"]');

  // Submit default reception credentials
  const submitBtn = page.locator('button', { hasText: 'Login to Reception Desk' });
  await expect(submitBtn).toBeVisible({ timeout: 10000 });
  await submitBtn.click();

  // Await Reception Navbar
  await page.waitForSelector('[data-testid="navbar-clinic-title"]', { timeout: 10000 });
}

test.describe('Milestone 2: UI Integrity & Layout Truncation Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate once to establish origin and initialize IndexedDB schemas
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    await dismissSplash(page);
    await page.waitForSelector('[data-testid="tab-reception-login"]', { timeout: 10000 });

    // Seed test patient and visits
    await seedPatientAndVisits(page);
  });

  /**
   * Test 1: Doctor banner text visibility & no ellipsis truncation
   */
  test('Test 1: Doctor desk banner text renders fully without ellipsis truncation', async ({ page }) => {
    await loginAsDoctor(page);

    const bannerTitle = page.locator('[data-testid="doctor-desk-title"]');
    const bannerSubtitle = page.locator('[data-testid="doctor-desk-subtitle"]');

    await expect(bannerTitle).toBeVisible();
    await expect(bannerSubtitle).toBeVisible();

    const titleText = await bannerTitle.innerText();
    expect(titleText).toContain("DR. SANDEEP BALDAWA'S CONSULTATION DESK");

    const subtitleText = await bannerSubtitle.innerText();
    expect(subtitleText).toContain("M.B.B.S., D.D.V.");
    expect(subtitleText).toContain("Consultant Dermatologist & Trichologist");
    expect(subtitleText).toContain("Jaysingpur");

    // Verify computed styles: text-overflow must NOT be 'ellipsis'
    const titleStyles = await bannerTitle.evaluate((el) => window.getComputedStyle(el));
    expect(titleStyles.textOverflow).not.toBe('ellipsis');

    const subtitleStyles = await bannerSubtitle.evaluate((el) => window.getComputedStyle(el));
    expect(subtitleStyles.textOverflow).not.toBe('ellipsis');
  });

  /**
   * Test 2: Top navbar mobile header layout (360px viewport)
   */
  test('Test 2: Top navbar mobile header fits within 360px without clipping or horizontal overflow', async ({ page }) => {
    await loginAsDoctor(page);

    const clinicTitle = page.locator('[data-testid="navbar-clinic-title"]');
    await expect(clinicTitle).toBeVisible();

    const titleText = await clinicTitle.innerText();
    expect(titleText).toContain("Dr. Baldawa's Dwarka Clinic");

    // Title must not have ellipsis truncation
    const titleStyles = await clinicTitle.evaluate((el) => window.getComputedStyle(el));
    expect(titleStyles.textOverflow).not.toBe('ellipsis');

    // Verify document width does not cause horizontal overflow
    const viewportWidth = page.viewportSize()?.width || 360;
    const documentScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);

    if (viewportWidth <= 412) {
      expect(documentScrollWidth).toBeLessThanOrEqual(viewportWidth);
    }
  });

  /**
   * Test 3: Inline Collapsible Consultation History Card
   */
  test('Test 3: Consultation history expands inline in document flow without horizontal overflow and collapses cleanly', async ({ page }) => {
    await openConsultationRoom(page);

    // Locate accordion header button
    const historyToggleBtn = page.locator('[data-testid="btn-toggle-history"]');
    await expect(historyToggleBtn).toBeVisible({ timeout: 10000 });

    const toggleText = await historyToggleBtn.innerText();
    expect(toggleText).toContain('CONSULTATION & RX HISTORY');

    // Inline card should initially be collapsed
    const inlineCard = page.locator('[data-testid="inline-history-card"]');
    await expect(inlineCard).not.toBeVisible();

    // Click to expand inline history
    await historyToggleBtn.click();

    // Verify inline card expands in native document flow
    await expect(inlineCard).toBeVisible();

    // Verify background body is NOT fixed (no modal scroll-jacking)
    const bodyPosition = await page.evaluate(() => document.body.style.position);
    expect(bodyPosition).not.toBe('fixed');

    // Verify zero horizontal overflow on expanded view
    const viewportWidth = page.viewportSize()?.width || 360;
    const documentScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    if (viewportWidth <= 412) {
      expect(documentScrollWidth).toBeLessThanOrEqual(viewportWidth);
    }

    // Verify previous visit card details render inside the inline card
    await expect(inlineCard.getByText('Date:', { exact: false }).first()).toBeVisible();
    await expect(inlineCard.getByText('Fee:', { exact: false }).first()).toBeVisible();

    // Click again to collapse
    await historyToggleBtn.click();
    await expect(inlineCard).not.toBeVisible();

    // Verify returning to Waiting Queue via back button
    const backBtn = page.locator('[data-testid="btn-back-to-queue"]');
    await expect(backBtn).toBeVisible();
    await backBtn.click();
    await expect(page.locator('[data-testid="queue-cards-grid"]')).toBeVisible();
  });

  /**
   * Test 4: Prescription prescriber mobile viewport cards & touch target heights
   */
  test('Test 4: Mobile prescription cards render labels and action buttons have touch target height >= 44px', async ({ page }) => {
    await openConsultationRoom(page);

    // Wait for prescriber section
    const searchInput = page.locator('[data-testid="medication-search-input"]');
    await expect(searchInput).toBeVisible({ timeout: 10000 });

    // Search and select a medication from catalog
    await searchInput.fill('Itraconazole');
    const firstCatalogItem = page.locator('[data-testid="catalog-item-0"]');
    await expect(firstCatalogItem).toBeVisible({ timeout: 5000 });
    await firstCatalogItem.click();

    const viewportWidth = page.viewportSize()?.width || 360;

    if (viewportWidth < 1024) {
      // Mobile Viewport: Verify touch-friendly stacked card is displayed
      const mobileCard = page.locator('[data-testid="mobile-rx-card"]');
      await expect(mobileCard).toBeVisible();

      // Verify explicit uppercase field labels inside mobile card
      await expect(mobileCard.locator('label', { hasText: 'Medicine Name' })).toBeVisible();
      await expect(mobileCard.locator('label', { hasText: 'Form' })).toBeVisible();
      await expect(mobileCard.locator('label', { hasText: 'Dosage' })).toBeVisible();
    }

    // Verify all 3 primary action buttons are visible and satisfy >= 44px touch-target height
    const btnComplete = page.locator('[data-testid="btn-save-complete"]');
    const btnPrint = page.locator('[data-testid="btn-save-print"]');
    const btnWhatsApp = page.locator('[data-testid="btn-save-whatsapp"]');

    await expect(btnComplete).toBeVisible();
    await expect(btnPrint).toBeVisible();
    await expect(btnWhatsApp).toBeVisible();

    const buttons = [
      { name: 'Save & Complete', locator: btnComplete },
      { name: 'Save & Print Rx Slip', locator: btnPrint },
      { name: 'Save & WhatsApp Rx', locator: btnWhatsApp },
    ];

    for (const { name, locator } of buttons) {
      const box = await locator.boundingBox();
      expect(box, `Button ${name} bounding box`).not.toBeNull();
      expect(box!.height, `Button ${name} height (${box!.height}px) >= 44px`).toBeGreaterThanOrEqual(44);
    }
  });

  /**
   * Test 5: Doctor Shift Analytics ribbon renders waiting count, completed count, and total collections
   */
  test('Test 5: Doctor shift analytics ribbon renders operational metrics and financial breakdown', async ({ page }) => {
    await loginAsDoctor(page);

    const analyticsRibbon = page.locator('[data-testid="doctor-shift-analytics"]');
    await expect(analyticsRibbon).toBeVisible({ timeout: 10000 });

    const ribbonText = await analyticsRibbon.innerText();
    expect(ribbonText.toUpperCase()).toContain('PATIENTS WAITING');
    expect(ribbonText.toUpperCase()).toContain('COMPLETED TODAY');
    expect(ribbonText.toUpperCase()).toContain('TOTAL COLLECTIONS');
    expect(ribbonText).toContain('Cons / Proc:');
    expect(ribbonText).toContain('Cash / UPI:');

    // Also verify waiting queue cards grid is rendered on Doctor Home
    const queueGrid = page.locator('[data-testid="queue-cards-grid"]');
    await expect(queueGrid).toBeVisible();
  });

  /**
   * Test 6: In-Clinic Procedure prescriber search, item selection, and dynamic fee updating
   */
  test('Test 6: In-clinic procedure prescriber allows search, selection, and updates total bill', async ({ page }) => {
    await openConsultationRoom(page);

    const procSearchInput = page.locator('[data-testid="procedure-search-input"]');
    await expect(procSearchInput).toBeVisible({ timeout: 10000 });

    // Search for a chemical peel
    await procSearchInput.fill('Salicylic');
    const firstProcItem = page.locator('[data-testid="procedure-catalog-item-0"]');
    await expect(firstProcItem).toBeVisible({ timeout: 5000 });
    await firstProcItem.click();

    // Verify prescribed procedures list renders
    const procList = page.locator('[data-testid="prescribed-procedures-list"]');
    await expect(procList).toBeVisible();

    // Verify procedure name appears in list according to viewport
    const viewportWidth = page.viewportSize()?.width || 360;
    if (viewportWidth < 1024) {
      const mobileProcCard = page.locator('[data-testid="mobile-procedure-card"]');
      await expect(mobileProcCard).toBeVisible();
      await expect(mobileProcCard.locator('input').first()).toHaveValue('Salicylic Acid Peel (20% / 30%)');
    } else {
      await expect(procList.locator('table input').first()).toHaveValue('Salicylic Acid Peel (20% / 30%)');
    }

    // Verify Total bill in Action Bar includes procedure fee
    const actionBar = page.locator('div', { hasText: 'Consultation:' }).last();
    await expect(actionBar).toBeVisible();
    const actionText = await actionBar.innerText();
    expect(actionText).toContain('Procedures:');
  });

  /**
   * Test 7: Fuzzy search typo tolerance & multi-row medicine autocomplete
   */
  test('Test 7: Fuzzy search tolerates typos ("Novnib") and dynamic row autocomplete suggestions work', async ({ page }) => {
    await openConsultationRoom(page);

    const medInput = page.locator('[data-testid="medication-search-input"]');
    await expect(medInput).toBeVisible({ timeout: 10000 });

    // Type with deliberate typo "Novnib" (1 character omission of 'a')
    await medInput.fill('Novnib');
    const catalogDropdown = page.locator('[data-testid="catalog-item-0"]');
    await expect(catalogDropdown).toBeVisible({ timeout: 5000 });

    // Verify Novanib-T is suggested
    const suggestedText = await catalogDropdown.innerText();
    expect(suggestedText).toContain('Novanib');

    // Click to add medicine
    await catalogDropdown.click();

    // Verify dynamic row has rendered
    const viewportWidth = page.viewportSize()?.width || 360;
    if (viewportWidth < 1024) {
      const rowInput = page.locator('[data-testid="mobile-med-name-input-0"]');
      await expect(rowInput).toBeVisible();
      expect(await rowInput.inputValue()).toContain('Novanib');
    } else {
      const rowInput = page.locator('[data-testid="table-med-name-input-0"]');
      await expect(rowInput).toBeVisible();
      expect(await rowInput.inputValue()).toContain('Novanib');
    }
  });

  /**
   * Test 8: Read-Only Consultation Review mode and role-based fee segregation
   */
  test('Test 8: Saving consultation switches to completed state and review mode displays segregated fees and action buttons', async ({ page }) => {
    await openConsultationRoom(page);

    // Save consultation without slip
    const btnComplete = page.locator('[data-testid="btn-save-complete"]');
    await expect(btnComplete).toBeVisible();
    await btnComplete.click();

    // Verify returned to Doctor Queue or shows success
    await expect(page.locator('[data-testid="doctor-desk-title"]')).toBeVisible({ timeout: 10000 });

    // Switch to 'Seen' filter
    const seenFilterTab = page.locator('button', { hasText: 'Seen' }).first();
    await seenFilterTab.click();

    // Click on the completed patient card
    const reviewBtn = page.locator('[data-testid="btn-start-consultation"]').first();
    await expect(reviewBtn).toBeVisible();
    await reviewBtn.click();

    // Verify Read-Only Consultation Card renders
    const readOnlyCard = page.locator('[data-testid="readonly-consultation-card"]');
    await expect(readOnlyCard).toBeVisible({ timeout: 10000 });

    // Verify role-based fee segregation labels
    await expect(readOnlyCard.getByText('Reception Intake', { exact: false })).toBeVisible();
    await expect(readOnlyCard.getByText('Doctor Fee', { exact: false })).toBeVisible();
    await expect(readOnlyCard.getByText('Grand Bill Total', { exact: false })).toBeVisible();

    // Verify review action buttons
    const btnEdit = page.locator('[data-testid="btn-review-edit"]');
    const btnPrint = page.locator('[data-testid="btn-review-print"]');
    const btnResendWhatsApp = page.locator('[data-testid="btn-review-resend-whatsapp"]');
    const btnClose = page.locator('[data-testid="btn-review-close"]');

    await expect(btnEdit).toBeVisible();
    await expect(btnPrint).toBeVisible();
    await expect(btnResendWhatsApp).toBeVisible();
    await expect(btnClose).toBeVisible();

    // Clicking Edit switches to editable prescription form
    await btnEdit.click();
    await expect(page.locator('[data-testid="medication-search-input"]')).toBeVisible();
  });

  /**
   * Test 9: Milestone 3: Multi-Visit Prescription Continuity & Cloning
   */
  test('Test 9: Multi-visit prescription continuity allows repeating last prescription with one tap', async ({ page }) => {
    await openConsultationRoom(page);

    // Locate "Repeat Last Prescription" button
    const repeatBtn = page.locator('[data-testid="btn-repeat-last-rx"]');
    await expect(repeatBtn).toBeVisible({ timeout: 10000 });

    // Click Repeat Last Prescription
    await repeatBtn.click();

    // Verify Success Toast appears confirming cloned medications
    const toast = page.locator('[data-testid="doctor-success-toast"]');
    await expect(toast).toBeVisible({ timeout: 5000 });
    const toastText = await toast.innerText();
    expect(toastText).toContain('Copied');
    expect(toastText).toContain('medication');

    // Verify medication row populated with Itraconazole from seeded past visit
    const viewportWidth = page.viewportSize()?.width || 360;
    if (viewportWidth < 1024) {
      const mobileInput = page.locator('[data-testid="mobile-med-name-input-0"]');
      await expect(mobileInput).toBeVisible();
      expect(await mobileInput.inputValue()).toContain('Itraconazole');
    } else {
      const rowInput = page.locator('[data-testid="table-med-name-input-0"]');
      await expect(rowInput).toBeVisible();
      expect(await rowInput.inputValue()).toContain('Itraconazole');
    }

    // Toggle comparison preview
    const compareToggleBtn = page.locator('[data-testid="btn-toggle-comparison"]');
    await expect(compareToggleBtn).toBeVisible();
    await compareToggleBtn.click();

    // Verify comparison card is rendered
    const comparisonCard = page.locator('[data-testid="prescription-comparison-card"]');
    await expect(comparisonCard).toBeVisible();
    await expect(comparisonCard.getByText('Continued', { exact: false }).first()).toBeVisible();
  });

  /**
   * Test 10: Milestone 3: Reception Recall Manager & WhatsApp Trigger
   */
  test('Test 10: Reception Recall Manager displays defaulters list, metric cards, and WhatsApp action trigger', async ({ page }) => {
    await loginAsReceptionist(page);

    // Locate and click Recalls tab (desktop or mobile)
    const viewportWidth = page.viewportSize()?.width || 360;
    const tabRecalls = viewportWidth >= 768
      ? page.locator('[data-testid="tab-recalls"]')
      : page.locator('[data-testid="mobile-tab-recalls"]');

    await expect(tabRecalls).toBeVisible({ timeout: 10000 });
    await tabRecalls.click();

    // Verify Recall Dashboard renders
    const recallView = page.locator('[data-testid="recall-manager-view"]');
    await expect(recallView).toBeVisible({ timeout: 10000 });

    const headerTitle = page.locator('[data-testid="recall-header-title"]');
    await expect(headerTitle).toBeVisible();
    expect(await headerTitle.innerText()).toContain('Patient Recall');

    // Verify metrics ribbon
    const metricsRibbon = page.locator('[data-testid="recall-metrics-ribbon"]');
    await expect(metricsRibbon).toBeVisible();

    // Verify seed test recalls button is rendered
    const btnSeedRecalls = page.locator('[data-testid="btn-seed-test-recalls"]');
    await expect(btnSeedRecalls).toBeVisible();

    // Verify overdue patient card / row for seeded patient DC-0002 (Sunita Khot)
    const overdueCard = viewportWidth >= 768
      ? page.locator('[data-testid="defaulter-row-DC-0002"]')
      : page.locator('[data-testid="mobile-defaulter-card-DC-0002"]');
    await expect(overdueCard).toBeVisible({ timeout: 10000 });
    await expect(overdueCard).toContainText('Sunita Khot');

    // Verify WhatsApp reminder trigger button is rendered and clickable
    const btnSendWhatsApp = overdueCard.locator('[data-testid="btn-send-recall-whatsapp"]');
    await expect(btnSendWhatsApp).toBeVisible();
  });

  /**
   * Test 11: Receptionist clicking a completed patient opens the read-only summary modal without edit inputs and with redacted medications
   */
  test('Test 11: Receptionist clicking a completed patient opens the read-only summary modal without edit inputs and with redacted medications', async ({ page }) => {
    await loginAsReceptionist(page);

    // Locate the review button on recent check-ins for the completed morning visit
    const reviewBtn = page.locator('[data-testid="btn-review-visit-VST-TEST-M-001"]');
    await expect(reviewBtn).toBeVisible({ timeout: 10000 });
    await reviewBtn.click();

    // Verify Read-Only Summary Modal opens
    const summaryModal = page.locator('[data-testid="reception-view-summary-modal"]');
    await expect(summaryModal).toBeVisible({ timeout: 10000 });

    // Verify Patient Identity and Registration Fee are displayed
    await expect(summaryModal.getByText('Registration / Appointment Fee')).toBeVisible();
    await expect(summaryModal.getByText('Doctor Consultation Status')).toBeVisible();
    await expect(summaryModal.getByText('Completed by Dr. Baldawa').first()).toBeVisible();

    // Task 2: Verify Patient Privacy - Drugs are NOT exposed to receptionist
    const modalText = await summaryModal.innerText();
    expect(modalText).not.toContain('Itraconazole');
    expect(modalText).not.toContain('Minocycline');
    expect(modalText).not.toContain('Minoxidil');

    // Verify clinical chip replaces individual medicines
    await expect(summaryModal.getByText('Prescription Form Completed by Dr. Baldawa')).toBeVisible();

    // Verify that NO edit input or textarea elements exist inside the consultation details
    const inputsInsideDetails = summaryModal.locator('input, textarea');
    expect(await inputsInsideDetails.count()).toBe(0);

    // Verify action buttons are visible and satisfy >= 40px touch height without clipping
    const btnPrintReceipt = summaryModal.locator('[data-testid="btn-print-receipt-modal"]');
    const btnResendWhatsApp = summaryModal.locator('[data-testid="btn-resend-whatsapp-receipt"]');
    await expect(btnPrintReceipt).toBeVisible();
    await expect(btnResendWhatsApp).toBeVisible();

    const printBox = await btnPrintReceipt.boundingBox();
    const whatsappBox = await btnResendWhatsApp.boundingBox();
    expect(printBox?.height).toBeGreaterThanOrEqual(40);
    expect(whatsappBox?.height).toBeGreaterThanOrEqual(40);

    // Close modal
    await summaryModal.getByRole('button', { name: 'Close' }).first().click();
    await expect(summaryModal).not.toBeVisible();
  });

  /**
   * Test 12: Reception Logs render without horizontal overflow clipping on both 360px mobile and 1280px desktop
   */
  test('Test 12: Reception Logs render without horizontal overflow clipping on both 360px mobile and 1280px desktop', async ({ page }) => {
    await loginAsReceptionist(page);

    // Navigate to Logs tab (Desktop or Mobile)
    const viewportWidth = page.viewportSize()?.width || 360;
    const tabLogs = viewportWidth >= 768
      ? page.locator('[data-testid="tab-logs"]')
      : page.locator('[data-testid="mobile-tab-logs"]');

    await expect(tabLogs).toBeVisible({ timeout: 10000 });
    await tabLogs.click();

    // Verify Logs view renders
    const logsView = page.locator('[data-testid="reception-logs-view"]');
    await expect(logsView).toBeVisible({ timeout: 10000 });

    const headerTitle = page.locator('[data-testid="logs-header-title"]');
    await expect(headerTitle).toBeVisible();
    expect(await headerTitle.innerText()).toContain('Patient Intake & Visit Logs');

    // Verify zero horizontal overflow on mobile viewports (<= 412px)
    if (viewportWidth <= 412) {
      const documentScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      expect(documentScrollWidth).toBeLessThanOrEqual(viewportWidth);

      // Verify mobile cards are rendered
      const mobileCards = page.locator('[data-testid^="mobile-log-card-"]');
      await expect(mobileCards.first()).toBeVisible({ timeout: 5000 });
    } else {
      // Verify desktop table is rendered with rows
      const tableRows = page.locator('[data-testid^="log-table-row-"]');
      await expect(tableRows.first()).toBeVisible({ timeout: 5000 });
    }
  });

  /**
   * Test 13: Splash screen displays the unified circular logo and cleanly dismisses
   */
  test('Test 13: Splash screen displays the unified circular logo and cleanly dismisses', async ({ page }) => {
    // Navigate freshly to root to observe splash screen
    await page.goto('/', { waitUntil: 'domcontentloaded' });
    const splash = page.locator('[data-testid="splash-screen"]');
    await expect(splash).toBeVisible({ timeout: 5000 });

    const splashLogo = page.locator('[data-testid="splash-logo-img"]');
    await expect(splashLogo).toBeVisible();
    expect(await splashLogo.getAttribute('src')).toBe('/logo.png');

    // Click to dismiss smoothly
    await splash.click();
    await expect(splash).not.toBeVisible({ timeout: 5000 });
  });

  /**
   * Test 14: Universal scroll lock freezes #app-scroll-container and sets modal-open class
   */
  test('Test 14: Universal scroll lock freezes #app-scroll-container and sets modal-open class', async ({ page }) => {
    await loginAsReceptionist(page);

    // Initial state: not modal-open
    const isModalOpenInitial = await page.evaluate(() => document.body.classList.contains('modal-open'));
    expect(isModalOpenInitial).toBe(false);

    // Open Reception Review Modal
    const reviewBtn = page.locator('[data-testid="btn-review-visit-VST-TEST-M-001"]');
    await expect(reviewBtn).toBeVisible({ timeout: 10000 });
    await reviewBtn.click();

    const summaryModal = page.locator('[data-testid="reception-view-summary-modal"]');
    await expect(summaryModal).toBeVisible({ timeout: 10000 });

    // Assert body and documentElement have modal-open class and scroll container is locked
    const isModalOpenWhileActive = await page.evaluate(() => {
      const hasBodyClass = document.body.classList.contains('modal-open');
      const hasHtmlClass = document.documentElement.classList.contains('modal-open');
      const container = document.getElementById('app-scroll-container');
      const containerLocked = container ? window.getComputedStyle(container).overflowY === 'hidden' : false;
      return hasBodyClass && hasHtmlClass && containerLocked;
    });
    expect(isModalOpenWhileActive).toBe(true);

    // Close modal
    await summaryModal.getByRole('button', { name: 'Close' }).first().click();
    await expect(summaryModal).not.toBeVisible();

    // Assert modal-open is removed
    const isModalOpenAfterClose = await page.evaluate(() => document.body.classList.contains('modal-open'));
    expect(isModalOpenAfterClose).toBe(false);
  });

  /**
   * Test 15: New medicine row initializes with empty value, clean placeholder, and quick formulary suggestions
   */
  test('Test 15: New medicine row initializes with empty value, clean placeholder, and quick formulary suggestions', async ({ page }) => {
    await openConsultationRoom(page);

    // Add first medicine from catalog search
    const medSearchInput = page.locator('[data-testid="medication-search-input"]');
    await expect(medSearchInput).toBeVisible({ timeout: 10000 });
    await medSearchInput.fill('Novanib');

    const catalogDropdown = page.locator('[data-testid="catalog-item-0"]');
    await expect(catalogDropdown).toBeVisible({ timeout: 5000 });
    await catalogDropdown.click();

    // Now click 'Add Another Medicine Row'
    const btnAddRow = page.locator('[data-testid="btn-add-medicine-row"]');
    await expect(btnAddRow).toBeVisible({ timeout: 5000 });
    await btnAddRow.click();

    // Determine row selector (desktop table vs mobile card)
    const viewportWidth = page.viewportSize()?.width || 360;
    const secondRowInput = viewportWidth < 1024
      ? page.locator('[data-testid="mobile-med-name-input-1"]')
      : page.locator('[data-testid="table-med-name-input-1"]');

    await expect(secondRowInput).toBeVisible({ timeout: 5000 });

    // Assert value is strictly empty string (no "New Medicine" text to backspace)
    expect(await secondRowInput.inputValue()).toBe('');

    // Assert clean placeholder is present
    const placeholder = await secondRowInput.getAttribute('placeholder');
    expect(placeholder).toContain('Search or type medicine name');

    // Focus empty input to trigger instant formulary suggestions
    await secondRowInput.focus();

    const suggestionsList = viewportWidth < 1024
      ? page.locator('[data-testid="mobile-row-suggestions-1"]')
      : page.locator('[data-testid="table-row-suggestions-1"]');

    await expect(suggestionsList).toBeVisible({ timeout: 5000 });
    const suggestionsText = await suggestionsList.innerText();
    expect(suggestionsText.length).toBeGreaterThan(0);
  });

  /**
   * Test 16: Check-in form inputs have stable DOM IDs, name, and autocomplete attributes, retaining input focus
   */
  test('Test 16: Check-in form inputs have stable DOM IDs, name, and autocomplete attributes, retaining input focus', async ({ page }) => {
    await loginAsReceptionist(page);

    // Locate phone input
    const phoneInput = page.locator('#input-phone-number');
    await expect(phoneInput).toBeVisible({ timeout: 10000 });
    expect(await phoneInput.getAttribute('name')).toBe('phoneNumber');
    expect(await phoneInput.getAttribute('autocomplete')).toBe('tel');

    // Click and type phone number; ensure element remains activeElement
    await phoneInput.click();
    await phoneInput.fill('9822998877');

    const isActivePhone = await page.evaluate(() => document.activeElement?.id === 'input-phone-number');
    expect(isActivePhone).toBe(true);

    // Locate patient name input
    const nameInput = page.locator('#input-patient-name');
    await expect(nameInput).toBeVisible({ timeout: 5000 });
    expect(await nameInput.getAttribute('name')).toBe('patientName');
    expect(await nameInput.getAttribute('autocomplete')).toBe('name');

    await nameInput.click();
    await nameInput.fill('Pravin Patil');
    const isActiveName = await page.evaluate(() => document.activeElement?.id === 'input-patient-name');
    expect(isActiveName).toBe(true);
  });

  /**
   * Test 17: Attached paper Rx snapshot renders enlarged zoom modal with white background framing and dismisses cleanly
   */
  test('Test 17: Attached paper Rx snapshot renders enlarged zoom modal with white background framing and dismisses cleanly', async ({ page }) => {
    await loginAsDoctor(page);

    // Switch to 'Seen' filter tab to see completed visits
    const seenFilterTab = page.locator('button', { hasText: 'Seen' }).first();
    await expect(seenFilterTab).toBeVisible({ timeout: 10000 });
    await seenFilterTab.click();

    // Click on the completed patient card
    const reviewBtn = page.locator('[data-testid="btn-start-consultation"]').first();
    await expect(reviewBtn).toBeVisible({ timeout: 10000 });
    await reviewBtn.click();

    // Verify Consultation Room is open in review mode
    const enlargeBtn = page.locator('[data-testid="btn-review-enlarge-photo"]');
    await expect(enlargeBtn).toBeVisible({ timeout: 10000 });
    await enlargeBtn.click();

    // Assert photo zoom modal opens
    const zoomModal = page.locator('[data-testid="photo-zoom-modal"]');
    await expect(zoomModal).toBeVisible({ timeout: 5000 });

    // Assert enlarged image is visible, has white background styling, and valid non-zero dimensions
    const enlargedImg = zoomModal.locator('img');
    await expect(enlargedImg).toBeVisible();
    const imgClass = await enlargedImg.getAttribute('class');
    expect(imgClass).toContain('bg-white');

    const imgBox = await enlargedImg.boundingBox();
    expect(imgBox?.width).toBeGreaterThan(0);
    expect(imgBox?.height).toBeGreaterThan(0);

    // Close zoom modal via close button
    const closeBtn = zoomModal.locator('[data-testid="btn-close-zoom"]');
    await expect(closeBtn).toBeVisible();
    await closeBtn.click();

    await expect(zoomModal).not.toBeVisible({ timeout: 5000 });
  });

});


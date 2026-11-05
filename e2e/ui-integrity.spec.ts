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

        const visitMorning = {
          id: `VST-TEST-M-${Date.now()}`,
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

        tx.objectStore('patients').put(patient);
        tx.objectStore('visits').put(visitMorning);
        tx.objectStore('visits').put(visitEvening);
        if (stores.includes('prescriptions')) {
          tx.objectStore('prescriptions').put(pastPrescription);
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
  const startBtn = page.locator('[data-testid="btn-start-consultation"]').first();
  await expect(startBtn).toBeVisible({ timeout: 10000 });
  await startBtn.click();
  await page.waitForSelector('[data-testid="btn-back-to-queue"]', { timeout: 10000 });
}

test.describe('Milestone 2: UI Integrity & Layout Truncation Suite', () => {

  test.beforeEach(async ({ page }) => {
    // Navigate once to establish origin and initialize IndexedDB schemas
    await page.goto('/');
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
    await expect(inlineCard.getByText('Date:', { exact: false })).toBeVisible();
    await expect(inlineCard.getByText('Fee:', { exact: false })).toBeVisible();

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

});


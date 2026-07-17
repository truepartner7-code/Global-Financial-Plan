document.addEventListener('DOMContentLoaded', () => {
    const termSelect = document.getElementById('term');
    const premiumInput = document.getElementById('premium');
    const prepayCheckbox = document.getElementById('prepay');
    const grid = document.getElementById('comparison-grid');
    const summaryBox = document.getElementById('global-summary-box');
    const summaryLabel = document.getElementById('summary-label');
    const summaryValDisplay = document.getElementById('summary-val-display');
    const exRateDisplay = document.getElementById('exchange-rate-display');
    let simYear = parseInt(localStorage.getItem('simYear')) || new Date().getFullYear();
    let simQuarter = parseInt(localStorage.getItem('simQuarter')) || (Math.floor(new Date().getMonth() / 3) + 1);

    const dateSpans = document.querySelectorAll('.current-date');
    const updateTitle = () => {
        if (dateSpans.length > 0) {
            dateSpans.forEach(span => {
                span.textContent = `${simYear}년 ${simQuarter}분기`;
            });
        }
    };
    updateTitle();

    const modeRadios = document.querySelectorAll('input[name="calcMode"]');
    const forwardInputGroup = document.getElementById('forward-input-group');
    const reverseInputGroup = document.getElementById('reverse-input-group');
    const budgetKrwInput = document.getElementById('budgetKrw');
    const labelForward = document.getElementById('label-forward');
    const labelReverse = document.getElementById('label-reverse');
    const companySelect = document.getElementById('companySelect');
    const withdrawalPlanSelect = document.getElementById('withdrawalPlan');
    const v3Control = document.getElementById('v3-control');
    const v4Control = document.getElementById('v4-control');
    const btnV3 = document.getElementById('btn-v3');
    const btnV4 = document.getElementById('btn-v4');

    let currentVersion = 'v3';

    if (btnV3 && btnV4) {
        btnV3.addEventListener('click', () => {
            currentVersion = 'v3';
            btnV3.style.color = '#fff';
            btnV3.style.background = '#10b981';
            btnV3.style.fontWeight = '800';
            btnV3.style.boxShadow = '0 4px 6px -1px rgba(16, 185, 129, 0.3)';

            btnV4.style.color = '#64748b';
            btnV4.style.background = 'transparent';
            btnV4.style.fontWeight = '600';
            btnV4.style.boxShadow = 'none';

            v3Control.style.display = 'flex';
            v4Control.style.display = 'none';
            renderGrid();
        });

        btnV4.addEventListener('click', () => {
            currentVersion = 'v4';
            btnV4.style.color = '#fff';
            btnV4.style.background = '#3b82f6';
            btnV4.style.fontWeight = '800';
            btnV4.style.boxShadow = '0 4px 6px -1px rgba(59, 130, 246, 0.3)';

            btnV3.style.color = '#64748b';
            btnV3.style.background = 'transparent';
            btnV3.style.fontWeight = '600';
            btnV3.style.boxShadow = 'none';

            v3Control.style.display = 'none';
            v4Control.style.display = 'flex';
            renderGrid();
        });
    }

    let exRate = 1350; // default fallback
    let fetchedExRate = 1350;
    let isExRateFetched = false;

    const rateRadios = document.querySelectorAll('input[name="rateMode"]');
    const labelRateAuto = document.getElementById('label-rate-auto');
    const labelRateManual = document.getElementById('label-rate-manual');
    const manualRateGroup = document.getElementById('manual-rate-group');
    const manualRateInput = document.getElementById('manualRate');

    const updateExRateDisplay = () => {
        const modeElement = document.querySelector('input[name="rateMode"]:checked');
        const mode = modeElement ? modeElement.value : 'auto';
        const today = new Date();
        const dateStr = `${today.getFullYear()}.${String(today.getMonth() + 1).padStart(2, '0')}.${String(today.getDate()).padStart(2, '0')}`;

        if (mode === 'auto') {
            exRate = fetchedExRate;
            if (exRateDisplay) {
                if (isExRateFetched) {
                    exRateDisplay.textContent = `적용 환율: ${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(exRate)} 원/ 1 USD (기준일: ${dateStr})`;
                } else {
                    exRateDisplay.textContent = `적용 환율: ${exRate} 원/ 1 USD (기준일: ${dateStr} - 임시)`;
                }
            }
        } else {
            exRate = parseFloat(manualRateInput.value.replace(/,/g, '')) || 1400;
            if (exRateDisplay) {
                exRateDisplay.textContent = `적용 환율: ${new Intl.NumberFormat('ko-KR', { maximumFractionDigits: 2 }).format(exRate)} 원/ 1 USD (수동 적용)`;
            }
        }
        renderGrid();
    };

    if (rateRadios) {
        rateRadios.forEach(radio => {
            radio.addEventListener('change', (e) => {
                if (e.target.value === 'auto') {
                    manualRateGroup.style.display = 'none';
                    labelRateAuto.classList.add('active');
                    labelRateManual.classList.remove('active');
                } else {
                    manualRateGroup.style.display = 'flex';
                    labelRateAuto.classList.remove('active');
                    labelRateManual.classList.add('active');
                }
                updateExRateDisplay();
            });
        });
    }

    if (manualRateInput) {
        manualRateInput.addEventListener('input', (e) => {
            let raw = e.target.value.replace(/[^0-9]/g, '');
            if (raw) {
                e.target.value = new Intl.NumberFormat('en-US').format(parseInt(raw, 10));
            } else {
                e.target.value = '';
            }
            updateExRateDisplay();
        });
    }

    fetch('https://open.er-api.com/v6/latest/USD')
        .then(response => response.json())
        .then(data => {
            const baseRate = data.rates.KRW;
            fetchedExRate = baseRate * 1.005; // 카카오뱅크 송금환율 추정
            isExRateFetched = true;
            updateExRateDisplay();
        })
        .catch(err => {
            console.error('환율 불러오기 실패', err);
            isExRateFetched = false;
            updateExRateDisplay();
        });

    const formatUSD = (val) => new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(val);
    const formatYieldPercent = (val) => new Intl.NumberFormat('ko-KR', { style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(val);
    const formatKRW = (usdVal) => new Intl.NumberFormat('ko-KR', { style: 'currency', currency: 'KRW', maximumFractionDigits: 0 }).format(usdVal * exRate);

    modeRadios.forEach(radio => {
        radio.addEventListener('change', (e) => {
            if (e.target.value === 'forward') {
                forwardInputGroup.style.display = 'flex';
                reverseInputGroup.style.display = 'none';
                labelForward.classList.add('active');
                labelReverse.classList.remove('active');
            } else {
                forwardInputGroup.style.display = 'none';
                reverseInputGroup.style.display = 'flex';
                labelForward.classList.remove('active');
                labelReverse.classList.add('active');
            }
            renderGrid();
        });
    });

    const calculateLevy = (p) => {
        const levyRate = 0.001;
        const capHKD = 100;
        const exchangeRateHKD_USD = 7.8;
        const levyUSD = p * levyRate;
        return Math.min(levyUSD, capHKD / exchangeRateHKD_USD);
    };

    const getIRR = (term, totalActual, year, finalSv, annualWithdrawal, withdrawStartYear) => {
        if (finalSv === '-' || finalSv === 0 || !finalSv) return '-';
        let cashFlows = [];
        let annualPremium = totalActual / term;
        cashFlows.push(-annualPremium);
        for (let i = 1; i <= year; i++) {
            let cf = 0;
            if (i < term) cf -= annualPremium;
            if (i > withdrawStartYear && annualWithdrawal > 0 && annualWithdrawal !== '-') cf += annualWithdrawal;
            if (i === year) cf += finalSv;
            cashFlows.push(cf);
        }
        let guess = 0.05;
        for (let i = 0; i < 50; i++) {
            let npv = 0, dnpv = 0;
            for (let t = 0; t <= year; t++) {
                npv += cashFlows[t] / Math.pow(1 + guess, t);
                dnpv -= t * cashFlows[t] / Math.pow(1 + guess, t + 1);
            }
            if (Math.abs(npv) < 1e-5) return (guess * 100).toFixed(1) + '%';
            guess -= npv / dnpv;
        }
        return (guess * 100).toFixed(1) + '%';
    };

    const findPremiumForTargetActual = (comp, targetKrwActual, term, isPrepay) => {
        let low = 0;
        let high = targetKrwActual; // safely large enough since USD < KRW
        let p = 0;
        for (let i = 0; i < 60; i++) {
            let mid = (low + high) / 2;
            let res = comp.getCalc(term, mid, isPrepay);
            let calculatedKrwActual = res.totalActual * exRate;
            if (calculatedKrwActual < targetKrwActual) low = mid;
            else high = mid;
            p = mid;
        }
        return p;
    };

    // Historical Default Promotion Database
    const promoDB = {
        "2026-1": {
            gen2y: { t100: 4.0, t50: 3.0, base: 2.0 },
            gen5y: { t20: 23.0, base: 18.0 },
            genPrepay: 4.1,
            sun2y: { t10: 5.0, base: 2.2 },
            sun5y: { t100: 30.0, t20: 29.0, t10: 27.0, t5: 25.0, t3: 19.0, base: 13.0 },
            sunPrepay: { y1: 5.0, y2: 4.3 },
            chubb2y: 12.0, chubb2yAdd: 0, chubb5y: 10.0, chubbPrepay: 5.0
        },
        "2026-2": {
            gen2y: { t100: 5.0, t50: 4.0, base: 2.0 },
            gen5y: { t20: 25.0, base: 20.0 },
            genPrepay: 4.1,
            sun2y: { t10: 4.5, base: 2.0 },
            sun5y: { t100: 30.0, t20: 28.0, t10: 26.0, t5: 23.0, t3: 18.0, base: 12.0 },
            sunPrepay: { y1: 5.0, y2: 4.3 },
            chubb2y: 12.0, chubb2yAdd: 0, chubb5y: 10.0, chubbPrepay: 4.0
        },
        "2026-3": {
            gen2y: { t100: 5.0, t50: 4.0, base: 2.0 },
            gen5y: { t20: 25.0, base: 20.0 },
            genPrepay: 4.1,
            sun2y: { t10: 4.5, base: 2.0 },
            sun5y: { t100: 30.0, t20: 28.0, t10: 26.0, t5: 23.0, t3: 18.0, base: 12.0 },
            sunPrepay: { y1: 5.0, y2: 4.3 },
            chubb2y: 12.0, chubb2yAdd: 3.71, chubb5y: 10.0, chubbPrepay: 4.0
        }
    };

    let customPromos = JSON.parse(localStorage.getItem('customPromos')) || {};

    const getPromoData = (year, quarter) => {
        const key = `${year}-${quarter}`;
        if (customPromos[key]) return customPromos[key];
        if (promoDB[key]) return promoDB[key];
        // If 2026-4 or later, default to 2026-3
        if (year > 2026 || (year === 2026 && quarter >= 4)) return promoDB["2026-3"];
        return {
            gen2y: { t100: 0, t50: 0, base: 0 },
            gen5y: { t20: 0, base: 0 },
            genPrepay: 0,
            sun2y: { t10: 0, base: 0 },
            sun5y: { t100: 0, t20: 0, t10: 0, t5: 0, t3: 0, base: 0 },
            sunPrepay: { y1: 0, y2: 0 },
            chubb2y: 0, chubb2yAdd: 0, chubb5y: 0, chubbPrepay: 0
        };
    };

    // Admin UI Logic
    const btnAdmin = document.getElementById('btn-admin');
    const adminModal = document.getElementById('admin-modal');
    const btnCloseAdmin = document.getElementById('btn-close-admin');
    const btnAdminCloseBottom = document.getElementById('btn-admin-close-bottom');
    const btnAdminSave = document.getElementById('btn-admin-save');
    const btnAdminReset = document.getElementById('btn-admin-reset');

    const adminYearInput = document.getElementById('admin-year');
    const adminQuarterSelect = document.getElementById('admin-quarter');

    const loadAdminForm = () => {
        const y = parseInt(adminYearInput.value);
        const q = parseInt(adminQuarterSelect.value);
        const data = getPromoData(y, q);

        document.getElementById('gen-2y-100').value = data.gen2y?.t100 || 0;
        document.getElementById('gen-2y-50').value = data.gen2y?.t50 || 0;
        document.getElementById('gen-2y-base').value = data.gen2y?.base || 0;
        document.getElementById('gen-5y-20').value = data.gen5y?.t20 || 0;
        document.getElementById('gen-5y-base').value = data.gen5y?.base || 0;
        document.getElementById('gen-prepay').value = data.genPrepay || 0;

        document.getElementById('sun-2y-10').value = data.sun2y?.t10 || 0;
        document.getElementById('sun-2y-base').value = data.sun2y?.base || 0;
        document.getElementById('sun-5y-100').value = data.sun5y?.t100 || 0;
        document.getElementById('sun-5y-20').value = data.sun5y?.t20 || 0;
        document.getElementById('sun-5y-10').value = data.sun5y?.t10 || 0;
        document.getElementById('sun-5y-5').value = data.sun5y?.t5 || 0;
        document.getElementById('sun-5y-3').value = data.sun5y?.t3 || 0;
        document.getElementById('sun-5y-base').value = data.sun5y?.base || 0;
        document.getElementById('sun-prepay-1').value = data.sunPrepay?.y1 || 0;
        document.getElementById('sun-prepay-2').value = data.sunPrepay?.y2 || 0;

        document.getElementById('chubb-2y').value = data.chubb2y || 0;
        document.getElementById('chubb-2y-add').value = data.chubb2yAdd || 0;
        document.getElementById('chubb-5y').value = data.chubb5y || 0;
        document.getElementById('chubb-prepay').value = data.chubbPrepay || 0;
    };

    if (btnAdmin) {
        adminYearInput.addEventListener('change', loadAdminForm);
        adminQuarterSelect.addEventListener('change', loadAdminForm);

        btnAdmin.addEventListener('click', () => {
            adminYearInput.value = simYear;
            adminQuarterSelect.value = simQuarter;
            loadAdminForm();
            adminModal.style.display = 'flex';
        });

        const closeModal = () => adminModal.style.display = 'none';
        btnCloseAdmin.addEventListener('click', closeModal);
        if (btnAdminCloseBottom) btnAdminCloseBottom.addEventListener('click', closeModal);

        btnAdminSave.addEventListener('click', () => {
            const key = `${adminYearInput.value}-${adminQuarterSelect.value}`;
            customPromos[key] = {
                gen2y: {
                    t100: parseFloat(document.getElementById('gen-2y-100').value) || 0,
                    t50: parseFloat(document.getElementById('gen-2y-50').value) || 0,
                    base: parseFloat(document.getElementById('gen-2y-base').value) || 0
                },
                gen5y: {
                    t20: parseFloat(document.getElementById('gen-5y-20').value) || 0,
                    base: parseFloat(document.getElementById('gen-5y-base').value) || 0
                },
                genPrepay: parseFloat(document.getElementById('gen-prepay').value) || 0,
                sun2y: {
                    t10: parseFloat(document.getElementById('sun-2y-10').value) || 0,
                    base: parseFloat(document.getElementById('sun-2y-base').value) || 0
                },
                sun5y: {
                    t100: parseFloat(document.getElementById('sun-5y-100').value) || 0,
                    t20: parseFloat(document.getElementById('sun-5y-20').value) || 0,
                    t10: parseFloat(document.getElementById('sun-5y-10').value) || 0,
                    t5: parseFloat(document.getElementById('sun-5y-5').value) || 0,
                    t3: parseFloat(document.getElementById('sun-5y-3').value) || 0,
                    base: parseFloat(document.getElementById('sun-5y-base').value) || 0
                },
                sunPrepay: {
                    y1: parseFloat(document.getElementById('sun-prepay-1').value) || 0,
                    y2: parseFloat(document.getElementById('sun-prepay-2').value) || 0
                },
                chubb2y: parseFloat(document.getElementById('chubb-2y').value) || 0,
                chubb2yAdd: parseFloat(document.getElementById('chubb-2y-add').value) || 0,
                chubb5y: parseFloat(document.getElementById('chubb-5y').value) || 0,
                chubbPrepay: parseFloat(document.getElementById('chubb-prepay').value) || 0
            };
            localStorage.setItem('customPromos', JSON.stringify(customPromos));

            simYear = parseInt(adminYearInput.value);
            simQuarter = parseInt(adminQuarterSelect.value);
            localStorage.setItem('simYear', simYear);
            localStorage.setItem('simQuarter', simQuarter);
            updateTitle();

            closeModal();
            if (typeof renderGrid === 'function') renderGrid();
        });

        btnAdminReset.addEventListener('click', () => {
            const key = `${adminYearInput.value}-${adminQuarterSelect.value}`;
            delete customPromos[key];
            localStorage.setItem('customPromos', JSON.stringify(customPromos));
            loadAdminForm();

            simYear = parseInt(adminYearInput.value);
            simQuarter = parseInt(adminQuarterSelect.value);
            localStorage.setItem('simYear', simYear);
            localStorage.setItem('simQuarter', simQuarter);
            updateTitle();

            if (typeof renderGrid === 'function') renderGrid();
        });
    }

    const companies = [
        {
            id: 'generali',
            name: 'Generali',
            product: 'Lion Achiever Elite',
            getCalc: (term, p, isPrepay) => {
                const levy = calculateLevy(p);
                const promo = getPromoData(simYear, simQuarter);

                let bonusRate = 0;
                let prepayInterest = (promo.genPrepay || 0) / 100;
                let prepayInterestLabel = promo.genPrepay > 0 ? `${promo.genPrepay}%` : '-';

                if (term === 2) {
                    if (p >= 1000000) bonusRate = (promo.gen2y?.t100 || 0) / 100;
                    else if (p >= 500000) bonusRate = (promo.gen2y?.t50 || 0) / 100;
                    else bonusRate = (promo.gen2y?.base || 0) / 100;
                } else if (term === 5) {
                    if (p >= 200000) bonusRate = (promo.gen5y?.t20 || 0) / 100;
                    else bonusRate = (promo.gen5y?.base || 0) / 100;
                }

                const bonusAmount = p * bonusRate;

                let yearlyPayments = Array(term).fill(p + levy);
                if (term >= 2 && bonusAmount > 0) yearlyPayments[1] = Math.max(0, yearlyPayments[1] - bonusAmount);

                let totalActual = 0;
                let prepayDiscountAmt = 0;

                if (isPrepay) {
                    totalActual = yearlyPayments[0];
                    for (let i = 1; i < term; i++) {
                        let pv = prepayInterest > 0 ? (yearlyPayments[i] / Math.pow(1 + prepayInterest, i)) : yearlyPayments[i];
                        totalActual += pv;
                        prepayDiscountAmt += (yearlyPayments[i] - pv);
                    }
                } else {
                    totalActual = yearlyPayments.reduce((sum, val) => sum + val, 0);
                }

                const multiplier = (p * term) / 100000;
                let sv5, sv10, sv20, sv30, sv40, sv50;
                if (term === 2) {
                    sv5 = 104502; sv10 = 155296; sv20 = 316978; sv30 = 584289; sv40 = 1080986; sv50 = 1962550;
                } else {
                    sv5 = 0; sv10 = 133670; sv20 = 291877; sv30 = 530730; sv40 = 967513; sv50 = 1767828;
                }

                let sv5_w5, sv10_w5, sv20_w5, sv30_w5, sv40_w5, sv50_w5;
                let sv10_w10, sv20_w10, sv30_w10, sv40_w10, sv50_w10;
                let sv10_w20, sv20_w20, sv30_w20, sv40_w20, sv50_w20;

                if (term === 2) {
                    sv5_w5 = 97602; sv10_w5 = 103142; sv20_w5 = 113061; sv30_w5 = 116258; sv40_w5 = 120747; sv50_w5 = 129352;
                    sv10_w10 = 142666; sv20_w10 = 155315; sv30_w10 = 152746; sv40_w10 = 146194; sv50_w10 = 134659;
                    sv10_w20 = sv10; sv20_w20 = 296978; sv30_w20 = 280325; sv40_w20 = 246349; sv50_w20 = 184905;
                } else {
                    sv5_w5 = 0; sv10_w5 = 0; sv20_w5 = 0; sv30_w5 = 0; sv40_w5 = 0; sv50_w5 = 0;
                    sv10_w10 = 124670; sv20_w10 = 141990; sv30_w10 = 138626; sv40_w10 = 133006; sv50_w10 = 123183;
                    sv10_w20 = sv10; sv20_w20 = 291877; sv30_w20 = 258881; sv40_w20 = 232521; sv50_w20 = 185173;
                }

                return {
                    levy,
                    bonusLabel: bonusRate > 0 ? `2차년도 ${(bonusRate * 100).toFixed(1)}%` : '-',
                    bonusAmount,
                    prepayInterestLabel,
                    prepayDiscountAmt,
                    totalActual,
                    surrender5yr: sv5 * multiplier,
                    surrender10yr: sv10 * multiplier,
                    surrender20yr: sv20 * multiplier,
                    surrender30yr: sv30 * multiplier,
                    surrender40yr: sv40 * multiplier,
                    surrender50yr: sv50 * multiplier,
                    sv5_w5: sv5_w5 * multiplier, sv10_w5: sv10_w5 * multiplier, sv20_w5: sv20_w5 * multiplier, sv30_w5: sv30_w5 * multiplier, sv40_w5: sv40_w5 * multiplier, sv50_w5: sv50_w5 * multiplier,
                    sv10_w10: sv10_w10 * multiplier, sv20_w10: sv20_w10 * multiplier, sv30_w10: sv30_w10 * multiplier, sv40_w10: sv40_w10 * multiplier, sv50_w10: sv50_w10 * multiplier,
                    sv10_w20: sv10_w20 * multiplier, sv20_w20: sv20_w20 * multiplier, sv30_w20: sv30_w20 * multiplier, sv40_w20: sv40_w20 * multiplier, sv50_w20: sv50_w20 * multiplier,
                };
            }
        },
        {
            id: 'sunlife',
            name: 'Sun Life',
            product: 'SunJoy Global II',
            getCalc: (term, p, isPrepay) => {
                const levy = calculateLevy(p);
                const promo = getPromoData(simYear, simQuarter);

                let bonusRate = 0;
                let prepayInterestLabel = '-';
                let prepayY1 = (promo.sunPrepay?.y1 || 0) / 100;
                let prepayY2 = (promo.sunPrepay?.y2 || 0) / 100;

                if (term === 2) {
                    if (p >= 100000) bonusRate = (promo.sun2y?.t10 || 0) / 100;
                    else bonusRate = (promo.sun2y?.base || 0) / 100;
                    if (prepayY1 > 0) prepayInterestLabel = `${promo.sunPrepay.y1}%`;
                } else if (term === 5) {
                    if (p >= 1000000) bonusRate = (promo.sun5y?.t100 || 0) / 100;
                    else if (p >= 200000) bonusRate = (promo.sun5y?.t20 || 0) / 100;
                    else if (p >= 100000) bonusRate = (promo.sun5y?.t10 || 0) / 100;
                    else if (p >= 50000) bonusRate = (promo.sun5y?.t5 || 0) / 100;
                    else if (p >= 30000) bonusRate = (promo.sun5y?.t3 || 0) / 100;
                    else bonusRate = (promo.sun5y?.base || 0) / 100;
                    if (prepayY1 > 0 && prepayY2 > 0) prepayInterestLabel = `${promo.sunPrepay.y1}% & ${promo.sunPrepay.y2}%`;
                    else if (prepayY1 > 0) prepayInterestLabel = `${promo.sunPrepay.y1}%`;
                }

                const bonusAmount = p * bonusRate;

                let yearlyPayments = Array(term).fill(p + levy);
                if (term >= 2 && bonusAmount > 0) yearlyPayments[1] = Math.max(0, yearlyPayments[1] - bonusAmount);

                let totalActual = 0;
                let prepayDiscountAmt = 0;

                if (isPrepay) {
                    totalActual = yearlyPayments[0];
                    for (let i = 1; i < term; i++) {
                        let pv = yearlyPayments[i];
                        if (term === 2) {
                            if (prepayY1 > 0) pv = yearlyPayments[i] / (1 + prepayY1);
                        } else {
                            if (prepayY1 > 0 && prepayY2 > 0) {
                                if (i === 1) pv = yearlyPayments[i] / (1 + prepayY1);
                                else if (i === 2) pv = yearlyPayments[i] / ((1 + prepayY1) * (1 + prepayY2));
                                else if (i === 3) pv = yearlyPayments[i] / ((1 + prepayY1) * Math.pow(1 + prepayY2, 2));
                                else if (i === 4) pv = yearlyPayments[i] / ((1 + prepayY1) * Math.pow(1 + prepayY2, 3));
                            } else if (prepayY1 > 0) {
                                pv = yearlyPayments[i] / Math.pow(1 + prepayY1, i);
                            }
                        }
                        totalActual += pv;
                        prepayDiscountAmt += (yearlyPayments[i] - pv);
                    }
                } else {
                    totalActual = yearlyPayments.reduce((sum, val) => sum + val, 0);
                }

                const multiplier = (p * term) / 100000;
                let sv5, sv10, sv20, sv30, sv40, sv50;
                if (term === 2) {
                    sv5 = 88284; sv10 = 145168; sv20 = 311611; sv30 = 615119; sv40 = 1203718; sv50 = 2259544;
                } else {
                    sv5 = 0; sv10 = 127784; sv20 = 272969; sv30 = 556813; sv40 = 1060264; sv50 = 2063013;
                }

                let sv5_w5, sv10_w5, sv20_w5, sv30_w5, sv40_w5, sv50_w5;
                let sv10_w10, sv20_w10, sv30_w10, sv40_w10, sv50_w10;
                let sv10_w20, sv20_w20, sv30_w20, sv40_w20, sv50_w20;

                if (term === 2) {
                    sv5_w5 = 80783; sv10_w5 = 95357; sv20_w5 = 112770; sv30_w5 = 133916; sv40_w5 = 174455; sv50_w5 = 238900;
                    sv10_w10 = 135167; sv20_w10 = 168381; sv30_w10 = 217762; sv40_w10 = 273826; sv50_w10 = 379064;
                    sv10_w20 = sv10; sv20_w20 = 291610; sv30_w20 = 331991; sv40_w20 = 356739; sv50_w20 = 399760;
                } else {
                    sv5_w5 = 0; sv10_w5 = 0; sv20_w5 = 0; sv30_w5 = 0; sv40_w5 = 0; sv50_w5 = 0;
                    sv10_w10 = 118784; sv20_w10 = 146647; sv30_w10 = 197649; sv40_w10 = 262118; sv50_w10 = 370581;
                    sv10_w20 = sv10; sv20_w20 = 254969; sv30_w20 = 302115; sv40_w20 = 336740; sv50_w20 = 389207;
                }

                return {
                    levy,
                    bonusLabel: bonusRate > 0 ? `2차년도 ${(bonusRate * 100).toFixed(1)}%` : '-',
                    bonusAmount,
                    prepayInterestLabel,
                    prepayDiscountAmt,
                    totalActual,
                    surrender5yr: sv5 * multiplier,
                    surrender10yr: sv10 * multiplier,
                    surrender20yr: sv20 * multiplier,
                    surrender30yr: sv30 * multiplier,
                    surrender40yr: sv40 * multiplier,
                    surrender50yr: sv50 * multiplier,
                    sv5_w5: sv5_w5 * multiplier, sv10_w5: sv10_w5 * multiplier, sv20_w5: sv20_w5 * multiplier, sv30_w5: sv30_w5 * multiplier, sv40_w5: sv40_w5 * multiplier, sv50_w5: sv50_w5 * multiplier,
                    sv10_w10: sv10_w10 * multiplier, sv20_w10: sv20_w10 * multiplier, sv30_w10: sv30_w10 * multiplier, sv40_w10: sv40_w10 * multiplier, sv50_w10: sv50_w10 * multiplier,
                    sv10_w20: sv10_w20 * multiplier, sv20_w20: sv20_w20 * multiplier, sv30_w20: sv30_w20 * multiplier, sv40_w20: sv40_w20 * multiplier, sv50_w20: sv50_w20 * multiplier,
                };
            }
        },
        {
            id: 'chubb',
            name: 'CHUBB',
            product: 'MyLegacy Plan V',
            getCalc: (term, p, isPrepay) => {
                const levy = calculateLevy(p);
                const promo = getPromoData(simYear, simQuarter);

                let bonusAmount = 0;
                let yearlyPayments = Array(term).fill(p + levy);
                let bonusLabel = '-';
                let prepayInterest = (promo.chubbPrepay || 0) / 100;
                let prepayInterestLabel = promo.chubbPrepay > 0 ? `${promo.chubbPrepay}%` : '-';

                if (term === 2) {
                    let y1Bonus = p * ((promo.chubb2y || 0) / 100);
                    let y2Bonus = isPrepay ? p * ((promo.chubb2yAdd || 0) / 100) : 0;
                    
                    bonusAmount = y1Bonus + y2Bonus;
                    if (y1Bonus > 0 || y2Bonus > 0) {
                        let labels = [];
                        if (y1Bonus > 0) labels.push(`1차 ${promo.chubb2y}%`);
                        if (y2Bonus > 0) labels.push(`선납추가 ${promo.chubb2yAdd}%`);
                        bonusLabel = labels.join(', ');
                        
                        yearlyPayments[0] = Math.max(0, yearlyPayments[0] - y1Bonus);
                        yearlyPayments[1] = Math.max(0, yearlyPayments[1] - y2Bonus);
                    }
                } else if (term === 5) {
                    bonusAmount = p * ((promo.chubb5y || 0) / 100);
                    if (bonusAmount > 0) {
                        bonusLabel = `매년 ${promo.chubb5y}%`;
                        for (let i = 0; i < term; i++) yearlyPayments[i] = Math.max(0, yearlyPayments[i] - bonusAmount);
                        bonusAmount = bonusAmount * 5; // total bonus display
                    }
                }

                let totalActual = 0;
                let prepayDiscountAmt = 0;

                if (isPrepay) {
                    totalActual = yearlyPayments[0];
                    for (let i = 1; i < term; i++) {
                        let pv = prepayInterest > 0 ? (yearlyPayments[i] / Math.pow(1 + prepayInterest, i)) : yearlyPayments[i];
                        totalActual += pv;
                        prepayDiscountAmt += (yearlyPayments[i] - pv);
                    }
                } else {
                    totalActual = yearlyPayments.reduce((sum, val) => sum + val, 0);
                }

                const multiplier = (p * term) / 100000;
                let sv5, sv10, sv20, sv30, sv40, sv50;
                if (term === 2) {
                    sv5 = 72809; sv10 = 141065; sv20 = 316420; sv30 = 641180; sv40 = 1203657; sv50 = 2259495;
                } else {
                    sv5 = 65901; sv10 = 126888; sv20 = 279599; sv30 = 585472; sv40 = 1099011; sv50 = 2063013;
                }

                let sv5_w5, sv10_w5, sv20_w5, sv30_w5, sv40_w5, sv50_w5;
                let sv10_w10, sv20_w10, sv30_w10, sv40_w10, sv50_w10;
                let sv10_w20, sv20_w20, sv30_w20, sv40_w20, sv50_w20;

                if (term === 2) {
                    sv5_w5 = 66309; sv10_w5 = 90292; sv20_w5 = 107177; sv30_w5 = 127675; sv40_w5 = 153610; sv50_w5 = 201867;
                    sv10_w10 = 131065; sv20_w10 = 146499; sv30_w10 = 159046; sv40_w10 = 165574; sv50_w10 = 177097;
                    sv10_w20 = sv10; sv20_w20 = 296420; sv30_w20 = 324991; sv40_w20 = 344209; sv50_w20 = 378834;
                } else {
                    sv5_w5 = 0; sv10_w5 = 84707; sv20_w5 = 89771; sv30_w5 = 96016; sv40_w5 = 93475; sv50_w5 = 88365;
                    sv10_w10 = 117988; sv20_w10 = 127311; sv30_w10 = 140687; sv40_w10 = 145410; sv50_w10 = 153844;
                    sv10_w20 = sv10; sv20_w20 = 279599; sv30_w20 = 293237; sv40_w20 = 310536; sv50_w20 = 342160;
                }

                return {
                    levy,
                    bonusLabel,
                    bonusAmount,
                    prepayInterestLabel,
                    prepayDiscountAmt,
                    totalActual,
                    surrender5yr: sv5 * multiplier,
                    surrender10yr: sv10 * multiplier,
                    surrender20yr: sv20 * multiplier,
                    surrender30yr: sv30 * multiplier,
                    surrender40yr: sv40 * multiplier,
                    surrender50yr: sv50 * multiplier,
                    sv5_w5: sv5_w5 * multiplier, sv10_w5: sv10_w5 * multiplier, sv20_w5: sv20_w5 * multiplier, sv30_w5: sv30_w5 * multiplier, sv40_w5: sv40_w5 * multiplier, sv50_w5: sv50_w5 * multiplier,
                    sv10_w10: sv10_w10 * multiplier, sv20_w10: sv20_w10 * multiplier, sv30_w10: sv30_w10 * multiplier, sv40_w10: sv40_w10 * multiplier, sv50_w10: sv50_w10 * multiplier,
                    sv10_w20: sv10_w20 * multiplier, sv20_w20: sv20_w20 * multiplier, sv30_w20: sv30_w20 * multiplier, sv40_w20: sv40_w20 * multiplier, sv50_w20: sv50_w20 * multiplier,
                };
            }
        }
    ];

    const renderGrid = () => {
        const mode = document.querySelector('input[name="calcMode"]:checked').value;
        const term = parseInt(termSelect.value);
        const isPrepay = prepayCheckbox.checked;
        let baseP = parseFloat(premiumInput.value.replace(/,/g, '')) || 0;
        let budgetKrw = parseFloat(budgetKrwInput.value.replace(/,/g, '')) || 0;

        if (mode === 'forward') {
            summaryLabel.innerHTML = `총 명목 가입금액 <span class="summary-subtext">(연간 보험료 × 납입기간)</span>`;
            summaryValDisplay.textContent = formatUSD(baseP * term);
        } else {
            summaryLabel.innerHTML = `목표 총 실납입액 <span class="summary-subtext">(입력 예산 USD 환산)</span>`;
            summaryValDisplay.textContent = formatUSD(budgetKrw / exRate);
        }

        grid.innerHTML = '';

        if (currentVersion === 'v3') {
            const withdrawalPlan = withdrawalPlanSelect.value;
            companies.forEach(comp => {
                let p = baseP;
                if (mode === 'reverse') {
                    p = findPremiumForTargetActual(comp, budgetKrw, term, isPrepay);
                }
                const res = comp.getCalc(term, p, isPrepay);
                const pureNominalTotal = p * term;
                const totalActual = res.totalActual;

                const getYieldHtml = (year, sv, sv_w5, sv_w10, sv_w20) => {
                    let currentSv = sv;
                    let accumulatedWithdrawal = 0;

                    if (withdrawalPlan === '5yr') {
                        let wAmt = 0;
                        if (term === 2) wAmt = (comp.id === 'generali' ? 6900 : (comp.id === 'sunlife' ? 7500 : 6500));
                        else if (term === 5) wAmt = (comp.id === 'chubb' ? 6500 : 0);

                        if (year >= 5) {
                            if (term === 5) {
                                if (year === 5) {
                                    currentSv = sv;
                                    accumulatedWithdrawal = 0;
                                } else {
                                    currentSv = sv_w5;
                                    accumulatedWithdrawal = pureNominalTotal * (wAmt / 100000) * (year - 5);
                                }
                            } else {
                                currentSv = sv_w5;
                                accumulatedWithdrawal = pureNominalTotal * (wAmt / 100000) * (year - 4);
                            }
                        } else {
                            currentSv = sv;
                            accumulatedWithdrawal = 0;
                        }
                    } else if (withdrawalPlan === '10yr') {
                        let withdrawPct = (term === 2) ? 0.10 : (comp.id === 'chubb' ? 0.089 : 0.09);
                        if (year >= 10) {
                            currentSv = sv_w10;
                            accumulatedWithdrawal = pureNominalTotal * withdrawPct * (year - 9);
                        } else {
                            currentSv = sv;
                            accumulatedWithdrawal = 0;
                        }
                    } else if (withdrawalPlan === '20yr') {
                        let withdrawPct = (term === 2) ? 0.20 : 0.18;
                        if (year >= 20) {
                            currentSv = sv_w20;
                            accumulatedWithdrawal = pureNominalTotal * withdrawPct * (year - 19);
                        } else {
                            currentSv = sv;
                            accumulatedWithdrawal = 0;
                        }
                    }

                    let isAvailable = (currentSv !== '-' && currentSv !== 0);
                    let totalValue = isAvailable ? currentSv + accumulatedWithdrawal : '-';
                    const yieldPctActual = isAvailable && totalActual > 0 ? (totalValue / totalActual) : 0;

                    let wAmtForIrr = 0;
                    let wStartYear = 99;
                    if (withdrawalPlan === '5yr') {
                        let wAmtBase = (term === 2) ? (comp.id === 'generali' ? 6900 : (comp.id === 'sunlife' ? 7500 : 6500)) : (comp.id === 'chubb' ? 6500 : 0);
                        wAmtForIrr = pureNominalTotal * (wAmtBase / 100000);
                        // 2년납: 5년말부터(i>4), 5년납: 6년말부터(i>6) - display와 일치
                        wStartYear = (term === 2) ? 4 : 6;
                    } else if (withdrawalPlan === '10yr') {
                        let withdrawPct = (term === 2) ? 0.10 : (comp.id === 'chubb' ? 0.089 : 0.09);
                        wAmtForIrr = pureNominalTotal * withdrawPct;
                        wStartYear = 9;
                    } else if (withdrawalPlan === '20yr') {
                        let withdrawPct = (term === 2) ? 0.20 : 0.18;
                        wAmtForIrr = pureNominalTotal * withdrawPct;
                        wStartYear = 19;
                    }

                    const irrVal = isAvailable ? getIRR(term, totalActual, year, currentSv, wAmtForIrr, wStartYear) : '-';

                    let svDisplay = isAvailable ? formatUSD(currentSv) : '-';
                    let totalValueDisplay = isAvailable ? formatUSD(totalValue) : '-';

                    if (withdrawalPlan === 'none') {
                        return `
                            <tr>
                                <td style="text-align: left; padding: 0.4rem 0.4rem 0.4rem 0; border-bottom: 1px dashed #e2e8f0; font-weight: 700; color: #475569; font-size: 0.85rem;">${year}년</td>
                                <td style="padding: 0.4rem 0 0.4rem 0.4rem; border-bottom: 1px dashed #e2e8f0; font-weight: 800; color: #0f172a; font-size: 0.85rem;">
                                    <span style="display: inline-block; transform: scaleX(0.9); transform-origin: right;">${svDisplay}</span>
                                </td>
                                <td style="padding: 0.4rem 0 0.4rem 0.4rem; border-bottom: 1px dashed #e2e8f0;">
                                    <div style="display: flex; justify-content: flex-end; align-items: baseline; gap: 3px; transform: scaleX(0.9); transform-origin: right;">
                                        <span style="color: var(--primary); font-weight: 700; font-size: 0.85rem;">${isAvailable ? formatYieldPercent(yieldPctActual) : '-'}</span>
                                        <span style="color: #cbd5e1; font-weight: 400; font-size: 0.8rem;">/</span>
                                        <span style="color: #64748b; font-weight: 500; font-size: 0.8rem;">${irrVal}</span>
                                    </div>
                                </td>
                            </tr>
                        `;
                    } else {
                        return `
                            <tr>
                                <td style="text-align: left; padding: 0.4rem 0.4rem 0.4rem 0; border-bottom: 1px dashed #e2e8f0; font-weight: 700; color: #475569; font-size: 0.85rem;">${year}년</td>
                                <td style="padding: 0.4rem 0 0.4rem 0.4rem; border-bottom: 1px dashed #e2e8f0; font-weight: 500; color: #10b981; font-size: 0.8rem; opacity: 0.9;">
                                    <span style="display: inline-block; transform: scaleX(0.9); transform-origin: right;">${accumulatedWithdrawal > 0 ? formatUSD(accumulatedWithdrawal) : '-'}</span>
                                </td>
                                <td style="padding: 0.4rem 0 0.4rem 0.4rem; border-bottom: 1px dashed #e2e8f0; font-weight: 500; color: #94a3b8; font-size: 0.8rem;">
                                    <span style="display: inline-block; transform: scaleX(0.9); transform-origin: right;">${svDisplay}</span>
                                </td>
                                <td style="padding: 0.4rem 0 0.4rem 0.4rem; border-bottom: 1px dashed #e2e8f0; font-weight: 800; color: #0f172a; font-size: 0.85rem;">
                                    <span style="display: inline-block; transform: scaleX(0.9); transform-origin: right;">${totalValueDisplay}</span>
                                </td>
                                <td style="padding: 0.4rem 0 0.4rem 0.4rem; border-bottom: 1px dashed #e2e8f0;">
                                    <div style="display: flex; justify-content: flex-end; align-items: baseline; gap: 3px; transform: scaleX(0.9); transform-origin: right;">
                                        <span style="color: var(--primary); font-weight: 700; font-size: 0.85rem;">${isAvailable ? formatYieldPercent(yieldPctActual) : '-'}</span>
                                        <span style="color: #e2e8f0; font-weight: 400; font-size: 0.8rem;">/</span>
                                        <span style="color: #94a3b8; font-weight: 500; font-size: 0.8rem;">${irrVal}</span>
                                    </div>
                                </td>
                            </tr>
                        `;
                    }
                };

                const totalDiscount = res.bonusAmount + res.prepayDiscountAmt;

                let annualWithdrawal = 0;
                if (withdrawalPlan === '5yr') {
                    if (term === 2) annualWithdrawal = (comp.id === 'generali' ? 6900 : (comp.id === 'sunlife' ? 7500 : 6500));
                    else if (term === 5) annualWithdrawal = (comp.id === 'chubb' ? 6500 : 0);
                    annualWithdrawal = pureNominalTotal * (annualWithdrawal / 100000);
                } else if (withdrawalPlan === '10yr') {
                    let withdrawPct = (term === 2) ? 0.10 : (comp.id === 'chubb' ? 0.089 : 0.09);
                    annualWithdrawal = pureNominalTotal * withdrawPct;
                } else if (withdrawalPlan === '20yr') {
                    let withdrawPct = (term === 2) ? 0.20 : 0.18;
                    annualWithdrawal = pureNominalTotal * withdrawPct;
                }

                let wPctActualDisplay = totalActual > 0 && annualWithdrawal > 0 ? (annualWithdrawal / totalActual * 100).toFixed(1) + '%' : '-';
                
                let withdrawalPlanTitle = '';
                if (withdrawalPlan === '5yr') withdrawalPlanTitle = (term === 2 ? '5년말 후 인출플랜' : '6년말 후 인출플랜');
                else if (withdrawalPlan === '10yr') withdrawalPlanTitle = '10년말 후 인출플랜';
                else if (withdrawalPlan === '20yr') withdrawalPlanTitle = '20년말 후 인출플랜';
                if (withdrawalPlanTitle) withdrawalPlanTitle += ` (매년 ${wPctActualDisplay})`;

                const cardHtml = `
                    <div class="company-card ${comp.id}">
                        <div class="comp-header">
                            <div class="comp-title">${comp.name}</div>
                            <div class="comp-product">${comp.product}</div>
                        </div>
                        
                        <ul class="data-list" style="margin-bottom: 1rem;">
                            <li class="data-row">
                                <span>연간 보험료 (명목, ${term}년납)</span>
                                <span style="font-weight:600;">${formatUSD(p)}</span>
                            </li>
                            <li class="data-row">
                                <span>연간 보험료 (실납 평균)</span>
                                <span style="font-weight:600; color: #3b82f6;">${formatUSD(totalActual / term)}</span>
                            </li>
                            <li class="data-row">
                                <span>IA Levy (연간)</span>
                                <span style="font-weight:600; color: #64748b;">+${formatUSD(res.levy)}</span>
                            </li>
                        </ul>
                        <ul class="data-list summary-box-v3" style="margin: 0 0 0.5rem 0; display: flex; flex-direction: column; background: #f8fafc; border-radius: 8px; border: 1px dashed #cbd5e1; padding: 1rem; gap: 1rem;">
                            ${mode === 'forward' ? `
                            <li class="data-row total-usd v3-summary-item" style="flex-direction: column; align-items: flex-start; gap: 0.5rem; border: none; margin: 0; padding: 0;">
                                <span style="font-size: 1.3rem; font-weight: 800; color: #1e293b;">총 실납입액</span>
                                <div style="display: flex; align-items: center; gap: 0.4rem; width: 100%;">
                                    <span style="color: #0f172a; font-size: 1.3rem; font-weight: 800; font-variant-numeric: tabular-nums;">${formatUSD(totalActual)}</span>
                                    <span style="color: var(--text-muted); font-size: 0.95rem; font-weight: 600; font-variant-numeric: tabular-nums;">(${formatKRW(totalActual)})</span>
                                </div>
                            </li>
                            ` : `
                            <li class="data-row total-usd v3-summary-item" style="flex-direction: column; align-items: flex-start; gap: 0.5rem; border: none; margin: 0; padding: 0;">
                                <span style="font-size: 1.3rem; font-weight: 800; color: #1e293b;">총 명목 가입금액</span>
                                <div style="display: flex; align-items: center; gap: 0.4rem; width: 100%;">
                                    <span style="color: #0f172a; font-size: 1.3rem; font-weight: 800; font-variant-numeric: tabular-nums;">${formatUSD(pureNominalTotal)}</span>
                                    <span style="color: var(--text-muted); font-size: 0.95rem; font-weight: 600; font-variant-numeric: tabular-nums;">(${formatKRW(pureNominalTotal)})</span>
                                </div>
                            </li>
                            `}
                            <li class="data-row promo-row v3-summary-item" style="flex-direction: column; align-items: flex-start; gap: 0.5rem; border-top: 1px dashed #cbd5e1; padding-top: 1rem; margin: 0;">
                                <div style="font-weight: 600; color: #166534; font-size: 0.95rem;">총 프로모션 혜택 <span style="font-size:0.85rem; color:var(--text-muted); font-weight:normal;">(${res.bonusLabel}${isPrepay ? ' + 선납할인' : ''})</span></div>
                                <div style="display: flex; width: 100%; justify-content: space-between; align-items: center; flex-wrap: wrap; gap: 0.5rem;">
                                    <div style="display: flex; align-items: baseline; gap: 0.3rem;">
                                        <span style="font-weight:800; color: #15803d; font-size: 1.05rem; font-variant-numeric: tabular-nums;">-${formatUSD(totalDiscount)}</span>
                                        <span style="color: #16a34a; font-size: 0.8rem; font-weight: 600; font-variant-numeric: tabular-nums;">(-${formatKRW(totalDiscount)})</span>
                                    </div>
                                    <span style="font-size: 0.8rem; color: #059669; font-weight: 700; background: #dcfce7; padding: 0.15rem 0.4rem; border-radius: 4px;">할인율: ${((totalDiscount / pureNominalTotal) * 100).toFixed(1)}%</span>
                                </div>
                            </li>
                        </ul>
                            
                            ${withdrawalPlan !== 'none' ? `
                            <div class="withdrawal-box" style="background: #f0fdf4; padding: 1rem; border-radius: 8px; display: flex; justify-content: space-between; align-items: center; margin-bottom: 0.5rem;">
                                <span style="color: #166534; font-weight: 700;">${withdrawalPlanTitle}</span>
                                <div style="display: flex; flex-direction: column; align-items: flex-end;">
                                    <span style="color: #15803d; font-size: 1.2rem; font-weight: 800;">${annualWithdrawal > 0 ? formatUSD(annualWithdrawal) : '-'}</span>
                                    <span style="color: #16a34a; font-size: 0.9rem; font-weight: 600;">(${annualWithdrawal > 0 ? formatKRW(annualWithdrawal) : '-'})</span>
                                </div>
                            </div>
                            ` : ''}

                        <div style="margin-top: 1.5rem; overflow-x: auto; flex-grow: 1;">
                            <table class="yield-table ${withdrawalPlanSelect.value === 'none' ? 'yield-table-none' : ''}" style="min-width: ${withdrawalPlanSelect.value === 'none' ? '300px' : 'auto'};">
                                <thead>
                                    ${withdrawalPlanSelect.value === 'none' ? `
                                    <tr>
                                        <th style="text-align: left; font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-right: 0.5rem;">경과</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.5rem;">예상 환급금</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.5rem;">환급률 / IRR</th>
                                    </tr>
                                    ` : `
                                    <tr>
                                        <th style="text-align: left; font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-right: 0.4rem;">경과</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.4rem;">인출누적</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.4rem;">잔여환급금</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.4rem;">총 합계</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.4rem;">환급률 / IRR</th>
                                    </tr>
                                    `}
                                </thead>
                                <tbody>
                                    ${(withdrawalPlan === '10yr' || withdrawalPlan === '20yr') ? '' : getYieldHtml(term === 5 ? 6 : 5, res.surrender5yr, res.sv5_w5, null, null)}
                                    ${getYieldHtml(10, res.surrender10yr, res.sv10_w5, res.sv10_w10, res.sv10_w20)}
                                    ${getYieldHtml(20, res.surrender20yr, res.sv20_w5, res.sv20_w10, res.sv20_w20)}
                                    ${getYieldHtml(30, res.surrender30yr, res.sv30_w5, res.sv30_w10, res.sv30_w20)}
                                    ${getYieldHtml(40, res.surrender40yr, res.sv40_w5, res.sv40_w10, res.sv40_w20)}
                                    ${getYieldHtml(50, res.surrender50yr, res.sv50_w5, res.sv50_w10, res.sv50_w20)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
                grid.insertAdjacentHTML('beforeend', cardHtml);
            });
        } else {
            const selectedCompanyId = companySelect.value;
            const comp = companies.find(c => c.id === selectedCompanyId);
            if (!comp) return;

            let p = baseP;
            if (mode === 'reverse') {
                p = findPremiumForTargetActual(comp, budgetKrw, term, isPrepay);
            }
            const res = comp.getCalc(term, p, isPrepay);
            const pureNominalTotal = p * term;
            const totalActual = res.totalActual;

            const getYieldHtml = (year, sv, sv_w5, sv_w10, sv_w20, withdrawalPlan) => {
                let currentSv = sv;
                let accumulatedWithdrawal = 0;

                if (withdrawalPlan === '5yr') {
                    let wAmt = 0;
                    if (term === 2) wAmt = (comp.id === 'generali' ? 6900 : (comp.id === 'sunlife' ? 7500 : 6500));
                    else if (term === 5) wAmt = (comp.id === 'chubb' ? 6500 : 0);

                    let wStartYear = term === 5 ? 6 : 5;
                    if (year >= wStartYear) {
                        if (term === 5) {
                            if (year === 6) {
                                currentSv = sv;
                                accumulatedWithdrawal = 0;
                            } else {
                                currentSv = sv_w5;
                                accumulatedWithdrawal = pureNominalTotal * (wAmt / 100000) * (year - 6);
                            }
                        } else {
                            currentSv = sv_w5;
                            accumulatedWithdrawal = pureNominalTotal * (wAmt / 100000) * (year - 4);
                        }
                    } else {
                        currentSv = sv;
                        accumulatedWithdrawal = 0;
                    }
                } else if (withdrawalPlan === '10yr') {
                    let withdrawPct = (term === 2) ? 0.10 : (comp.id === 'chubb' ? 0.089 : 0.09);
                    if (year >= 10) {
                        currentSv = sv_w10;
                        accumulatedWithdrawal = pureNominalTotal * withdrawPct * (year - 9);
                    } else {
                        currentSv = sv;
                        accumulatedWithdrawal = 0;
                    }
                } else if (withdrawalPlan === '20yr') {
                    let withdrawPct = (term === 2) ? 0.20 : 0.18;
                    if (year >= 20) {
                        currentSv = sv_w20;
                        accumulatedWithdrawal = pureNominalTotal * withdrawPct * (year - 19);
                    } else {
                        currentSv = sv;
                        accumulatedWithdrawal = 0;
                    }
                }

                let isAvailable = (currentSv !== '-' && currentSv !== 0);
                let totalValue = isAvailable ? currentSv + accumulatedWithdrawal : '-';
                const yieldPctActual = isAvailable && totalActual > 0 ? (totalValue / totalActual) : 0;
                
                let wAmtForIrr = 0;
                let wStartYear = 99;
                if (withdrawalPlan === '5yr') {
                    let wAmtBase = (term === 2) ? (comp.id === 'generali' ? 6900 : (comp.id === 'sunlife' ? 7500 : 6500)) : (comp.id === 'chubb' ? 6500 : 0);
                    wAmtForIrr = pureNominalTotal * (wAmtBase / 100000);
                    // 2년납: 5년말부터(i>4), 5년납: 6년말부터(i>6) - display와 일치
                    wStartYear = (term === 2) ? 4 : 6;
                } else if (withdrawalPlan === '10yr') {
                    let withdrawPct = (term === 2) ? 0.10 : (comp.id === 'chubb' ? 0.089 : 0.09);
                    wAmtForIrr = pureNominalTotal * withdrawPct;
                    wStartYear = 9;
                } else if (withdrawalPlan === '20yr') {
                    let withdrawPct = (term === 2) ? 0.20 : 0.18;
                    wAmtForIrr = pureNominalTotal * withdrawPct;
                    wStartYear = 19;
                }

                const irrVal = isAvailable ? getIRR(term, totalActual, year, currentSv, wAmtForIrr, wStartYear) : '-';

                let svDisplay = isAvailable ? formatUSD(currentSv) : '-';
                let totalValueDisplay = isAvailable ? formatUSD(totalValue) : '-';

                if (withdrawalPlan === 'none') {
                    return `
                        <tr>
                            <td style="text-align: left; padding: 0.4rem 0.4rem 0.4rem 0; border-bottom: 1px dashed #e2e8f0; font-weight: 700; color: #475569; font-size: 0.85rem;">${year}년</td>
                            <td style="padding: 0.4rem 0 0.4rem 0.4rem; border-bottom: 1px dashed #e2e8f0; font-weight: 800; color: #0f172a; font-size: 0.85rem;">
                                <span style="display: inline-block; transform: scaleX(0.9); transform-origin: right;">${svDisplay}</span>
                            </td>
                            <td style="padding: 0.4rem 0 0.4rem 0.4rem; border-bottom: 1px dashed #e2e8f0;">
                                <div style="display: flex; justify-content: flex-end; align-items: baseline; gap: 3px; transform: scaleX(0.9); transform-origin: right;">
                                    <span style="color: var(--primary); font-weight: 700; font-size: 0.85rem;">${isAvailable ? formatYieldPercent(yieldPctActual) : '-'}</span>
                                    <span style="color: #cbd5e1; font-weight: 400; font-size: 0.8rem;">/</span>
                                    <span style="color: #64748b; font-weight: 500; font-size: 0.8rem;">${irrVal}</span>
                                </div>
                            </td>
                        </tr>
                    `;
                } else {
                    return `
                        <tr>
                            <td style="text-align: left; padding: 0.4rem 0.2rem 0.4rem 0; border-bottom: 1px dashed #e2e8f0; font-weight: 700; color: #475569; font-size: 0.85rem; white-space: nowrap;">${year}년</td>
                            <td style="padding: 0.4rem 0 0.4rem 0.3rem; border-bottom: 1px dashed #e2e8f0; font-weight: 500; color: #10b981; font-size: 0.8rem; opacity: 0.9;">
                                <span style="display: inline-block; transform: scaleX(0.88); transform-origin: right;">${accumulatedWithdrawal > 0 ? formatUSD(accumulatedWithdrawal) : '-'}</span>
                            </td>
                            <td style="padding: 0.4rem 0 0.4rem 0.3rem; border-bottom: 1px dashed #e2e8f0; font-weight: 500; color: #94a3b8; font-size: 0.8rem;">
                                <span style="display: inline-block; transform: scaleX(0.88); transform-origin: right;">${svDisplay}</span>
                            </td>
                            <td style="padding: 0.4rem 0 0.4rem 0.3rem; border-bottom: 1px dashed #e2e8f0; font-weight: 800; color: #0f172a; font-size: 0.85rem;">
                                <span style="display: inline-block; transform: scaleX(0.88); transform-origin: right;">${totalValueDisplay}</span>
                            </td>
                            <td style="padding: 0.4rem 0 0.4rem 0.3rem; border-bottom: 1px dashed #e2e8f0;">
                                <div style="display: flex; justify-content: flex-end; align-items: baseline; gap: 1px; transform: scaleX(0.85); transform-origin: right;">
                                    <span style="color: var(--primary); font-weight: 700; font-size: 0.85rem;">${isAvailable ? formatYieldPercent(yieldPctActual) : '-'}</span>
                                    <span style="color: #e2e8f0; font-weight: 400; font-size: 0.75rem;">/</span>
                                    <span style="color: #94a3b8; font-weight: 500; font-size: 0.75rem;">${irrVal}</span>
                                </div>
                            </td>
                        </tr>
                    `;
                }
            };

            const generateTableHtml = (withdrawalPlan, title) => {
                let annualWithdrawal = 0;
                if (withdrawalPlan === '5yr') {
                    if (term === 2) annualWithdrawal = (comp.id === 'generali' ? 6900 : (comp.id === 'sunlife' ? 7500 : 6500));
                    else if (term === 5) annualWithdrawal = (comp.id === 'chubb' ? 6500 : 0);
                    annualWithdrawal = pureNominalTotal * (annualWithdrawal / 100000);
                } else if (withdrawalPlan === '10yr') {
                    let withdrawPct = (term === 2) ? 0.10 : (comp.id === 'chubb' ? 0.089 : 0.09);
                    annualWithdrawal = pureNominalTotal * withdrawPct;
                } else if (withdrawalPlan === '20yr') {
                    let withdrawPct = (term === 2) ? 0.20 : 0.18;
                    annualWithdrawal = pureNominalTotal * withdrawPct;
                }

                let wPctActualDisplay = totalActual > 0 && annualWithdrawal > 0 ? (annualWithdrawal / totalActual * 100).toFixed(1) + '%' : '-';
                let dynamicTitle = title;
                if (withdrawalPlan !== 'none') {
                    dynamicTitle = title.split(' (매년')[0].trim() + ` (매년 ${wPctActualDisplay})`;
                }

                return `
                    <div style="margin-top: 0.5rem; overflow: hidden; display: flex; flex-direction: column;">
                        <h4 style="text-align: center; font-size: 1.1rem; color: #1e293b; margin-bottom: 1rem; font-weight: 800;">${dynamicTitle}</h4>
                        
                        <div style="background: #ecfdf5; border: 1px solid #a7f3d0; padding: 0.75rem 1rem; border-radius: 8px; margin-bottom: 1.5rem; text-align: center; ${withdrawalPlan === 'none' ? 'display: none;' : ''}">
                            <div style="font-size: 1.1rem; color: #065f46; font-weight: 800; font-variant-numeric: tabular-nums; display: flex; justify-content: center; align-items: baseline; gap: 0.3rem; flex-wrap: wrap;">
                                <span style="font-size: 0.9rem; color: #059669; font-weight: 700;">매년</span>
                                <span>${annualWithdrawal === 0 ? '-' : formatUSD(annualWithdrawal)}</span>
                                <span style="font-size: 0.9rem; color: #059669; font-weight: 700;">인출</span>
                                <span style="font-size: 0.9rem; font-weight: 600; opacity: 0.8;">(${annualWithdrawal === 0 ? '-' : formatKRW(annualWithdrawal)})</span>
                            </div>
                        </div>
                        
                        <div class="v4-table-wrapper" style="flex-grow: 1; display: flex; flex-direction: column; padding: 0 1.5rem;">
                            <table class="yield-table ${withdrawalPlan === 'none' ? 'yield-table-none' : ''}" style="min-width: ${withdrawalPlan === 'none' ? '300px' : 'auto'};">
                                <thead>
                                    ${withdrawalPlan === 'none' ? `
                                    <tr>
                                        <th style="text-align: left; font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-right: 0.4rem;">경과</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.4rem;">예상 환급금</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.4rem;">환급률 / IRR</th>
                                    </tr>
                                    ` : `
                                    <tr>
                                        <th style="text-align: left; font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-right: 0.2rem; white-space: nowrap;">경과</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.3rem; white-space: nowrap;">인출누적</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.3rem; white-space: nowrap;">잔여환급금</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.3rem; white-space: nowrap;">총 합계</th>
                                        <th style="font-size: 0.75rem; color: #64748b; font-weight: 700; border-bottom: 2px solid #cbd5e1; padding-bottom: 0.4rem; padding-left: 0.3rem; white-space: nowrap;">환급률/IRR</th>
                                    </tr>
                                    `}
                                </thead>
                                <tbody>
                                    ${getYieldHtml(term === 5 ? 6 : 5, res.surrender5yr, res.sv5_w5, null, null, withdrawalPlan)}
                                    ${getYieldHtml(10, res.surrender10yr, res.sv10_w5, res.sv10_w10, res.sv10_w20, withdrawalPlan)}
                                    ${getYieldHtml(20, res.surrender20yr, res.sv20_w5, res.sv20_w10, res.sv20_w20, withdrawalPlan)}
                                    ${getYieldHtml(30, res.surrender30yr, res.sv30_w5, res.sv30_w10, res.sv30_w20, withdrawalPlan)}
                                    ${getYieldHtml(40, res.surrender40yr, res.sv40_w5, res.sv40_w10, res.sv40_w20, withdrawalPlan)}
                                    ${getYieldHtml(50, res.surrender50yr, res.sv50_w5, res.sv50_w10, res.sv50_w20, withdrawalPlan)}
                                </tbody>
                            </table>
                        </div>
                    </div>
                `;
            };

            const totalDiscount = res.bonusAmount + res.prepayDiscountAmt;

            const cardHtml = `
                <div class="company-card ${comp.id}" style="grid-column: 1 / -1; display: block;">
                    <div class="comp-header">
                        <div class="comp-title">${comp.name}</div>
                        <div class="comp-product">${comp.product}</div>
                    </div>

                    <!-- Row 1: 가입조건(left) + 거치형(right) -->
                    <div class="v4-top-row">
                        <!-- 가입조건 패널 -->
                        <div class="v4-condition-panel">
                            <div class="condition-main-block">

                                <!-- 소블럭 1: 연간 납입 조건 (미니멀 화이트) -->
                                <div class="condition-sub1">

                                    <div class="cond-row">
                                        <span class="cond-label">연간 보험료 <span class="cond-sub-text">(명목, ${term}년납)</span></span>
                                        <span class="cond-val">${formatUSD(p)}</span>
                                    </div>
                                    <div class="cond-row">
                                        <span class="cond-label">연간 보험료 <span class="cond-sub-text">(실납 평균)</span></span>
                                        <span class="cond-val cond-val-blue">${formatUSD(totalActual / term)}</span>
                                    </div>
                                    <div class="cond-row">
                                        <span class="cond-label">IA Levy <span class="cond-sub-text">(연간)</span></span>
                                        <span class="cond-val cond-val-muted">+${formatUSD(res.levy)}</span>
                                    </div>
                                </div>

                                <div class="condition-sub2">
                                    ${mode === 'forward' ? `
                                    <div class="cond-row">
                                        <span class="cond-label-bold">총 실납입액</span>
                                        <span class="cond-val-lg">${formatUSD(totalActual)} <span class="cond-krw">(${formatKRW(totalActual)})</span></span>
                                    </div>
                                    <div class="cond-row">
                                        <div>
                                            <div class="cond-label cond-val-green" style="font-weight:700;">총 프로모션 혜택</div>
                                            <div class="cond-sub-text">${res.bonusLabel}${isPrepay ? ' + 선납할인' : ''}</div>
                                        </div>
                                        <div style="text-align:right;">
                                            <span class="cond-val cond-val-green">-${formatUSD(totalDiscount)} <span class="cond-krw cond-val-green">(-${formatKRW(totalDiscount)})</span></span>
                                            <span class="cond-badge" style="display:block;margin-top:0.2rem;">할인율: ${((totalDiscount / pureNominalTotal) * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div class="cond-row">
                                        <span class="cond-label">총 명목 가입금액</span>
                                        <span class="cond-val">${formatUSD(pureNominalTotal)} <span class="cond-krw">(${formatKRW(pureNominalTotal)})</span></span>
                                    </div>
                                    ` : `
                                    <div class="cond-row">
                                        <span class="cond-label-bold">총 명목 가입금액</span>
                                        <span class="cond-val-lg">${formatUSD(pureNominalTotal)} <span class="cond-krw">(${formatKRW(pureNominalTotal)})</span></span>
                                    </div>
                                    <div class="cond-row">
                                        <div>
                                            <div class="cond-label cond-val-green" style="font-weight:700;">총 프로모션 혜택</div>
                                            <div class="cond-sub-text">${res.bonusLabel}${isPrepay ? ' + 선납할인' : ''}</div>
                                        </div>
                                        <div style="text-align:right;">
                                            <span class="cond-val cond-val-green">-${formatUSD(totalDiscount)} <span class="cond-krw cond-val-green">(-${formatKRW(totalDiscount)})</span></span>
                                            <span class="cond-badge" style="display:block;margin-top:0.2rem;">할인율: ${((totalDiscount / pureNominalTotal) * 100).toFixed(1)}%</span>
                                        </div>
                                    </div>
                                    <div class="cond-row">
                                        <span class="cond-label">총 실납입액</span>
                                        <span class="cond-val cond-val-blue">${formatUSD(totalActual)} <span class="cond-krw">(${formatKRW(totalActual)})</span></span>
                                    </div>
                                    `}
                                </div>

                            </div>
                        </div>

                        <!-- 거치형 테이블 -->
                        <div class="v4-none-panel">
                            ${generateTableHtml('none', '거치형 (인출 안함)')}
                        </div>
                    </div>

                    <!-- Row 2: 인출플랜 3열 -->
                    <div class="v4-withdrawal-row">
                        ${term === 2 ? generateTableHtml('5yr', '5년말 후 인출플랜') : generateTableHtml('5yr', '6년말 후 인출플랜')}
                        ${generateTableHtml('10yr', `10년말 후 인출플랜 (매년 ${term === 2 ? '10%' : (comp.id === 'chubb' ? '8.9%' : '9%')})`)}
                        ${generateTableHtml('20yr', `20년말 후 인출플랜 (매년 ${term === 2 ? '20%' : '18%'})`)}
                    </div>
                </div>
            `;

            grid.insertAdjacentHTML('beforeend', cardHtml);
        }
    };

    const updateWithdrawalOptions = () => {
        const term = parseInt(termSelect.value);
        const options = withdrawalPlanSelect.options;
        for (let i = 0; i < options.length; i++) {
            if (options[i].value === '5yr') {
                options[i].text = term === 2 ? '5년말 후' : '6년말 후';
            } else if (options[i].value === '10yr') {
                options[i].text = '10년말 후';
            } else if (options[i].value === '20yr') {
                options[i].text = '20년말 후';
            }
        }
    };

    termSelect.addEventListener('change', updateWithdrawalOptions);

    [termSelect, prepayCheckbox, companySelect, withdrawalPlanSelect].forEach(el => {
        el.addEventListener('input', renderGrid);
        el.addEventListener('change', renderGrid);
    });

    [premiumInput, budgetKrwInput].forEach(inputEl => {
        inputEl.addEventListener('input', (e) => {
            let raw = e.target.value.replace(/[^0-9]/g, '');
            if (raw) {
                e.target.value = new Intl.NumberFormat('en-US').format(parseInt(raw, 10));
            } else {
                e.target.value = '';
            }
            renderGrid();
        });
    });

    // --- Native PDF Print Export Logic ---
    const btnDownloadPdfAdv = document.getElementById('btn-download-pdf-adv');
    if (btnDownloadPdfAdv) {
        btnDownloadPdfAdv.addEventListener('click', () => {
            window.print();
        });
    }

    renderGrid();
});

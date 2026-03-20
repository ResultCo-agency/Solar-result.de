/* ============================================
   SOLAR-RECHNER DEMO
   Calculation logic, gate, UI, charts
   ============================================ */

(function () {
    'use strict';

    // ── PLZ → Radiation (kWh/m²/a) ──
    const PLZ_R = {
        "01":{c:"Dresden",r:1050},"02":{c:"Görlitz",r:1040},"03":{c:"Cottbus",r:1060},
        "04":{c:"Leipzig",r:1055},"06":{c:"Halle",r:1050},"07":{c:"Jena",r:1030},
        "08":{c:"Zwickau",r:1020},"09":{c:"Chemnitz",r:1015},"10":{c:"Berlin",r:1060},
        "12":{c:"Berlin",r:1060},"13":{c:"Berlin",r:1060},"14":{c:"Potsdam",r:1065},
        "15":{c:"Frankfurt/Oder",r:1055},"16":{c:"Oranienburg",r:1050},
        "17":{c:"Neubrandenburg",r:1030},"18":{c:"Rostock",r:1045},"19":{c:"Schwerin",r:1025},
        "20":{c:"Hamburg",r:1000},"21":{c:"Hamburg-Süd",r:1000},"22":{c:"Hamburg-Nord",r:1000},
        "23":{c:"Lübeck",r:1010},"24":{c:"Kiel",r:1005},"25":{c:"Husum",r:1000},
        "26":{c:"Oldenburg",r:990},"27":{c:"Bremen",r:995},"28":{c:"Bremen",r:995},
        "29":{c:"Celle",r:1005},"30":{c:"Hannover",r:1010},"31":{c:"Hildesheim",r:1005},
        "32":{c:"Herford",r:1000},"33":{c:"Bielefeld",r:1000},"34":{c:"Kassel",r:1010},
        "35":{c:"Gießen",r:1025},"36":{c:"Fulda",r:1020},"37":{c:"Göttingen",r:1010},
        "38":{c:"Braunschweig",r:1015},"39":{c:"Magdeburg",r:1045},
        "40":{c:"Düsseldorf",r:1020},"41":{c:"Mönchengladbach",r:1015},
        "42":{c:"Wuppertal",r:1005},"44":{c:"Dortmund",r:1010},"45":{c:"Essen",r:1010},
        "46":{c:"Oberhausen",r:1010},"47":{c:"Duisburg",r:1015},"48":{c:"Münster",r:1005},
        "49":{c:"Osnabrück",r:995},"50":{c:"Köln",r:1025},"51":{c:"Köln-Ost",r:1025},
        "52":{c:"Aachen",r:1010},"53":{c:"Bonn",r:1030},"54":{c:"Trier",r:1040},
        "55":{c:"Mainz",r:1060},"56":{c:"Koblenz",r:1040},"57":{c:"Siegen",r:1000},
        "58":{c:"Hagen",r:1005},"59":{c:"Hamm",r:1010},"60":{c:"Frankfurt/Main",r:1070},
        "61":{c:"Bad Homburg",r:1060},"63":{c:"Offenbach",r:1070},
        "64":{c:"Darmstadt",r:1075},"65":{c:"Wiesbaden",r:1065},
        "66":{c:"Saarbrücken",r:1055},"67":{c:"Ludwigshafen",r:1080},
        "68":{c:"Mannheim",r:1085},"69":{c:"Heidelberg",r:1085},
        "70":{c:"Stuttgart",r:1090},"71":{c:"Böblingen",r:1085},
        "72":{c:"Tübingen",r:1080},"73":{c:"Esslingen",r:1085},
        "74":{c:"Heilbronn",r:1090},"75":{c:"Pforzheim",r:1080},
        "76":{c:"Karlsruhe",r:1100},"77":{c:"Offenburg",r:1110},
        "78":{c:"Konstanz",r:1105},"79":{c:"Freiburg",r:1150},
        "80":{c:"München",r:1120},"81":{c:"München-Süd",r:1120},
        "82":{c:"Starnberg",r:1125},"83":{c:"Rosenheim",r:1115},
        "84":{c:"Landshut",r:1100},"85":{c:"Freising",r:1110},
        "86":{c:"Augsburg",r:1105},"87":{c:"Kempten",r:1100},
        "88":{c:"Ravensburg",r:1100},"89":{c:"Ulm",r:1090},
        "90":{c:"Nürnberg",r:1070},"91":{c:"Erlangen",r:1065},
        "92":{c:"Amberg",r:1055},"93":{c:"Regensburg",r:1080},
        "94":{c:"Passau",r:1090},"95":{c:"Bayreuth",r:1040},
        "96":{c:"Bamberg",r:1050},"97":{c:"Würzburg",r:1070},
        "98":{c:"Suhl",r:1020},"99":{c:"Erfurt",r:1025}
    };

    const ORI = {
        south:     { l: "Süd",      f: 1.00 },
        southeast: { l: "Südost",   f: 0.95 },
        southwest: { l: "Südwest",  f: 0.95 },
        east:      { l: "Ost",      f: 0.85 },
        west:      { l: "West",     f: 0.85 },
        north:     { l: "Nord",     f: 0.60 }
    };

    const TLT = {
        "15": { l: "15° (flach)",   f: 0.91 },
        "25": { l: "25°",           f: 0.96 },
        "30": { l: "30° (optimal)", f: 1.00 },
        "35": { l: "35°",           f: 1.00 },
        "40": { l: "40°",           f: 0.98 },
        "45": { l: "45° (steil)",   f: 0.95 },
        "60": { l: "60°",           f: 0.85 }
    };

    const MO = [
        { m: "Jan", p: 0.03 }, { m: "Feb", p: 0.05 }, { m: "Mär", p: 0.08 },
        { m: "Apr", p: 0.11 }, { m: "Mai", p: 0.13 }, { m: "Jun", p: 0.14 },
        { m: "Jul", p: 0.14 }, { m: "Aug", p: 0.12 }, { m: "Sep", p: 0.09 },
        { m: "Okt", p: 0.06 }, { m: "Nov", p: 0.03 }, { m: "Dez", p: 0.02 }
    ];

    const CONS_D = [0.09, 0.085, 0.085, 0.08, 0.075, 0.07, 0.07, 0.075, 0.08, 0.085, 0.09, 0.095];

    // Constants
    const EFF = 0.85;
    const WP = 420;
    const M2 = 1.85;
    const CPK = 1350;
    const FIT = 0.082;
    const DEG = 0.005;
    const EI = 0.03;
    const DISCOUNT_RATE = 0.03;
    const BUYER_FACTOR = 0.75;
    const SYSTEM_LIFE = 25;

    // Webhook
    const SHEET_WEBHOOK = 'https://script.google.com/a/macros/resultco.de/s/AKfycbyA7xIjqHiiXvtcMc8pE__rDrys-US37g5MXhSVVsxh6kxyX2Yh8b2PDyscGpGK3PVZ/exec';

    // ── Formatters ──
    const fm = n => new Intl.NumberFormat('de-DE', { maximumFractionDigits: 0 }).format(n);
    const fd = (n, d) => new Intl.NumberFormat('de-DE', { minimumFractionDigits: d || 1, maximumFractionDigits: d || 1 }).format(n);
    const fc = n => new Intl.NumberFormat('de-DE', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(n);

    // ── Calculation Functions ──
    function evRate(cons, yld) {
        if (yld <= 0) return 0;
        return Math.min(1 - Math.exp(-1.1 * (cons / yld)), 0.75);
    }

    function calcPropertyValue(yearlyData, atYear) {
        var npv = 0;
        for (var y = atYear; y < SYSTEM_LIFE; y++) {
            var cf = (yearlyData[y] && yearlyData[y].gesamt) || 0;
            npv += cf / Math.pow(1 + DISCOUNT_RATE, y - atYear);
        }
        return Math.round(npv * BUYER_FACTOR);
    }

    function calculate(plz, roof, ori, tlt, vb, sp) {
        var prefix = plz.substring(0, 2);
        var loc = PLZ_R[prefix];
        if (!loc) return null;

        var rad = loc.r * ORI[ori].f * TLT[tlt].f;
        var mods = Math.floor(roof / M2);
        var kwp = (mods * WP) / 1000;
        var yld = kwp * rad * EFF;
        var er = evRate(vb, yld);
        var sc = yld * er;
        var fi = yld - sc;
        var dk = vb > 0 ? (sc / vb) * 100 : 0;
        var sv = sc * sp;
        var fe = fi * FIT;
        var tot = sv + fe;
        var cost = kwp * CPK;
        var amo = tot > 0 ? cost / tot : 99;

        // 25-year projection
        var yearly = [];
        var cum = -cost;
        for (var y = 0; y < SYSTEM_LIFE; y++) {
            var dg = yld * Math.pow(1 - DEG, y);
            var pr = sp * Math.pow(1 + EI, y);
            var eR = evRate(vb, dg);
            var s = dg * eR;
            var f = dg - s;
            var sv2 = s * pr;
            var fe2 = f * FIT;
            var tl = sv2 + fe2;
            cum += tl;
            yearly.push({
                jahr: y + 1,
                ertrag: Math.round(dg),
                ersparnis: Math.round(sv2),
                einspeisung: Math.round(fe2),
                gesamt: Math.round(tl),
                cashflow: Math.round(cum)
            });
        }

        // Property values
        var propValues = [];
        for (var y2 = 0; y2 < SYSTEM_LIFE; y2++) {
            propValues.push(calcPropertyValue(yearly, y2));
        }

        // Monthly data
        var monthly = [];
        for (var i = 0; i < 12; i++) {
            var prod = yld * MO[i].p;
            var cons = vb * CONS_D[i];
            var self = Math.min(prod * 0.7, cons);
            monthly.push({
                monat: MO[i].m,
                erzeugung: Math.round(prod),
                verbrauch: Math.round(cons),
                eigenverbrauch: Math.round(self),
                einspeisung: Math.round(prod - self)
            });
        }

        var e25 = 0;
        for (var y3 = 0; y3 < yearly.length; y3++) {
            e25 += yearly[y3].gesamt;
        }
        var co2 = yld * 0.4 * 25 / 1000;

        return {
            location: loc,
            rad: rad,
            mods: mods,
            kwp: kwp,
            yld: Math.round(yld),
            er: er,
            sc: Math.round(sc),
            fi: Math.round(fi),
            dk: dk,
            sv: Math.round(sv),
            fe: Math.round(fe),
            tot: Math.round(tot),
            cost: Math.round(cost),
            amo: amo,
            yearly: yearly,
            propValues: propValues,
            monthly: monthly,
            e25: Math.round(e25),
            co2: co2
        };
    }

    // ── State ──
    var currentConsumption = 3500;
    var monthlyChart = null;
    var cashflowChart = null;

    // ── DOM Elements ──
    function $(id) { return document.getElementById(id); }

    // ── Gate Logic ──
    function initGate() {
        var form = $('srdGateForm');
        var calculator = $('srdCalculator');

        // Start blurred
        calculator.classList.add('blurred');

        form.addEventListener('submit', function (e) {
            e.preventDefault();
            submitGate();
        });
    }

    function submitGate() {
        var company = $('gateCompany').value.trim();
        var name = $('gateName').value.trim();
        var email = $('gateEmail').value.trim();
        var phone = $('gatePhone').value.trim();
        var errorEl = $('gateError');
        var btn = $('gateBtn');

        // Reset errors
        errorEl.style.display = 'none';
        $('gateCompany').classList.remove('error');
        $('gateName').classList.remove('error');
        $('gateEmail').classList.remove('error');
        $('gatePhone').classList.remove('error');

        // Validate
        var errors = [];
        if (!company) {
            errors.push('Bitte geben Sie Ihren Firmennamen ein.');
            $('gateCompany').classList.add('error');
        }
        if (!name) {
            errors.push('Bitte geben Sie Ihren Namen ein.');
            $('gateName').classList.add('error');
        }
        if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
            errors.push('Bitte geben Sie eine gültige E-Mail-Adresse ein.');
            $('gateEmail').classList.add('error');
        }
        if (!phone) {
            errors.push('Bitte geben Sie Ihre Telefonnummer ein.');
            $('gatePhone').classList.add('error');
        }

        if (errors.length > 0) {
            errorEl.textContent = errors[0];
            errorEl.style.display = 'block';
            return;
        }

        // Disable button
        btn.disabled = true;
        btn.querySelector('span').textContent = 'Wird freigeschaltet...';

        // Send to webhook
        var payload = {
            timestamp: new Date().toISOString(),
            company: company,
            name: name,
            email: email,
            phone: phone,
            source: 'solarresult.de/solar-rechner-demo',
            status: 'Solar-Rechner Demo Lead'
        };

        fetch(SHEET_WEBHOOK, {
            method: 'POST',
            mode: 'no-cors',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        }).catch(function () {
            // Silent fail
        });

        // Track event
        if (window.fbq) {
            fbq('track', 'Lead', { content_name: 'Solar-Rechner Demo' });
        }

        // Unlock after short delay for UX
        setTimeout(function () {
            unlockCalculator();
        }, 600);
    }

    function unlockCalculator() {
        var calculator = $('srdCalculator');
        var gate = $('srdGate');

        calculator.classList.remove('blurred');
        gate.classList.add('hidden');

        // Scroll to calculator
        calculator.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }

    // ── Calculator UI ──
    function initCalculator() {
        var plzInput = $('calcPlz');
        var roofSlider = $('calcRoof');
        var roofValue = $('calcRoofValue');
        var oriSelect = $('calcOri');
        var tiltSelect = $('calcTilt');
        var priceSlider = $('calcPrice');
        var priceValue = $('calcPriceValue');
        var presetBtns = document.querySelectorAll('.srd-preset');
        var customWrap = $('calcCustomWrap');
        var customInput = $('calcCustomKwh');

        // PLZ input - only allow digits
        plzInput.addEventListener('input', function () {
            this.value = this.value.replace(/[^0-9]/g, '');
            updateResults();
        });

        // Roof slider
        roofSlider.addEventListener('input', function () {
            roofValue.textContent = this.value;
            updateResults();
        });

        // Orientation & Tilt
        oriSelect.addEventListener('change', updateResults);
        tiltSelect.addEventListener('change', updateResults);

        // Price slider
        priceSlider.addEventListener('input', function () {
            priceValue.textContent = fd(parseFloat(this.value), 2);
            updateResults();
        });

        // Preset buttons
        for (var i = 0; i < presetBtns.length; i++) {
            presetBtns[i].addEventListener('click', function () {
                for (var j = 0; j < presetBtns.length; j++) {
                    presetBtns[j].classList.remove('active');
                }
                this.classList.add('active');

                var kwh = this.getAttribute('data-kwh');
                if (kwh === 'custom') {
                    customWrap.style.display = 'block';
                    if (customInput.value) {
                        currentConsumption = parseInt(customInput.value) || 3500;
                    }
                } else {
                    customWrap.style.display = 'none';
                    currentConsumption = parseInt(kwh);
                }
                updateResults();
            });
        }

        // Custom consumption input
        customInput.addEventListener('input', function () {
            var val = parseInt(this.value);
            if (val && val > 0) {
                currentConsumption = val;
                updateResults();
            }
        });
    }

    function getPlzLocation(plz) {
        if (plz.length < 2) return null;
        var prefix = plz.substring(0, 2);
        return PLZ_R[prefix] || null;
    }

    function updateResults() {
        var plz = $('calcPlz').value;
        var roof = parseInt($('calcRoof').value);
        var ori = $('calcOri').value;
        var tlt = $('calcTilt').value;
        var sp = parseFloat($('calcPrice').value);
        var vb = currentConsumption;

        // PLZ info
        var plzInfo = $('calcPlzInfo');
        var loc = getPlzLocation(plz);

        if (plz.length >= 2 && loc) {
            plzInfo.textContent = loc.c + ' · ' + loc.r + ' kWh/m²/a';
            plzInfo.className = 'srd-field-info valid';
        } else if (plz.length >= 2) {
            plzInfo.textContent = 'PLZ nicht erkannt';
            plzInfo.className = 'srd-field-info invalid';
        } else {
            plzInfo.textContent = '';
            plzInfo.className = 'srd-field-info';
        }

        // Need valid 5-digit PLZ
        if (plz.length < 5 || !loc) {
            $('srdPreview').style.display = 'none';
            $('srdResults').style.display = 'none';
            return;
        }

        // Calculate
        var data = calculate(plz, roof, ori, tlt, vb, sp);
        if (!data) {
            $('srdPreview').style.display = 'none';
            $('srdResults').style.display = 'none';
            return;
        }

        // Show preview
        $('srdPreview').style.display = 'grid';
        $('prevKwp').textContent = fd(data.kwp, 1) + ' kWp';
        $('prevYield').textContent = fm(data.yld) + ' kWh';
        $('prevSavings').textContent = fc(data.tot);
        $('prevPropValue').textContent = '+' + fc(data.propValues[0]);

        // Show results
        $('srdResults').style.display = 'block';

        // KPI cards
        $('kpiSizeVal').textContent = fd(data.kwp, 1) + ' kWp';
        $('kpiSizeSub').textContent = data.mods + ' Module × 420W';

        $('kpiYieldVal').textContent = fm(data.yld) + ' kWh';
        $('kpiYieldSub').textContent = fm(Math.round(data.rad)) + ' kWh/m²/a effektiv';

        $('kpiSelfVal').textContent = Math.round(data.er * 100) + ' %';
        $('kpiSelfSub').textContent = fm(data.sc) + ' kWh selbst genutzt';

        $('kpiAutarkyVal').textContent = Math.round(data.dk) + ' %';
        $('kpiAutarkySub').textContent = 'Unabhängigkeit vom Netz';

        $('kpiSavingsVal').textContent = fc(data.tot);
        $('kpiSavingsSub').textContent = fc(data.sv) + ' Eigenverbr. + ' + fc(data.fe) + ' Einsp.';

        var amoColor = data.amo < 12 ? '#059669' : (data.amo < 18 ? '#B8910F' : '#DC2626');
        $('kpiAmortVal').textContent = fd(data.amo, 1) + ' Jahre';
        $('kpiAmortVal').style.color = amoColor;
        $('kpiAmortSub').textContent = 'Investition: ' + fc(data.cost);

        $('kpiPropVal').textContent = '+' + fc(data.propValues[0]);
        $('kpiPropSub').textContent = Math.round((data.propValues[0] / data.cost) * 100) + '% der Investition';

        $('kpiCo2Val').textContent = fd(data.co2, 1) + ' t';

        // Property value section
        $('propValNow').textContent = '+' + fc(data.propValues[0]);
        $('propVal10').textContent = '+' + fc(data.propValues[9] || 0);
        $('propValPct').textContent = Math.round((data.propValues[0] / data.cost) * 100) + ' %';

        // 25-year summary
        $('sum25Total').textContent = fc(data.e25);
        $('sum25Prop').textContent = '+' + fc(data.propValues[0]);
        $('sum25Co2').textContent = fd(data.co2, 1) + ' Tonnen CO₂';

        // Charts
        renderMonthlyChart(data);
        renderCashflowChart(data);

        // Table
        renderTable(data);
    }

    // ── Chart Rendering ──
    function renderMonthlyChart(data) {
        var ctx = $('chartMonthly');
        if (!ctx) return;

        var labels = [];
        var production = [];
        var consumption = [];
        for (var i = 0; i < data.monthly.length; i++) {
            labels.push(data.monthly[i].monat);
            production.push(data.monthly[i].erzeugung);
            consumption.push(data.monthly[i].verbrauch);
        }

        if (monthlyChart) {
            monthlyChart.data.labels = labels;
            monthlyChart.data.datasets[0].data = production;
            monthlyChart.data.datasets[1].data = consumption;
            monthlyChart.update();
            return;
        }

        monthlyChart = new Chart(ctx, {
            type: 'bar',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Erzeugung (kWh)',
                        data: production,
                        backgroundColor: 'rgba(101, 203, 201, 0.7)',
                        borderColor: 'rgba(101, 203, 201, 1)',
                        borderWidth: 1,
                        borderRadius: 4
                    },
                    {
                        label: 'Verbrauch (kWh)',
                        data: consumption,
                        backgroundColor: 'rgba(237, 186, 64, 0.3)',
                        borderColor: 'rgba(237, 186, 64, 0.8)',
                        borderWidth: 1,
                        borderRadius: 4
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: 'Manrope', size: 11 },
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: '#38434C',
                        titleFont: { family: 'Manrope', weight: '700' },
                        bodyFont: { family: 'Manrope' },
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            label: function (ctx) {
                                return ctx.dataset.label + ': ' + fm(ctx.parsed.y) + ' kWh';
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        ticks: { font: { family: 'Manrope', size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: {
                            font: { family: 'Manrope', size: 11 },
                            callback: function (val) { return fm(val); }
                        }
                    }
                }
            }
        });
    }

    function renderCashflowChart(data) {
        var ctx = $('chartCashflow');
        if (!ctx) return;

        var labels = [];
        var cashflow = [];
        var propValue = [];
        for (var i = 0; i < data.yearly.length; i++) {
            labels.push(data.yearly[i].jahr);
            cashflow.push(data.yearly[i].cashflow);
            propValue.push(data.propValues[i]);
        }

        if (cashflowChart) {
            cashflowChart.data.labels = labels;
            cashflowChart.data.datasets[0].data = cashflow;
            cashflowChart.data.datasets[1].data = propValue;
            cashflowChart.update();
            return;
        }

        cashflowChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: labels,
                datasets: [
                    {
                        label: 'Kum. Cashflow',
                        data: cashflow,
                        borderColor: '#059669',
                        backgroundColor: 'rgba(5, 150, 105, 0.08)',
                        fill: true,
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    },
                    {
                        label: 'Immobilienwert',
                        data: propValue,
                        borderColor: '#3B82F6',
                        backgroundColor: 'transparent',
                        borderDash: [5, 5],
                        tension: 0.3,
                        borderWidth: 2,
                        pointRadius: 0,
                        pointHoverRadius: 5
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            font: { family: 'Manrope', size: 11 },
                            padding: 16,
                            usePointStyle: true,
                            pointStyleWidth: 8
                        }
                    },
                    tooltip: {
                        backgroundColor: '#38434C',
                        titleFont: { family: 'Manrope', weight: '700' },
                        bodyFont: { family: 'Manrope' },
                        padding: 10,
                        cornerRadius: 8,
                        callbacks: {
                            title: function (items) {
                                return 'Jahr ' + items[0].label;
                            },
                            label: function (ctx) {
                                return ctx.dataset.label + ': ' + fc(ctx.parsed.y);
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        grid: { display: false },
                        title: {
                            display: true,
                            text: 'Jahre',
                            font: { family: 'Manrope', size: 11 }
                        },
                        ticks: { font: { family: 'Manrope', size: 11 } }
                    },
                    y: {
                        grid: { color: 'rgba(0,0,0,0.04)' },
                        ticks: {
                            font: { family: 'Manrope', size: 11 },
                            callback: function (val) { return fc(val); }
                        }
                    }
                }
            }
        });
    }

    // ── Table Rendering ──
    function renderTable(data) {
        var tbody = $('srdTableBody');
        if (!tbody) return;

        var showYears = [1, 2, 3, 4, 5, 10, 15, 20, 25];
        var html = '';

        for (var i = 0; i < showYears.length; i++) {
            var y = showYears[i];
            var row = data.yearly[y - 1];
            if (!row) continue;
            var pv = data.propValues[y - 1] || 0;
            var cfClass = row.cashflow >= 0 ? 'positive' : 'negative';

            html += '<tr>';
            html += '<td><strong>' + row.jahr + '</strong></td>';
            html += '<td>' + fm(row.ertrag) + '</td>';
            html += '<td>' + fc(row.ersparnis) + '</td>';
            html += '<td>' + fc(row.einspeisung) + '</td>';
            html += '<td><strong>' + fc(row.gesamt) + '</strong></td>';
            html += '<td class="' + cfClass + '">' + fc(row.cashflow) + '</td>';
            html += '<td class="blue">' + fc(pv) + '</td>';
            html += '</tr>';
        }

        tbody.innerHTML = html;
    }

    // ── Navbar ──
    function initNavbar() {
        var navbar = $('navbar');
        var toggle = $('mobileToggle');
        var menu = $('mobileMenu');

        // Scroll effect
        window.addEventListener('scroll', function () {
            if (window.scrollY > 20) {
                navbar.classList.add('scrolled');
            } else {
                navbar.classList.remove('scrolled');
            }
        });

        // Mobile toggle
        if (toggle && menu) {
            toggle.addEventListener('click', function () {
                menu.classList.toggle('active');
            });

            // Close menu on link click
            var menuLinks = menu.querySelectorAll('a');
            for (var i = 0; i < menuLinks.length; i++) {
                menuLinks[i].addEventListener('click', function () {
                    menu.classList.remove('active');
                });
            }
        }

        // Smooth scroll for anchor links
        var anchors = document.querySelectorAll('a[href^="#"]');
        for (var i = 0; i < anchors.length; i++) {
            anchors[i].addEventListener('click', function (e) {
                var href = this.getAttribute('href');
                if (href.length > 1) {
                    var target = document.querySelector(href);
                    if (target) {
                        e.preventDefault();
                        target.scrollIntoView({ behavior: 'smooth', block: 'start' });
                    }
                }
            });
        }
    }

    // ── Watermark ──
    function initWatermark() {
        var wm = $('srdWatermark');
        if (wm) {
            wm.addEventListener('click', function (e) {
                e.preventDefault();
                var cta = $('cta');
                if (cta) {
                    cta.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }
            });
        }
    }

    // ── Init ──
    function init() {
        initNavbar();
        initGate();
        initCalculator();
        initWatermark();
    }

    document.addEventListener('DOMContentLoaded', init);
})();

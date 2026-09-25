(function () {
	if (window.__plasicoLeasingBootstrapped) return;
	window.__plasicoLeasingBootstrapped = true;
	window.__leaseScriptRan = true;
	var CART_STORAGE_KEY = 'plasico-hss2026-cart';
	var APPLY_STORAGE_KEY = 'plasico-leasing-apply';

	/**
	 * Left: personal finance / „Купи на изплащане“ (BNP-style multipliers).
	 * Right: PostBank credit-card installments (distinct, slightly lower rates).
	 * Rates/fees are client-side approximations for local preview only.
	 */
	var COLUMNS = {
		personal: {
			id: 'personal',
			provider: 'bnp',
			title: 'Купи на изплащане',
			terms: [
				{ months: 3, multiplier: 1.185, glp: 17.91, gpr: 19.4, fee: 0 },
				{ months: 6, multiplier: 1.235, glp: 17.91, gpr: 19.4, fee: 0 },
				{ months: 12, multiplier: 1.29, glp: 17.91, gpr: 19.4, fee: 0 },
			],
		},
		postbank: {
			id: 'postbank',
			provider: 'postbank',
			title: 'Купи на вноски с кредитна карта на PostBank',
			terms: [
				{ months: 3, multiplier: 1.178, glp: 14.34, gpr: 15.29, fee: 0 },
				{ months: 6, multiplier: 1.221, glp: 14.34, gpr: 15.29, fee: 0 },
				{ months: 9, multiplier: 1.234, glp: 14.34, gpr: 15.29, fee: 0 },
				{ months: 12, multiplier: 1.261, glp: 14.34, gpr: 15.29, fee: 0 },
			],
		},
	};

	var MONTH_ROWS = [3, 6, 9, 12];
	var DEFAULT_PERSONAL_MONTHS = 12;

	var state = {
		column: 'personal',
		selectedMonths: DEFAULT_PERSONAL_MONTHS,
		personalMonths: DEFAULT_PERSONAL_MONTHS,
		price: 0,
		downPayment: 0,
		promoCode: '',
		prodId: '',
		apply: null,
	};

	function formatEuro(amount) {
		return amount.toFixed(2).replace('.', ',') + ' €';
	}

	function formatPercent(value) {
		return value.toFixed(2).replace('.', ',') + '%';
	}

	function parseEuroText(text) {
		if (!text) return 0;
		var normalized = String(text)
			.replace(/\u00a0/g, ' ')
			.replace(/\s+/g, ' ')
			.trim();
		var match = normalized.match(/(\d[\d\s]*)([.,])(\d{2})/);
		if (!match) return 0;
		var whole = match[1].replace(/\s/g, '');
		return parseFloat(whole + '.' + match[3]) || 0;
	}

	function parseLooseAmount(text) {
		if (text == null || text === '') return 0;
		var normalized = String(text)
			.replace(/\u00a0/g, ' ')
			.replace(/\s+/g, '')
			.replace(',', '.')
			.replace(/[^\d.-]/g, '');
		var value = parseFloat(normalized);
		return isFinite(value) && value > 0 ? value : 0;
	}

	function readCartFromStorage() {
		try {
			var raw = localStorage.getItem(CART_STORAGE_KEY);
			var parsed = raw ? JSON.parse(raw) : [];
			return Array.isArray(parsed) ? parsed : [];
		} catch (e) {
			return [];
		}
	}

	function getCartSubtotal(items) {
		return items.reduce(function (sum, item) {
			return sum + (Number(item.price) || 0) * (Number(item.qty) || 0);
		}, 0);
	}

	function parsePriceFromDom() {
		var selectors = [
			'#cart-drawer-subtotal',
			'.js-summary-products',
			'.js-summary-total',
			'#checkout #cart-table tr.totals.grand td + td span',
			'#checkout #cart-table .totals.grand span',
			'#cart-table tr.totals.grand span',
		];

		for (var i = 0; i < selectors.length; i++) {
			var el = document.querySelector(selectors[i]);
			if (!el) continue;
			var amount = parseEuroText(el.textContent);
			if (amount > 0) return amount;
		}

		return 0;
	}

	function syncCheckoutPaymentInstallments() {
		var pay8 = document.querySelector('input[name="payment_id"][value="8"]');
		if (!pay8) return;
		pay8.checked = true;
		try {
			pay8.dispatchEvent(new Event('change', { bubbles: true }));
		} catch (err) {
			/* IE fallback not needed for local preview */
		}
		var label = pay8.closest('label');
		if (label) {
			var radios = document.querySelectorAll('input[name="payment_id"]');
			for (var i = 0; i < radios.length; i++) {
				var lb = radios[i].closest('label');
				if (lb) lb.classList.toggle('clicked', radios[i].checked);
			}
		}
		var install = document.getElementById('installment-options');
		if (install) {
			install.classList.remove('hide', 'sf-hidden');
			install.removeAttribute('hidden');
		}
		var leasing = document.getElementById('leasing-schema');
		if (leasing) {
			leasing.classList.remove('hide', 'sf-hidden');
			leasing.removeAttribute('hidden');
		}
	}

	function escapeHtml(value) {
		return String(value == null ? '' : value)
			.replace(/&/g, '&amp;')
			.replace(/</g, '&lt;')
			.replace(/>/g, '&gt;')
			.replace(/"/g, '&quot;')
			.replace(/'/g, '&#39;');
	}

	function readSavedApply() {
		if (state.apply) return state.apply;
		try {
			var raw = sessionStorage.getItem(APPLY_STORAGE_KEY);
			if (!raw) return null;
			state.apply = JSON.parse(raw);
			return state.apply;
		} catch (e) {
			return null;
		}
	}

	function writeSavedApply(payload) {
		state.apply = payload;
		try {
			sessionStorage.setItem(APPLY_STORAGE_KEY, JSON.stringify(payload));
		} catch (e) {
			/* private mode / quota — in-memory still works */
		}
	}

	function clearSavedApply() {
		state.apply = null;
		try {
			sessionStorage.removeItem(APPLY_STORAGE_KEY);
		} catch (e) {
			/* ignore */
		}
	}

	/** Successful modal apply (sessionStorage / state.apply with core fields). */
	function isLeasingApplyFilled() {
		var data = readSavedApply();
		return !!(
			data &&
			String(data.fullName || '').trim() &&
			String(data.phone || '').trim() &&
			String(data.egn || '').trim() &&
			String(data.email || '').trim()
		);
	}

	/** Payment method „На изплащане с PostBank“ (shows #pl-leasing-saved). */
	function isPostBankInstallmentPaymentSelected() {
		var checked = document.querySelector('input[name="payment_id"]:checked');
		return !!(checked && String(checked.value) === '8');
	}

	/**
	 * Filled apply + still on leasing path (payment 8 or nothing chosen yet).
	 * Selecting any other payment restores the normal Купи + aside CTA.
	 */
	function isLeasingCompletedCtaActive() {
		if (!isLeasingApplyFilled()) return false;
		var checked = document.querySelector('input[name="payment_id"]:checked');
		if (!checked) return true;
		return String(checked.value) === '8';
	}

	/**
	 * Approved credit path: leasing apply completed (`#pl-leasing-saved` /
	 * is-leasing-complete) AND „На изплащане с PostBank“ selected.
	 * Green notice + hide Физическо лице only then — not on PostBank click alone.
	 * „Копирай от горните данни“ stays visible/usable in all states.
	 */
	function isLeasingInvoicePathActive() {
		return isLeasingApplyFilled() && isPostBankInstallmentPaymentSelected();
	}

	var BUY_LABEL_DEFAULT = 'Купи';
	var BUY_LABEL_LEASING = 'КУПИ НА ИЗПЛАЩАНЕ';
	var BUY_HINT_LEASING = '(Продължаваш към страницата на кредитора)';
	var BUY_HINT_ID = 'checkout-finish-leasing-hint';

	function getFinishBuyButton() {
		return (
			document.querySelector('#step-confirm .checkout-finish.btn') ||
			document.querySelector('#checkout .checkout-finish.btn') ||
			document.querySelector('.checkout-finish.btn')
		);
	}

	function ensureFinishWrap(buy) {
		if (!buy || !buy.parentNode) return null;
		var parent = buy.parentNode;
		if (parent.classList && parent.classList.contains('checkout-finish-wrap')) {
			return parent;
		}
		var wrap = document.createElement('div');
		wrap.className = 'checkout-finish-wrap';
		parent.insertBefore(wrap, buy);
		wrap.appendChild(buy);
		return wrap;
	}

	function removeLeasingHint() {
		var hint = document.getElementById(BUY_HINT_ID);
		if (hint && hint.parentNode) hint.parentNode.removeChild(hint);
	}

	/** Hide aside leasing CTA + morph Купи when apply is filled on leasing path. */
	function syncCheckoutCta() {
		var active = isLeasingCompletedCtaActive();
		var aside = document.getElementById('aside-leasing-btn');
		var buy = getFinishBuyButton();

		if (aside) {
			if (active) {
				aside.hidden = true;
				aside.setAttribute('aria-hidden', 'true');
			} else if (state.price > 0) {
				aside.hidden = false;
				aside.removeAttribute('aria-hidden');
			}
		}

		if (!buy) return;

		var wrap = ensureFinishWrap(buy);
		if (wrap) wrap.classList.toggle('is-leasing-complete', active);

		if (active) {
			buy.classList.add('is-leasing-complete');
			buy.setAttribute('data-leasing-cta', '1');
			buy.innerHTML =
				'<span class="checkout-finish__label">' + BUY_LABEL_LEASING + '</span>';
			var hint = document.getElementById(BUY_HINT_ID);
			if (!hint) {
				hint = document.createElement('span');
				hint.id = BUY_HINT_ID;
				hint.className = 'checkout-finish__hint';
				if (wrap) wrap.appendChild(hint);
				else if (buy.parentNode) buy.parentNode.insertBefore(hint, buy.nextSibling);
			}
			hint.textContent = BUY_HINT_LEASING;
			hint.hidden = false;
		} else if (
			buy.classList.contains('is-leasing-complete') ||
			buy.getAttribute('data-leasing-cta') === '1'
		) {
			buy.classList.remove('is-leasing-complete');
			buy.removeAttribute('data-leasing-cta');
			buy.textContent = BUY_LABEL_DEFAULT;
			removeLeasingHint();
		}

		document.documentElement.classList.toggle('pl-leasing-cta-complete', active);
		document.body.classList.toggle('is-leasing-ready', active);
		document.body.setAttribute('data-leasing-ready', active ? '1' : '0');
	}

	/* —— Invoice (фактура) wiring after leasing apply —— */
	var INVOICE_LEASING_AUTO_MSG =
		'Автоматично ще бъде издадена фактура на физическото лице при кредит. - ако вместо това желаете фактура на фирма изберете опцията по-долу.';
	var INVOICE_LEASING_MOL_MSG =
		'При фактура за фирма и кредит трябва задължително потребителят на кредита да е МОЛ на фирмата';
	var INVOICE_AUTO_MSG_ID = 'co-invoice-leasing-auto-msg';
	var INVOICE_MOL_BADGE_ID = 'co-invoice-leasing-mol-badge';
	var invoiceLeasingBound = false;
	var invoiceSyncLock = false;

	function dispatchDomChange(el) {
		if (!el) return;
		try {
			el.dispatchEvent(new Event('change', { bubbles: true }));
		} catch (err) {
			/* ignore */
		}
	}

	function ensureInvoiceLeasingMessages() {
		var fields = document.getElementById('checkout-invoice-fields');
		if (!fields) return { top: null, badge: null };

		var top = document.getElementById(INVOICE_AUTO_MSG_ID);
		if (!top) {
			top = document.createElement('p');
			top.id = INVOICE_AUTO_MSG_ID;
			top.className = 'co-invoice-leasing-auto-msg';
			top.setAttribute('role', 'status');
			top.hidden = true;
			top.textContent = INVOICE_LEASING_AUTO_MSG;
			fields.insertBefore(top, fields.firstChild);
		}

		var firms = document.getElementById('checkout-firms');
		var badge = document.getElementById(INVOICE_MOL_BADGE_ID);
		if (!badge && firms) {
			badge = document.createElement('p');
			badge.id = INVOICE_MOL_BADGE_ID;
			badge.className = 'co-invoice-leasing-mol-badge';
			badge.setAttribute('role', 'status');
			badge.hidden = true;
			badge.textContent = INVOICE_LEASING_MOL_MSG;
			firms.insertBefore(badge, firms.firstChild);
		} else if (!badge) {
			badge = document.getElementById(INVOICE_MOL_BADGE_ID);
		}
		return { top: top, badge: badge };
	}

	function hideInvoiceLeasingUi() {
		var top = document.getElementById(INVOICE_AUTO_MSG_ID);
		var badge = document.getElementById(INVOICE_MOL_BADGE_ID);
		if (top) top.hidden = true;
		if (badge) badge.hidden = true;
		document.body.removeAttribute('data-leasing-invoice');
		syncFizicheskoPersonTypeAvailability(false);
		restoreInvoicePersonPanelsAfterLeasing();
	}

	/**
	 * When leasing payment path is active, Физическо лице is not a switchable
	 * option (invoice is automatic per the green notice). Only ЮЛ stays available.
	 * „Тип лице“ label is also hidden — not useful with a single remaining option.
	 * Radio stays enabled so the auto физ value still submits with the form.
	 * @param {boolean} lock
	 */
	function syncFizicheskoPersonTypeAvailability(lock) {
		var radio = document.getElementById('invoice-person-1');
		var label = radio && radio.closest ? radio.closest('label') : null;
		var group = document.querySelector('.co-person-type');
		var typeLabel = document.getElementById('invoice-person-type-label');
		if (label) {
			label.hidden = !!lock;
			label.classList.toggle('is-leasing-person-locked', !!lock);
			label.setAttribute('aria-hidden', lock ? 'true' : 'false');
		}
		if (group) group.classList.toggle('is-leasing-person-locked', !!lock);
		if (typeLabel) {
			typeLabel.hidden = !!lock;
			typeLabel.setAttribute('aria-hidden', lock ? 'true' : 'false');
		}
	}

	function showInvoiceFieldsPanel() {
		var want = document.getElementById('want-invoice');
		var inv = document.getElementById('checkout-invoice-fields');
		var label = document.querySelector('label.co-invoice-check[for=want-invoice]');
		if (want && !want.checked) {
			want.checked = true;
			dispatchDomChange(want);
		}
		if (label) label.classList.add('is-checked');
		if (inv) {
			inv.classList.remove('hide', 'sf-hidden');
			inv.removeAttribute('hidden');
		}
	}

	function selectInvoicePersonType(value) {
		var radio = document.querySelector(
			'input[name="invoice_person_type"][value="' + value + '"]'
		);
		if (!radio) return;
		radio.checked = true;
		var group = document.querySelectorAll('input[name="invoice_person_type"]');
		for (var i = 0; i < group.length; i++) {
			var lb = group[i].closest('label');
			if (lb) lb.classList.toggle('clicked', group[i].checked);
		}
		dispatchDomChange(radio);
	}

	function applyLeasingToInvoiceIndividual(data) {
		var names = document.getElementById('person-names');
		if (names && data.fullName) names.value = String(data.fullName);
		/* Invoice физ лице has no ЕГН field; leasing EGN stays on #pl-leasing-egn. */
		var copyCb = document.getElementById('copy-person-from-above');
		if (copyCb && copyCb.checked) {
			copyCb.checked = false;
			var copyLabel = document.querySelector(
				'label.co-invoice-check[for=copy-person-from-above]'
			);
			if (copyLabel) copyLabel.classList.remove('is-checked');
			dispatchDomChange(copyCb);
		}
	}

	function applyLeasingToInvoiceMol(data) {
		var mol = document.getElementById('firm-mol');
		if (mol && data.fullName) mol.value = String(data.fullName);
	}

	/**
	 * Show firm vs individual invoice panels to match the selected person type.
	 * On the leasing path, hide #checkout-person-individual even for физ —
	 * invoice is automatic; Копирай / Три имена / Адрес are not shown.
	 * @param {boolean} isFirm
	 * @param {boolean} [hideIndividualForLeasing]
	 */
	function syncInvoicePersonPanels(isFirm, hideIndividualForLeasing) {
		var firms = document.getElementById('checkout-firms');
		var indiv = document.getElementById('checkout-person-individual');
		function show(el) {
			if (!el) return;
			el.classList.remove('hide', 'sf-hidden');
			el.removeAttribute('hidden');
			if (el.style && el.style.display === 'none') el.style.display = '';
		}
		function hide(el) {
			if (!el) return;
			el.classList.add('hide', 'sf-hidden');
		}
		if (isFirm) {
			show(firms);
			hide(indiv);
		} else {
			hide(firms);
			if (hideIndividualForLeasing) {
				hide(indiv);
			} else {
				show(indiv);
			}
		}
	}

	/** Restore firm/individual panels after leaving the leasing invoice path. */
	function restoreInvoicePersonPanelsAfterLeasing() {
		var want = document.getElementById('want-invoice');
		if (!want || !want.checked) return;
		var type = document.querySelector('input[name="invoice_person_type"]:checked');
		var isFirm = !!(type && String(type.value) === '2');
		syncInvoicePersonPanels(isFirm, false);
	}

	/**
	 * After leasing apply + PostBank installment selected: open „Искам фактура“,
	 * autofill физ. лице (automatic — option + individual fields + „Тип лице“ hidden),
	 * show credit notice with firm-option hint.
	 * On ЮЛ: firm fields + МОЛ + red badge. Notices/locks clear when payment leaves leasing.
	 * @param {{ forceIndividual?: boolean }} opts
	 */
	function syncInvoiceFromLeasing(opts) {
		if (invoiceSyncLock) return;
		invoiceSyncLock = true;
		try {
			opts = opts || {};
			var data = readSavedApply();
			var filled = isLeasingApplyFilled();
			var pathActive = isLeasingInvoicePathActive();
			var ui = ensureInvoiceLeasingMessages();

			if (!filled || !data) {
				hideInvoiceLeasingUi();
				return;
			}

			syncFizicheskoPersonTypeAvailability(pathActive);

			/* Leasing filled but PostBank installment not selected → hide notices + unlock UI. */
			if (!pathActive) {
				if (ui.top) ui.top.hidden = true;
				if (ui.badge) ui.badge.hidden = true;
				restoreInvoicePersonPanelsAfterLeasing();
				return;
			}

			var want = document.getElementById('want-invoice');
			var primed = document.body.getAttribute('data-leasing-invoice') === '1';
			var shouldPrime = opts.forceIndividual || !primed;

			if (shouldPrime) {
				document.body.setAttribute('data-leasing-invoice', '1');
				showInvoiceFieldsPanel();
				/* Auto физ path — option label stays hidden; radio remains selected. */
				selectInvoicePersonType('1');
			}

			if (!want || !want.checked) {
				if (ui.top) ui.top.hidden = true;
				if (ui.badge) ui.badge.hidden = true;
				return;
			}

			var type = document.querySelector('input[name="invoice_person_type"]:checked');
			var isFirm = !!(type && String(type.value) === '2');

			/* Leasing path: always hide individual fields; ЮЛ still shows firm panel. */
			syncInvoicePersonPanels(isFirm, true);

			if (isFirm) {
				applyLeasingToInvoiceMol(data);
				if (ui.top) ui.top.hidden = true;
				if (ui.badge) {
					ui.badge.textContent = INVOICE_LEASING_MOL_MSG;
					ui.badge.hidden = false;
				}
			} else {
				applyLeasingToInvoiceIndividual(data);
				if (ui.top) {
					ui.top.textContent = INVOICE_LEASING_AUTO_MSG;
					ui.top.hidden = false;
				}
				if (ui.badge) ui.badge.hidden = true;
			}
		} finally {
			invoiceSyncLock = false;
		}
	}

	function bindInvoiceLeasingWatchers() {
		if (invoiceLeasingBound) return;
		invoiceLeasingBound = true;
		document.addEventListener(
			'change',
			function (e) {
				var t = e.target;
				if (!t || !t.name) return;
				if (
					t.name !== 'invoice_person_type' &&
					t.name !== 'want_invoice' &&
					t.name !== 'payment_id'
				) {
					return;
				}
				if (!isLeasingApplyFilled() && t.name !== 'payment_id') return;
				syncInvoiceFromLeasing({ forceIndividual: false });
			},
			false
		);
		/*
		 * Re-clicking already-selected ЮЛ while leasing returns to automatic физ.
		 * Must read checked state on pointerdown — by click time the browser has
		 * already checked the radio when switching FROM физ TO ЮЛ, so a naive
		 * click handler would treat the first select as a re-click and block ЮЛ.
		 */
		var yulCheckedBeforePointer = false;
		document.addEventListener(
			'pointerdown',
			function (e) {
				yulCheckedBeforePointer = false;
				if (!isLeasingInvoicePathActive()) return;
				var t = e.target;
				if (!t || !t.closest) return;
				var label = t.closest('.co-person-type label');
				if (!label || label.hidden) return;
				var radio = label.querySelector(
					'input[name="invoice_person_type"][value="2"]'
				);
				yulCheckedBeforePointer = !!(radio && radio.checked);
			},
			true
		);
		document.addEventListener(
			'click',
			function (e) {
				if (!isLeasingInvoicePathActive()) return;
				if (!yulCheckedBeforePointer) return;
				var t = e.target;
				if (!t || !t.closest) return;
				var label = t.closest('.co-person-type label');
				if (!label || label.hidden) return;
				var radio = label.querySelector(
					'input[name="invoice_person_type"][value="2"]'
				);
				if (!radio) return;
				yulCheckedBeforePointer = false;
				e.preventDefault();
				selectInvoicePersonType('1');
				syncInvoiceFromLeasing({ forceIndividual: false });
			},
			true
		);
		document.addEventListener('plasico:leasing-apply', function () {
			syncInvoiceFromLeasing({ forceIndividual: true });
		});
	}

	function syncInstallmentOptionSelection(columnId) {
		var kind = columnId === 'postbank' ? 'bnp-card' : 'bnp';
		Array.prototype.slice
			.call(document.querySelectorAll('.installment-option[data-installment]'))
			.forEach(function (btn) {
				var active = btn.getAttribute('data-installment') === kind;
				btn.setAttribute('aria-pressed', active ? 'true' : 'false');
				btn.classList.toggle('is-selected', active);
			});
	}

	function syncHiddenApplyFields(data) {
		var host = document.getElementById('leasing-schema');
		if (!host) return;
		var fields = {
			leasing_full_name: data && data.fullName,
			leasing_phone: data && data.phone,
			leasing_egn: data && data.egn,
			leasing_email: data && data.email,
			leasing_column: data && data.column,
			leasing_provider: data && data.provider,
			leasing_months: data && data.months,
			leasing_monthly: data && data.monthly,
			leasing_total: data && data.total,
			leasing_down_payment: data && data.downPayment,
			leasing_promo_code: data && data.promoCode,
		};
		Object.keys(fields).forEach(function (name) {
			var input = host.querySelector('input[name="' + name + '"]');
			if (!input) {
				input = document.createElement('input');
				input.type = 'hidden';
				input.name = name;
				host.appendChild(input);
			}
			input.value = fields[name] == null ? '' : String(fields[name]);
		});
	}

	function renderSavedApply() {
		var data = readSavedApply();
		var host = document.getElementById('leasing-schema');
		if (!host) return;

		var panel = document.getElementById('pl-leasing-saved');
		if (!panel) {
			panel = document.createElement('div');
			panel.id = 'pl-leasing-saved';
			panel.className = 'pl-leasing-saved';
			host.insertBefore(panel, host.firstChild);
		}

		if (!data) {
			panel.hidden = true;
			panel.innerHTML = '';
			syncHiddenApplyFields(null);
			syncCheckoutCta();
			syncInvoiceFromLeasing();
			return;
		}

		syncHiddenApplyFields(data);
		syncInstallmentOptionSelection(data.column);

		var schemeLine =
			escapeHtml(data.columnTitle || '') +
			' — ' +
			escapeHtml(String(data.months || '')) +
			' вноски × ' +
			escapeHtml(formatEuro(Number(data.monthly) || 0));
		if (Number(data.downPayment) > 0) {
			schemeLine +=
				' · първон. вноска ' + escapeHtml(formatEuro(Number(data.downPayment) || 0));
		}

		panel.hidden = false;
		panel.innerHTML =
			'<p class="pl-leasing-saved__title">Данни за кандидатстване</p>' +
			'<dl class="pl-leasing-saved__list">' +
			'<div class="pl-leasing-saved__row"><dt>Име</dt><dd>' +
			escapeHtml(data.fullName) +
			'</dd></div>' +
			'<div class="pl-leasing-saved__row"><dt>Телефон</dt><dd>' +
			escapeHtml(data.phone) +
			'</dd></div>' +
			'<div class="pl-leasing-saved__row"><dt>ЕГН</dt><dd>' +
			escapeHtml(data.egn) +
			'</dd></div>' +
			'<div class="pl-leasing-saved__row"><dt>Ел. поща</dt><dd>' +
			escapeHtml(data.email) +
			'</dd></div>' +
			'</dl>' +
			'<p class="pl-leasing-saved__scheme">' +
			schemeLine +
			'</p>' +
			'<button type="button" class="pl-leasing-saved__edit" id="pl-leasing-saved-edit">Промени данните</button>';

		var editBtn = document.getElementById('pl-leasing-saved-edit');
		if (editBtn) {
			editBtn.addEventListener('click', function () {
				openModal({ column: data.column || 'personal' });
			});
		}

		var pay8 = document.querySelector('input[name="payment_id"][value="8"]');
		if (pay8 && pay8.checked) {
			host.classList.remove('hide', 'sf-hidden');
			host.removeAttribute('hidden');
		}
		syncCheckoutCta();
		syncInvoiceFromLeasing();
	}

	function readInputValue(sel) {
		var el = typeof sel === 'string' ? document.querySelector(sel) : sel;
		if (!el) return '';
		return String(el.value || '').trim();
	}

	function readAuthEmail() {
		try {
			var raw = localStorage.getItem('plasico_demo_auth');
			if (!raw) return '';
			var parsed = JSON.parse(raw);
			if (parsed && parsed.loggedIn && parsed.email) {
				return String(parsed.email).trim();
			}
		} catch (e) {
			/* ignore */
		}
		return '';
	}

	/** Pull name/phone/email/egn from checkout guest fields, invoice person, auth. */
	function readCheckoutCustomerData() {
		var fullName =
			readInputValue('#field-name') ||
			readInputValue('#person-names') ||
			readInputValue('#field-address-person') ||
			readInputValue('#register-name') ||
			'';
		var phone =
			readInputValue('#field-phone') ||
			readInputValue('#field-address-person-phone') ||
			'';
		var email =
			readInputValue('#field-email') ||
			readAuthEmail() ||
			readInputValue('#auth-email') ||
			readInputValue('#login-email') ||
			readInputValue('#register-email') ||
			'';
		var egn = readInputValue('#person-egn') || '';
		return { fullName: fullName, phone: phone, email: email, egn: egn };
	}

	function setApplyFieldIfEmpty(input, value) {
		if (!input || !value) return;
		if (String(input.value || '').trim()) return;
		input.value = value;
	}

	function fillApplyFormFromSaved() {
		var data = readSavedApply();
		if (!data) return;
		var nameInput = document.getElementById('pl-leasing-name');
		var phoneInput = document.getElementById('pl-leasing-phone');
		var egnInput = document.getElementById('pl-leasing-egn');
		var emailInput = document.getElementById('pl-leasing-email');
		var agreeTerms = document.getElementById('pl-leasing-agree-terms');
		var agreeApply = document.getElementById('pl-leasing-agree-apply');
		var agreePrivacy = document.getElementById('pl-leasing-agree-privacy');
		/* Restore only non-empty saved values so empty leftovers do not wipe fields. */
		if (nameInput && data.fullName) nameInput.value = data.fullName;
		if (phoneInput && data.phone) phoneInput.value = data.phone;
		if (egnInput && data.egn) egnInput.value = data.egn;
		if (emailInput && data.email) emailInput.value = data.email;
		if (agreeTerms) agreeTerms.checked = true;
		if (agreeApply) agreeApply.checked = true;
		if (agreePrivacy) agreePrivacy.checked = true;
	}

	/** Prefill empty apply fields from checkout/auth; never overwrite typed values.
	 *  Name only when Cyrillic (field requires кирилица) — skip Latin-only names. */
	function fillApplyFormFromCustomer() {
		var apply = document.getElementById('pl-leasing-apply');
		if (!apply) return;
		var data = readCheckoutCustomerData();
		if (isCyrillicName(data.fullName)) {
			setApplyFieldIfEmpty(document.getElementById('pl-leasing-name'), data.fullName);
		}
		setApplyFieldIfEmpty(document.getElementById('pl-leasing-phone'), data.phone);
		setApplyFieldIfEmpty(document.getElementById('pl-leasing-email'), data.email);
		setApplyFieldIfEmpty(document.getElementById('pl-leasing-egn'), data.egn);
	}

	/** Saved first, then checkout — safe to call whenever apply becomes visible. */
	function autofillApplyForm() {
		fillApplyFormFromSaved();
		fillApplyFormFromCustomer();
	}

	function isLeasingOverlayOpen() {
		var overlay = document.getElementById('pl-leasing-overlay');
		return !!(overlay && !overlay.hidden);
	}

	function bindApplyAutofillWatchers(overlay) {
		if (overlay.__plApplyAutofillBound) return;
		overlay.__plApplyAutofillBound = true;

		var apply = overlay.querySelector('#pl-leasing-apply');
		var body = overlay.querySelector('.pl-leasing-body');

		/* When the user scrolls the apply block into view, refill empty fields. */
		if (apply && typeof IntersectionObserver === 'function') {
			var io = new IntersectionObserver(
				function (entries) {
					entries.forEach(function (entry) {
						if (entry.isIntersecting && isLeasingOverlayOpen()) {
							autofillApplyForm();
						}
					});
				},
				{ root: body || null, threshold: 0.05 }
			);
			io.observe(apply);
		}

		/* If checkout fields change while the modal is open, backfill empties. */
		var checkoutSels = [
			'#field-name',
			'#field-phone',
			'#field-email',
			'#person-egn',
			'#person-names',
			'#field-address-person',
			'#field-address-person-phone',
		];
		checkoutSels.forEach(function (sel) {
			var el = document.querySelector(sel);
			if (!el || el.__plLeasingAutofillBound) return;
			el.__plLeasingAutofillBound = true;
			el.addEventListener('input', function () {
				if (isLeasingOverlayOpen()) autofillApplyForm();
			});
			el.addEventListener('change', function () {
				if (isLeasingOverlayOpen()) autofillApplyForm();
			});
		});
	}

	function parsePrice() {
		var fromStorage = getCartSubtotal(readCartFromStorage());
		if (fromStorage > 0) return fromStorage;
		return parsePriceFromDom();
	}

	function getProdId() {
		var input = document.querySelector('#buy-form input[name="prod_id"]');
		return input ? input.value : '';
	}

	function getFinancedAmount() {
		var financed = state.price - (Number(state.downPayment) || 0);
		return financed > 0 ? financed : 0;
	}

	function calcTerm(price, term) {
		var total = price * term.multiplier;
		var monthly = term.months > 0 ? total / term.months : 0;
		return {
			months: term.months,
			monthly: monthly,
			total: total,
			glp: term.glp,
			gpr: term.gpr,
			fee: term.fee || 0,
			multiplier: term.multiplier,
		};
	}

	function findColumnTerm(columnId, months) {
		var column = COLUMNS[columnId];
		if (!column) return null;
		for (var i = 0; i < column.terms.length; i++) {
			if (column.terms[i].months === months) {
				return calcTerm(getFinancedAmount(), column.terms[i]);
			}
		}
		return null;
	}

	function ensurePersonalMonthsValid() {
		if (findColumnTerm('personal', state.personalMonths)) return;
		if (findColumnTerm('personal', DEFAULT_PERSONAL_MONTHS)) {
			state.personalMonths = DEFAULT_PERSONAL_MONTHS;
			return;
		}
		state.personalMonths = COLUMNS.personal.terms[COLUMNS.personal.terms.length - 1].months;
	}

	function ensureSelectionValid() {
		if (findColumnTerm(state.column, state.selectedMonths)) return;
		var terms = COLUMNS[state.column].terms;
		state.selectedMonths = terms[terms.length - 1].months;
	}

	function getSelectedTerm() {
		var term = findColumnTerm(state.column, state.selectedMonths);
		if (term) return term;
		var fallbackColumn = COLUMNS[state.column] || COLUMNS.personal;
		var last = fallbackColumn.terms[fallbackColumn.terms.length - 1];
		return calcTerm(getFinancedAmount(), last);
	}

	/** Teaser always reflects left-column „изплащане“ (not credit-card). */
	function getTeaserTerm() {
		ensurePersonalMonthsValid();
		var term = findColumnTerm('personal', state.personalMonths);
		if (term) return term;
		var last = COLUMNS.personal.terms[COLUMNS.personal.terms.length - 1];
		return calcTerm(getFinancedAmount(), last);
	}

	function teaserText(term) {
		return 'За ' + term.months + ' месеца x ' + formatEuro(term.monthly);
	}

	function summaryText(term) {
		var cartTotal = Number(state.price) || 0;
		var monthlyPart =
			formatEuro(term.monthly) + ' / месец - ' + term.months + ' вноски';
		if (cartTotal <= 0) return 'Обща сума: ' + monthlyPart;
		/* Cart grand total (aside СУМА ЗА ПЛАЩАНЕ) + selected installment line */
		return 'Обща сума: ' + formatEuro(cartTotal) + ' · ' + monthlyPart;
	}

	function schemeCardHtml(columnId, term) {
		if (!term) {
			return '<div class="pl-leasing-cell pl-leasing-cell--empty" aria-hidden="true"></div>';
		}

		var isActive =
			state.column === columnId && state.selectedMonths === term.months;
		var radioId = 'pl-leasing-' + columnId + '-' + term.months;

		return (
			'<label class="pl-leasing-cell' +
			(isActive ? ' is-active' : '') +
			'" for="' +
			radioId +
			'" data-column="' +
			columnId +
			'">' +
			'<input' +
			' type="radio"' +
			' class="pl-leasing-radio"' +
			' name="pl-leasing-scheme"' +
			' id="' +
			radioId +
			'"' +
			' data-column="' +
			columnId +
			'"' +
			' data-months="' +
			term.months +
			'"' +
			(isActive ? ' checked' : '') +
			' />' +
			'<span class="pl-leasing-cell-body">' +
			'<span class="pl-leasing-cell-months">' +
			term.months +
			' месеца</span>' +
			'<span class="pl-leasing-cell-monthly">' +
			formatEuro(term.monthly) +
			'</span>' +
			'<span class="pl-leasing-cell-meta">' +
			'ГЛП: ' +
			formatPercent(term.glp) +
			'<br />' +
			'ГПР: ' +
			formatPercent(term.gpr) +
			'<br />' +
			'Такса ангажимент: ' +
			formatEuro(term.fee) +
			'<br />' +
			'Общо: ' +
			formatEuro(term.total) +
			'</span>' +
			'</span>' +
			'</label>'
		);
	}

	function ensureModal() {
		if (document.getElementById('pl-leasing-overlay')) {
			return document.getElementById('pl-leasing-overlay');
		}

		var overlay = document.createElement('div');
		overlay.id = 'pl-leasing-overlay';
		overlay.className = 'pl-leasing-overlay';
		overlay.hidden = true;
		overlay.innerHTML =
			'<div class="pl-leasing-modal" role="dialog" aria-modal="true" aria-labelledby="pl-leasing-title">' +
			'  <button type="button" class="pl-leasing-close" aria-label="Затвори">&times;</button>' +
			'  <div class="pl-leasing-head">' +
			'    <div class="pl-leasing-title-wrap">' +
			'      <h2 class="pl-leasing-title" id="pl-leasing-title">Купи на изплащане</h2>' +
			'      <p class="pl-leasing-subtitle">Сравни схемите и избери удобен план за плащане</p>' +
			'    </div>' +
			'  </div>' +
			'  <div class="pl-leasing-body">' +
			'    <div class="pl-leasing-toolbar">' +
			'      <label class="pl-leasing-field">' +
			'        <span class="pl-leasing-field-label">Промо код:</span>' +
			'        <input type="text" id="pl-leasing-promo" class="pl-leasing-input" placeholder="Промо код..." autocomplete="off" />' +
			'      </label>' +
			'      <label class="pl-leasing-field">' +
			'        <span class="pl-leasing-field-label">Първоначална вноска:</span>' +
			'        <input type="text" id="pl-leasing-down" class="pl-leasing-input" inputmode="decimal" />' +
			'      </label>' +
			'      <button type="button" class="pl-leasing-recalc" id="pl-leasing-recalc">Преизчисли</button>' +
			'    </div>' +
			'    <div class="pl-leasing-summary" id="pl-leasing-summary"></div>' +
			'    <div class="pl-leasing-grid-wrap">' +
			'      <div class="pl-leasing-grid" id="pl-leasing-grid" role="table" aria-label="Схеми на изплащане"></div>' +
			'    </div>' +
			'    <form class="pl-leasing-apply" id="pl-leasing-apply" novalidate>' +
			'      <h3 class="pl-leasing-apply-title">Кандидатствай за лизинг:</h3>' +
			'      <div class="pl-leasing-apply-fields">' +
			'        <input type="text" name="full_name" id="pl-leasing-name" class="pl-leasing-apply-input" placeholder="Име и фамилия ... (задължително на кирилица)" autocomplete="name" />' +
			'        <input type="tel" name="phone" id="pl-leasing-phone" class="pl-leasing-apply-input" placeholder="Телефон за контакти ... (започващ с нула)" autocomplete="tel" inputmode="tel" />' +
			'        <input type="text" name="egn" id="pl-leasing-egn" class="pl-leasing-apply-input" placeholder="ЕГН ..." autocomplete="off" inputmode="numeric" />' +
			'        <input type="email" name="email" id="pl-leasing-email" class="pl-leasing-apply-input" placeholder="Ел. поща ..." autocomplete="email" />' +
			'      </div>' +
			'      <p class="pl-leasing-apply-help">Моля въведете коректна ел. поща. На нея ще получите инструкции за завършване на Вашата кандидатура за кредитиране.</p>' +
			'      <div class="pl-leasing-apply-checks">' +
			'        <label class="pl-leasing-apply-check">' +
			'          <input type="checkbox" name="agree_terms" id="pl-leasing-agree-terms" value="1" />' +
			'          <span>Имам навършени 18 години и съм съгласен с <a class="pl-leasing-apply-link" href="https://plasico.bg/help?info=52" target="_blank" rel="noopener noreferrer">общите условия и начина на обработка на личните ми данни</a></span>' +
			'        </label>' +
			'        <label class="pl-leasing-apply-check">' +
			'          <input type="checkbox" name="agree_apply" id="pl-leasing-agree-apply" value="1" />' +
			'          <span>Запознах се с <a class="pl-leasing-apply-link" href="https://plasico.bg/help?info=52" target="_blank" rel="noopener noreferrer">условията за кандидатстване на ПБ Лични финанси</a></span>' +
			'        </label>' +
			'        <label class="pl-leasing-apply-check">' +
			'          <input type="checkbox" name="agree_privacy" id="pl-leasing-agree-privacy" value="1" />' +
			'          <span>Запознах се с <a class="pl-leasing-apply-link" href="https://static.plasico.bg/resources/191112164954personal_data_policy.pdf" target="_blank" rel="noopener noreferrer">информацията за защита на личните данни</a></span>' +
			'        </label>' +
			'      </div>' +
			'      <a class="pl-leasing-apply-product" href="http://dw-file.eu/%D0%91%D0%9D%D0%9F%20%D0%9F%D0%B0%D1%80%D0%B8%D0%B1%D0%B0%20%D0%9B%D0%A4-%D0%9F%D1%80%D0%BE%D0%B4%D1%83%D0%BA%D1%82%D0%BE%D0%B2%D0%B0%20%D0%B8%D0%BD%D1%84%D0%BE%D1%80%D0%BC%D0%B0%D1%86%D0%B8%D1%8F.pdf" target="_blank" rel="noopener noreferrer">Продуктова Информация на ПБ Лични финанси</a>' +
			'      <p class="pl-leasing-apply-error" id="pl-leasing-apply-error" hidden></p>' +
			'      <p class="pl-leasing-apply-success" id="pl-leasing-apply-success" hidden></p>' +
			'      <button type="submit" class="pl-leasing-apply-submit" id="pl-leasing-apply-submit">Продължи с поръчката</button>' +
			'    </form>' +
			'  </div>' +
			'</div>';

		document.body.appendChild(overlay);

		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) closeModal();
		});

		overlay.querySelector('.pl-leasing-close').addEventListener('click', closeModal);

		overlay.querySelector('#pl-leasing-recalc').addEventListener('click', function () {
			state.price = parsePrice();
			applyToolbarInputs();
			renderModal();
			renderTeaser();
		});

		['#pl-leasing-down', '#pl-leasing-promo'].forEach(function (sel) {
			overlay.querySelector(sel).addEventListener('keydown', function (e) {
				if (e.key === 'Enter') {
					e.preventDefault();
					state.price = parsePrice();
					applyToolbarInputs();
					renderModal();
					renderTeaser();
				}
			});
		});

		overlay.querySelector('#pl-leasing-apply').addEventListener('submit', handleApplySubmit);
		bindApplyAutofillWatchers(overlay);

		document.addEventListener('keydown', function (e) {
			if (e.key === 'Escape' && !overlay.hidden) {
				closeModal();
			}
		});

		return overlay;
	}

	function isCyrillicName(value) {
		var trimmed = String(value || '').trim();
		if (!trimmed) return false;
		return /^[\u0400-\u04FF\s\-'.]+$/.test(trimmed) && /[\u0400-\u04FF]/.test(trimmed);
	}

	function isPhoneStartingWithZero(value) {
		var digits = String(value || '').replace(/[\s\-()]/g, '');
		return /^0\d{8,9}$/.test(digits);
	}

	function isLikelyEgn(value) {
		var digits = String(value || '').replace(/\s+/g, '');
		return /^\d{10}$/.test(digits);
	}

	function isEmailFormat(value) {
		var trimmed = String(value || '').trim();
		return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed);
	}

	function clearApplyFeedback() {
		var errorEl = document.getElementById('pl-leasing-apply-error');
		var successEl = document.getElementById('pl-leasing-apply-success');
		if (errorEl) {
			errorEl.hidden = true;
			errorEl.textContent = '';
		}
		if (successEl) {
			successEl.hidden = true;
			successEl.textContent = '';
		}
		Array.prototype.slice
			.call(document.querySelectorAll('.pl-leasing-apply-input.is-invalid, .pl-leasing-apply-check.is-invalid'))
			.forEach(function (el) {
				el.classList.remove('is-invalid');
			});
	}

	function showApplyError(message) {
		var errorEl = document.getElementById('pl-leasing-apply-error');
		var successEl = document.getElementById('pl-leasing-apply-success');
		if (successEl) {
			successEl.hidden = true;
			successEl.textContent = '';
		}
		if (!errorEl) return;
		errorEl.hidden = false;
		errorEl.textContent = message;
	}

	function showApplySuccess(message) {
		var errorEl = document.getElementById('pl-leasing-apply-error');
		var successEl = document.getElementById('pl-leasing-apply-success');
		if (errorEl) {
			errorEl.hidden = true;
			errorEl.textContent = '';
		}
		if (!successEl) return;
		successEl.hidden = false;
		successEl.textContent = message;
	}

	function handleApplySubmit(e) {
		e.preventDefault();
		clearApplyFeedback();

		var nameInput = document.getElementById('pl-leasing-name');
		var phoneInput = document.getElementById('pl-leasing-phone');
		var egnInput = document.getElementById('pl-leasing-egn');
		var emailInput = document.getElementById('pl-leasing-email');
		var agreeTerms = document.getElementById('pl-leasing-agree-terms');
		var agreeApply = document.getElementById('pl-leasing-agree-apply');
		var agreePrivacy = document.getElementById('pl-leasing-agree-privacy');

		var invalid = false;
		var firstInvalid = null;

		function markInvalid(el) {
			if (!el) return;
			el.classList.add('is-invalid');
			if (el.type === 'checkbox' && el.parentElement) {
				el.parentElement.classList.add('is-invalid');
			}
			if (!firstInvalid) firstInvalid = el;
			invalid = true;
		}

		if (!isCyrillicName(nameInput && nameInput.value)) {
			markInvalid(nameInput);
		}
		if (!isPhoneStartingWithZero(phoneInput && phoneInput.value)) {
			markInvalid(phoneInput);
		}
		if (!isLikelyEgn(egnInput && egnInput.value)) {
			markInvalid(egnInput);
		}
		if (!isEmailFormat(emailInput && emailInput.value)) {
			markInvalid(emailInput);
		}
		if (!(agreeTerms && agreeTerms.checked)) {
			markInvalid(agreeTerms);
		}
		if (!(agreeApply && agreeApply.checked)) {
			markInvalid(agreeApply);
		}
		if (!(agreePrivacy && agreePrivacy.checked)) {
			markInvalid(agreePrivacy);
		}

		if (invalid) {
			showApplyError(
				'Моля попълнете коректно всички полета (име на кирилица, телефон започващ с 0, ЕГН, ел. поща) и приемете условията.'
			);
			if (firstInvalid && typeof firstInvalid.focus === 'function') {
				firstInvalid.focus();
			}
			return;
		}

		ensureSelectionValid();
		var selected = getSelectedTerm();
		var columnTitle = (COLUMNS[state.column] && COLUMNS[state.column].title) || state.column;
		var payload = {
			fullName: String(nameInput.value || '').trim(),
			phone: String(phoneInput.value || '').trim(),
			egn: String(egnInput.value || '').replace(/\s+/g, ''),
			email: String(emailInput.value || '').trim(),
			column: state.column,
			provider: COLUMNS[state.column] && COLUMNS[state.column].provider,
			columnTitle: columnTitle,
			months: selected.months,
			monthly: selected.monthly,
			total: selected.total,
			promoCode: state.promoCode,
			downPayment: state.downPayment,
			price: state.price,
			financed: getFinancedAmount(),
			prodId: state.prodId,
		};

		if (typeof console !== 'undefined' && console.log) {
			console.log('[PlasicoLeasing] local apply (no backend)', payload);
		}

		writeSavedApply(payload);
		if (payload.column === 'personal') {
			state.personalMonths = payload.months;
		}
		state.column = payload.column;
		state.selectedMonths = payload.months;
		syncCheckoutPaymentInstallments();
		syncInstallmentOptionSelection(payload.column);
		renderSavedApply();
		renderTeaser();
		syncCheckoutCta();
		try {
			document.dispatchEvent(
				new CustomEvent('plasico:leasing-apply', { detail: payload })
			);
		} catch (evtErr) {
			/* CustomEvent unsupported — syncCheckoutCta already ran */
		}
		closeModal();

		var paymentStep = document.getElementById('step-payment');
		if (paymentStep && typeof paymentStep.scrollIntoView === 'function') {
			try {
				paymentStep.scrollIntoView({ behavior: 'smooth', block: 'start' });
			} catch (scrollErr) {
				paymentStep.scrollIntoView(true);
			}
		}
	}

	function applyToolbarInputs() {
		var promoInput = document.getElementById('pl-leasing-promo');
		var downInput = document.getElementById('pl-leasing-down');
		if (promoInput) {
			state.promoCode = String(promoInput.value || '').trim();
		}
		if (downInput) {
			var parsed = parseLooseAmount(downInput.value);
			if (parsed > state.price) parsed = state.price;
			state.downPayment = parsed;
		}
	}

	function syncToolbarInputs() {
		var promoInput = document.getElementById('pl-leasing-promo');
		var downInput = document.getElementById('pl-leasing-down');
		if (promoInput && document.activeElement !== promoInput) {
			promoInput.value = state.promoCode || '';
		}
		if (downInput && document.activeElement !== downInput) {
			downInput.value = formatEuro(state.downPayment || 0);
		}
	}

	function renderGrid() {
		var grid = document.getElementById('pl-leasing-grid');
		if (!grid) return;

		var header =
			'<div class="pl-leasing-grid-row pl-leasing-grid-row--head" role="row">' +
			'<div class="pl-leasing-grid-corner" role="columnheader"></div>' +
			'<div class="pl-leasing-grid-colhead" role="columnheader">' +
			COLUMNS.personal.title +
			'</div>' +
			'<div class="pl-leasing-grid-colhead pl-leasing-grid-colhead--postbank" role="columnheader">' +
			COLUMNS.postbank.title +
			'</div>' +
			'</div>';

		var rows = MONTH_ROWS.map(function (months) {
			var personalTerm = findColumnTerm('personal', months);
			var postbankTerm = findColumnTerm('postbank', months);
			return (
				'<div class="pl-leasing-grid-row" role="row">' +
				'<div class="pl-leasing-grid-month" role="rowheader">' +
				months +
				' месеца</div>' +
				schemeCardHtml('personal', personalTerm) +
				schemeCardHtml('postbank', postbankTerm) +
				'</div>'
			);
		}).join('');

		grid.innerHTML = header + rows;

		Array.prototype.slice
			.call(grid.querySelectorAll('.pl-leasing-radio'))
			.forEach(function (radio) {
				radio.addEventListener('change', function () {
					if (!radio.checked) return;
					var columnId = radio.getAttribute('data-column');
					var months = Number(radio.getAttribute('data-months'));
					state.column = columnId;
					state.selectedMonths = months;
					if (columnId === 'personal') {
						state.personalMonths = months;
					}
					renderModal();
					renderTeaser();
				});
			});
	}

	function renderModal() {
		ensureModal();
		ensureSelectionValid();
		ensurePersonalMonthsValid();
		syncToolbarInputs();

		var selected = getSelectedTerm();
		document.getElementById('pl-leasing-summary').textContent = summaryText(selected);
		renderGrid();
		if (isLeasingOverlayOpen()) {
			autofillApplyForm();
		}
	}

	function syncLeasingControls() {
		var hasPrice = state.price > 0;
		var hideAsideFilled = isLeasingCompletedCtaActive();
		document.querySelectorAll('.js-open-leasing').forEach(function (btn) {
			if (btn.id === 'aside-leasing-btn') {
				btn.hidden = !hasPrice || hideAsideFilled;
				if (btn.hidden) btn.setAttribute('aria-hidden', 'true');
				else btn.removeAttribute('aria-hidden');
				return;
			}
			btn.hidden = !hasPrice;
		});
		syncCheckoutCta();
	}

	function renderTeaser() {
		var buttons = document.querySelectorAll('.js-open-leasing');
		if (!buttons.length) return;

		var text = state.price ? teaserText(getTeaserTerm()) : '';

		buttons.forEach(function (btn) {
			var teaser = btn.querySelector('.pl-leasing-teaser-text');
			if (teaser) {
				teaser.textContent = text;
			}
		});
		syncLeasingControls();
	}

	function refresh() {
		state.price = parsePrice();
		if (state.downPayment > state.price) {
			state.downPayment = state.price;
		}
		renderTeaser();
		var overlay = document.getElementById('pl-leasing-overlay');
		if (overlay && !overlay.hidden) {
			renderModal();
		}
	}

	function resolveColumnFromOptions(options) {
		if (!options) return 'personal';
		if (options.column && COLUMNS[options.column]) return options.column;
		if (
			options.provider === 'postbank' ||
			options.provider === 'card' ||
			options.provider === 'bnp-card'
		) {
			return 'postbank';
		}
		if (options.provider === 'bnp' || options.provider === 'unicredit') {
			return 'personal';
		}
		return 'personal';
	}

	function openModal(options) {
		state.column = resolveColumnFromOptions(options);
		state.price = parsePrice();
		state.prodId = getProdId();
		ensurePersonalMonthsValid();

		if (state.column === 'personal') {
			state.selectedMonths = state.personalMonths;
		} else {
			ensureSelectionValid();
		}

		if (!state.price) {
			console.warn('[PlasicoLeasing] open blocked: cart total is 0');
			return;
		}

		syncCheckoutPaymentInstallments();
		var overlay = ensureModal();
		renderModal();
		clearApplyFeedback();
		/* Fill after DOM exists and overlay is shown — apply may be below the fold. */
		overlay.hidden = false;
		overlay.removeAttribute('hidden');
		document.body.style.overflow = 'hidden';
		bindApplyAutofillWatchers(overlay);
		autofillApplyForm();
		/* Second pass after layout/scroll so late checkout values still land. */
		window.setTimeout(function () {
			if (isLeasingOverlayOpen()) autofillApplyForm();
		}, 0);
	}

	function closeModal() {
		var overlay = document.getElementById('pl-leasing-overlay');
		if (!overlay) return;
		overlay.hidden = true;
		document.body.style.overflow = '';
	}

	function shouldHandleLocally() {
		return (
			document.body.id === 'product_preview' ||
			document.querySelector('.js-open-leasing') ||
			document.querySelector('[data-url^="leasing"]') ||
			document.getElementById('cart-drawer-subtotal') ||
			document.getElementById('checkout') ||
			document.querySelector('.checkout-mock')
		);
	}

	function bindTriggers() {
		document.body.addEventListener(
			'click',
			function (e) {
				var trigger = e.target.closest(
					'[data-url^="leasing"], .js-open-leasing'
				);
				if (!trigger) return;

				e.preventDefault();
				e.stopPropagation();
				openModal({
					column: trigger.getAttribute('data-leasing-column') || 'personal',
				});
				return false;
			},
			true
		);

		document.body.addEventListener('click', function (e) {
			var option = e.target.closest('.installment-option[data-installment]');
			if (!option) return;

			var kind = option.getAttribute('data-installment');
			if (kind === 'bnp-card') {
				openModal({ column: 'postbank', provider: 'bnp-card' });
				return;
			}
			if (kind === 'bnp') {
				openModal({ column: 'personal', provider: 'bnp' });
			}
		});
	}

	function init() {
		if (!shouldHandleLocally()) return;

		state.price = parsePrice();
		state.prodId = getProdId();
		state.personalMonths = DEFAULT_PERSONAL_MONTHS;
		state.selectedMonths = DEFAULT_PERSONAL_MONTHS;
		state.column = 'personal';
		readSavedApply();
		if (state.apply) {
			if (state.apply.column && COLUMNS[state.apply.column]) {
				state.column = state.apply.column;
			}
			if (state.apply.months) {
				state.selectedMonths = Number(state.apply.months) || state.selectedMonths;
				if (state.column === 'personal') {
					state.personalMonths = state.selectedMonths;
				}
			}
			if (state.apply.downPayment != null) {
				state.downPayment = Number(state.apply.downPayment) || 0;
			}
			if (state.apply.promoCode) {
				state.promoCode = String(state.apply.promoCode);
			}
		}
		renderTeaser();
		bindInvoiceLeasingWatchers();
		renderSavedApply();
		bindTriggers();

		document.addEventListener('plasico:cart-updated', refresh);

		var paymentRadios = document.querySelectorAll('input[name="payment_id"]');
		Array.prototype.slice.call(paymentRadios).forEach(function (radio) {
			radio.addEventListener('change', function () {
				if (radio.value === '8') {
					renderSavedApply();
				} else {
					syncCheckoutCta();
					syncInvoiceFromLeasing({ forceIndividual: false });
				}
			});
		});

		syncCheckoutCta();

		window.PlasicoLeasing = {
			open: openModal,
			close: closeModal,
			refresh: refresh,
			getApply: readSavedApply,
			clearApply: function () {
				clearSavedApply();
				hideInvoiceLeasingUi();
				renderSavedApply();
				renderTeaser();
				syncCheckoutCta();
			},
			isApplyFilled: isLeasingApplyFilled,
			isCompletedCtaActive: isLeasingCompletedCtaActive,
			syncCheckoutCta: syncCheckoutCta,
			syncInvoiceFromLeasing: syncInvoiceFromLeasing,
			getState: function () {
				var selected = getSelectedTerm();
				var teaser = getTeaserTerm();
				return {
					price: state.price,
					downPayment: state.downPayment,
					promoCode: state.promoCode,
					financed: getFinancedAmount(),
					prodId: state.prodId,
					column: state.column,
					provider: COLUMNS[state.column].provider,
					selectedMonths: state.selectedMonths,
					personalMonths: state.personalMonths,
					selected: selected,
					teaser: teaser,
					apply: readSavedApply(),
					completedCta: isLeasingCompletedCtaActive(),
				};
			},
		};
	}

	function safeInit() {
		try {
			init();
		} catch (err) {
			console.error('PlasicoLeasing init failed', err);
			window.__plasicoLeasingInitError = String(err && err.message ? err.message : err);
		}
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', safeInit);
	} else {
		safeInit();
	}

	window.addEventListener('load', function () {
		if (!shouldHandleLocally()) return;
		refresh();
	});
})();

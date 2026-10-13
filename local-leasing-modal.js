(function () {
	if (window.__plasicoLeasingBootstrapped) return;
	window.__plasicoLeasingBootstrapped = true;
	window.__leaseScriptRan = true;
	var CART_STORAGE_KEY = 'plasico-hss2026-cart';
	var APPLY_STORAGE_KEY = 'plasico-leasing-apply';

	/**
	 * Left: personal finance / „Купи на изплащане“ (BNP-style multipliers).
	 * Right: ПБ Лични финанси credit-card installments (distinct, slightly lower rates).
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
			title: 'Купи на вноски с кредитна карта на ПБ Лични финанси',
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

	/** Payment method „На изплащане с ПБ Лични финанси“ (shows #pl-leasing-saved). */
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
	 * is-leasing-complete) AND „На изплащане с ПБ Лични финанси“ selected.
	 * Hide Физическо лице / МОЛ badge only then.
	 * Green notice + locked „Искам фактура“ also apply on installment alone.
	 * „Копирай от горните данни“ stays visible/usable in all states.
	 */
	function isLeasingInvoicePathActive() {
		return isLeasingApplyFilled() && isPostBankInstallmentPaymentSelected();
	}

	/** Show green auto-invoice notice whenever installment payment is selected. */
	function showInstallmentInvoiceAutoMsg(ui) {
		if (!ui || !ui.top) return;
		ui.top.textContent = INVOICE_LEASING_AUTO_MSG;
		ui.top.hidden = false;
	}

	var BUY_LABEL_DEFAULT = 'Купи';
	var BUY_LABEL_LEASING = 'Изпрати данни за кандидатстване';
	var BUY_HINT_ID = 'checkout-finish-leasing-hint';
	var ASIDE_LABEL_DEFAULT = 'Купи на изплащане';
	var ASIDE_LABEL_SUBMITTED = 'Избрали сте изплащане на лизинг';

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

	function formatAsideSchemeLine(data) {
		if (!data) return '';
		var line =
			String(data.columnTitle || '') +
			' — ' +
			String(data.months || '') +
			' вноски × ' +
			formatEuro(Number(data.monthly) || 0);
		if (Number(data.downPayment) > 0) {
			line += ' · първон. вноска ' + formatEuro(Number(data.downPayment) || 0);
		}
		return line;
	}

	function shortenProductTitle(title, maxLen) {
		var text = String(title || '')
			.replace(/\s+/g, ' ')
			.trim();
		if (!text) return '';
		var limit = maxLen || 48;
		if (text.length <= limit) return text;
		return text.slice(0, Math.max(1, limit - 1)).replace(/\s+\S*$/, '') + '…';
	}

	/** Cart line titles for scheme summary (saved apply, DOM, then storage). */
	function getLeasingCartProductTitles(data) {
		var titles = [];
		var seen = {};
		function pushTitle(raw) {
			var title = String(raw || '')
				.replace(/\s+/g, ' ')
				.trim();
			if (!title || seen[title]) return;
			seen[title] = true;
			titles.push(title);
		}

		if (data && Array.isArray(data.products) && data.products.length) {
			data.products.forEach(function (item) {
				if (typeof item === 'string') pushTitle(item);
				else if (item && item.title) pushTitle(item.title);
			});
			if (titles.length) return titles;
		}

		try {
			var lines = readConfirmCartLines();
			lines.forEach(function (line) {
				pushTitle(line && line.title);
			});
		} catch (e) {
			/* ignore */
		}
		if (titles.length) return titles;

		readCartFromStorage().forEach(function (item) {
			pushTitle(item && (item.title || item.name));
		});
		return titles;
	}

	function formatSchemeKindLabel(productCount) {
		var n = Number(productCount) || 0;
		if (n <= 0) return '';
		if (n === 1) return 'Изплащане на 1 продукт';
		return 'Комбинирано изплащане — ' + n + ' продукта';
	}

	function formatSchemeProductsBrief(titles) {
		if (!titles || !titles.length) return '';
		return titles
			.map(function (t) {
				return shortenProductTitle(t, 42);
			})
			.join('; ');
	}

	/** Full scheme breakdown for #pl-leasing-saved (and shared rates helper). */
	function buildSavedSchemeDetailsHtml(data) {
		var rates = resolveApplySchemeRates(data);
		var title = escapeHtml(data && data.columnTitle ? data.columnTitle : 'Схема на изплащане');
		var products = getLeasingCartProductTitles(data);
		var kindLabel = formatSchemeKindLabel(products.length);
		var productsBrief = formatSchemeProductsBrief(products);
		var rows = '';
		if (rates.months != null && isFinite(rates.months) && rates.months > 0) {
			rows +=
				'<div class="pl-leasing-saved__scheme-row"><dt>Брой вноски</dt><dd>' +
				escapeHtml(String(rates.months)) +
				'</dd></div>';
		}
		if (rates.monthly != null && isFinite(rates.monthly)) {
			rows +=
				'<div class="pl-leasing-saved__scheme-row"><dt>Месечна вноска</dt><dd>' +
				escapeHtml(formatEuro(rates.monthly)) +
				'</dd></div>';
		}
		if (rates.downPayment > 0) {
			rows +=
				'<div class="pl-leasing-saved__scheme-row"><dt>Първон. вноска</dt><dd>' +
				escapeHtml(formatEuro(rates.downPayment)) +
				'</dd></div>';
		}
		if (rates.glp != null && isFinite(rates.glp)) {
			rows +=
				'<div class="pl-leasing-saved__scheme-row"><dt>% ГЛП</dt><dd>' +
				escapeHtml(formatPercent(rates.glp)) +
				'</dd></div>';
		}
		if (rates.gpr != null && isFinite(rates.gpr)) {
			rows +=
				'<div class="pl-leasing-saved__scheme-row"><dt>% ГПР</dt><dd>' +
				escapeHtml(formatPercent(rates.gpr)) +
				'</dd></div>';
		}
		if (rates.total != null && isFinite(rates.total)) {
			rows +=
				'<div class="pl-leasing-saved__scheme-row pl-leasing-saved__scheme-row--total"><dt>Обща дължима сума</dt><dd>' +
				escapeHtml(formatEuro(rates.total)) +
				'</dd></div>';
		}
		if (!rows && !kindLabel) {
			return (
				'<p class="pl-leasing-saved__scheme">' +
				escapeHtml(formatAsideSchemeLine(data)) +
				'</p>'
			);
		}
		var head = '<p class="pl-leasing-saved__scheme-title">' + title + '</p>';
		if (kindLabel) {
			head +=
				'<p class="pl-leasing-saved__scheme-kind">' +
				escapeHtml(kindLabel) +
				'</p>';
		}
		if (productsBrief) {
			head +=
				'<p class="pl-leasing-saved__scheme-products">' +
				escapeHtml(productsBrief) +
				'</p>';
		}
		return (
			'<div class="pl-leasing-saved__scheme">' +
			head +
			(rows
				? '<dl class="pl-leasing-saved__scheme-meta">' + rows + '</dl>'
				: '') +
			'</div>'
		);
	}

	/** Resolve GLP/GPR/fee/total for confirm UI (saved apply or COLUMNS lookup). */
	function resolveApplySchemeRates(data) {
		var out = {
			glp: null,
			gpr: null,
			fee: 0,
			total: data && data.total != null ? Number(data.total) : null,
			monthly: data && data.monthly != null ? Number(data.monthly) : null,
			months: data && data.months != null ? Number(data.months) : null,
			financed: data && data.financed != null ? Number(data.financed) : null,
			downPayment:
				data && data.downPayment != null ? Number(data.downPayment) : 0,
		};
		if (!data) return out;
		if (data.glp != null && data.gpr != null) {
			out.glp = Number(data.glp);
			out.gpr = Number(data.gpr);
			out.fee = Number(data.fee) || 0;
			return out;
		}
		var col = COLUMNS[data.column || 'personal'];
		if (!col || !col.terms) return out;
		var months = Number(data.months);
		for (var i = 0; i < col.terms.length; i++) {
			if (Number(col.terms[i].months) === months) {
				out.glp = Number(col.terms[i].glp);
				out.gpr = Number(col.terms[i].gpr);
				out.fee = Number(col.terms[i].fee) || 0;
				break;
			}
		}
		return out;
	}

	/**
	 * After modal apply: keep #aside-leasing-btn visible, swap label + show
	 * entered-data preview (click still reopens modal to edit).
	 */
	function syncAsideLeasingSubmitted() {
		var aside = document.getElementById('aside-leasing-btn');
		if (!aside) return;
		var filled = isLeasingApplyFilled();
		var data = filled ? readSavedApply() : null;

		if (filled && data) {
			aside.classList.add('is-submitted');
			aside.setAttribute(
				'aria-label',
				ASIDE_LABEL_SUBMITTED + ' — Промени или изтрий данните'
			);
			aside.innerHTML =
				'<span class="aside-leasing__label">' +
				escapeHtml(ASIDE_LABEL_SUBMITTED) +
				'</span>' +
				'<span class="aside-leasing__preview">' +
				'<span class="aside-leasing__preview-row"><span class="aside-leasing__preview-k">Име</span> ' +
				escapeHtml(data.fullName || '') +
				'</span>' +
				'<span class="aside-leasing__preview-row"><span class="aside-leasing__preview-k">Телефон</span> ' +
				escapeHtml(data.phone || '') +
				'</span>' +
				'<span class="aside-leasing__preview-row"><span class="aside-leasing__preview-k">ЕГН</span> ' +
				escapeHtml(data.egn || '') +
				'</span>' +
				'<span class="aside-leasing__preview-row"><span class="aside-leasing__preview-k">Ел. поща</span> ' +
				escapeHtml(data.email || '') +
				'</span>' +
				'<span class="aside-leasing__preview-scheme">' +
				escapeHtml(formatAsideSchemeLine(data)) +
				'</span>' +
				'<span class="aside-leasing__preview-actions">' +
				'<span class="aside-leasing__preview-edit">Промени данните</span>' +
				'<span class="aside-leasing__preview-clear">Изтрий данните</span>' +
				'</span>' +
				'</span>';
			return;
		}

		aside.classList.remove('is-submitted');
		aside.setAttribute('aria-label', ASIDE_LABEL_DEFAULT);
		if (
			!aside.querySelector('.aside-leasing__label') ||
			aside.querySelector('.aside-leasing__preview') ||
			!aside.querySelector('.pl-leasing-teaser-text')
		) {
			aside.innerHTML =
				'<span class="aside-leasing__label">' +
				escapeHtml(ASIDE_LABEL_DEFAULT) +
				'</span>' +
				'<span class="aside-leasing__teaser pl-leasing-teaser-text"></span>';
		} else {
			var label = aside.querySelector('.aside-leasing__label');
			if (label) label.textContent = ASIDE_LABEL_DEFAULT;
		}
	}

	/** Morph Купи when apply is filled on leasing path; aside stays visible with preview. */
	function syncCheckoutCta() {
		var active = isLeasingCompletedCtaActive();
		var aside = document.getElementById('aside-leasing-btn');
		var buy = getFinishBuyButton();

		if (aside && state.price > 0) {
			aside.hidden = false;
			aside.removeAttribute('aria-hidden');
		}
		syncAsideLeasingSubmitted();

		if (!buy) return;

		var wrap = ensureFinishWrap(buy);
		if (wrap) wrap.classList.toggle('is-leasing-complete', active);

		if (active) {
			buy.classList.add('is-leasing-complete');
			buy.setAttribute('data-leasing-cta', '1');
			/* Avoid native form submit/validation racing the confirm modal. */
			buy.setAttribute('type', 'button');
			buy.innerHTML =
				'<span class="checkout-finish__label">' + BUY_LABEL_LEASING + '</span>';
			bindLeasingBuyConfirmClick(buy);
			removeLeasingHint();
		} else if (
			buy.classList.contains('is-leasing-complete') ||
			buy.getAttribute('data-leasing-cta') === '1'
		) {
			buy.classList.remove('is-leasing-complete');
			buy.removeAttribute('data-leasing-cta');
			buy.setAttribute('type', 'submit');
			buy.textContent = BUY_LABEL_DEFAULT;
			removeLeasingHint();
		}

		document.documentElement.classList.toggle('pl-leasing-cta-complete', active);
		document.body.classList.toggle('is-leasing-ready', active);
		document.body.setAttribute('data-leasing-ready', active ? '1' : '0');
	}

	/* —— Confirm order modal (КУПИ НА ИЗПЛАЩАНЕ) —— */
	var leasingConfirmProceed = false;
	var leasingConfirmBound = false;

	function readConfirmCartLines() {
		var table =
			document.querySelector('#checkout #cart-table') ||
			document.getElementById('cart-table');
		var lines = [];
		if (!table) return lines;
		var rows = table.querySelectorAll('tbody > tr');
		for (var i = 0; i < rows.length; i++) {
			var tr = rows[i];
			if (tr.classList.contains('totals') || tr.querySelector('th')) continue;
			var titleEl = tr.querySelector('td.l > a');
			var qtyEl = tr.querySelector('.quan');
			var totalEl = tr.querySelector('.line-total, td.r.nw .subtotal, td.r.nw span.subtotal');
			if (!totalEl) {
				var cells = tr.querySelectorAll('td.r.nw span, td.r span.price');
				totalEl = cells.length ? cells[cells.length - 1] : null;
			}
			var title = titleEl ? String(titleEl.textContent || '').trim() : '';
			if (!title) continue;
			lines.push({
				title: title,
				qty: qtyEl ? String(qtyEl.textContent || '').trim() : '1',
				total: totalEl
					? String(totalEl.textContent || '')
							.replace(/\u00a0/g, ' ')
							.replace(/\s+/g, ' ')
							.trim()
					: '',
			});
		}
		return lines;
	}

	function readConfirmTotals() {
		var discountRow = document.querySelector('#cart-table tr.totals.discount');
		var deliveryRow = document.getElementById('aside-delivery-row');
		var grandSpan = document.querySelector(
			'#cart-table tr.totals.grand td + td span, #cart-table .totals.grand span'
		);
		var deliveryHidden =
			!deliveryRow ||
			deliveryRow.hidden ||
			deliveryRow.getAttribute('hidden') != null ||
			deliveryRow.classList.contains('hide');
		var deliveryLabel = document.getElementById('aside-delivery-label');
		var deliveryAmt = document.getElementById('aside-delivery-amount');
		return {
			discountLabel: discountRow
				? String(
						(discountRow.querySelector('td') || {}).textContent || 'Отстъпка'
				  )
						.replace(/\s+/g, ' ')
						.trim()
				: '',
			discountValue: discountRow
				? String(
						(discountRow.querySelector('td + td') || {}).textContent || ''
				  )
						.replace(/\u00a0/g, ' ')
						.replace(/\s+/g, ' ')
						.trim()
				: '',
			deliveryVisible: !deliveryHidden,
			deliveryLabel: deliveryLabel
				? String(deliveryLabel.textContent || '').trim()
				: 'Доставка',
			deliveryValue: deliveryAmt
				? String(deliveryAmt.textContent || '').trim() + ' €'
				: '',
			grandValue: grandSpan
				? String(grandSpan.textContent || '')
						.replace(/\u00a0/g, ' ')
						.replace(/\s+/g, ' ')
						.trim() + ' €'
				: formatEuro(parsePriceFromDom()),
		};
	}

	function readConfirmShippingSummary() {
		var mode = document.querySelector('input[name="ship_to_id[2]"]:checked');
		var label = mode && mode.closest ? mode.closest('label') : null;
		var titleEl = label && label.querySelector('.co-option-row__title');
		var hintEl = label && label.querySelector('.co-option-row__hint');
		var title = titleEl
			? String(titleEl.textContent || '')
					.replace(/\s+/g, ' ')
					.trim()
			: '';
		var hint = hintEl
			? String(hintEl.textContent || '')
					.replace(/\s+/g, ' ')
					.trim()
			: '';
		var totals = readConfirmTotals();
		return {
			title: title || 'Метод на доставка',
			hint: hint,
			costLabel: totals.deliveryVisible ? totals.deliveryLabel : '',
			costValue: totals.deliveryVisible ? totals.deliveryValue : '0 €',
		};
	}

	function ensureConfirmModal() {
		var overlay = document.getElementById('pl-leasing-confirm-overlay');
		if (overlay) return overlay;
		overlay = document.createElement('div');
		overlay.id = 'pl-leasing-confirm-overlay';
		overlay.className = 'pl-leasing-confirm-overlay';
		overlay.hidden = true;
		overlay.innerHTML =
			'<div class="pl-leasing-confirm-modal" role="dialog" aria-modal="true" aria-labelledby="pl-leasing-confirm-title">' +
			'<button type="button" class="pl-leasing-confirm-close" aria-label="Затвори">&times;</button>' +
			'<h2 class="pl-leasing-confirm-title" id="pl-leasing-confirm-title">Потвърди поръчката</h2>' +
			'<p class="pl-leasing-confirm-lead">Прегледай количката, доставката и схемата на изплащане преди да продължиш.</p>' +
			'<div class="pl-leasing-confirm-body" id="pl-leasing-confirm-body"></div>' +
			'<div class="pl-leasing-confirm-actions">' +
			'<button type="button" class="pl-leasing-confirm-submit" id="pl-leasing-confirm-submit">Потвърди</button>' +
			'<p class="pl-leasing-confirm-hint">(Продължаваш към страницата на кредитора)</p>' +
			'</div>' +
			'</div>';
		document.body.appendChild(overlay);
		overlay.addEventListener('click', function (e) {
			if (e.target === overlay) closeConfirmModal();
		});
		var closeBtn = overlay.querySelector('.pl-leasing-confirm-close');
		if (closeBtn) {
			closeBtn.addEventListener('click', function () {
				closeConfirmModal();
			});
		}
		var submitBtn = overlay.querySelector('#pl-leasing-confirm-submit');
		if (submitBtn) {
			submitBtn.addEventListener('click', function () {
				proceedLeasingConfirm();
			});
		}
		return overlay;
	}

	function renderConfirmModalBody() {
		var body = document.getElementById('pl-leasing-confirm-body');
		if (!body) return;
		var lines = readConfirmCartLines();
		var totals = readConfirmTotals();
		var ship = readConfirmShippingSummary();
		var apply = readSavedApply();
		var scheme = formatAsideSchemeLine(apply) || 'На изплащане с ПБ Лични финанси';

		var itemsHtml = lines.length
			? lines
					.map(function (line) {
						return (
							'<div class="pl-leasing-confirm-item">' +
							'<div class="pl-leasing-confirm-item__title">' +
							escapeHtml(line.title) +
							'</div>' +
							'<div class="pl-leasing-confirm-item__meta">' +
							'<span>× ' +
							escapeHtml(line.qty) +
							'</span>' +
							'<span class="pl-leasing-confirm-item__price">' +
							escapeHtml(line.total) +
							'</span>' +
							'</div>' +
							'</div>'
						);
					})
					.join('')
			: '<p class="pl-leasing-confirm-empty">Няма продукти в количката.</p>';

		var totalsHtml = '';
		if (totals.discountValue) {
			totalsHtml +=
				'<div class="pl-leasing-confirm-row"><span>' +
				escapeHtml(totals.discountLabel || 'Отстъпка') +
				'</span><span>' +
				escapeHtml(totals.discountValue) +
				'</span></div>';
		}
		if (totals.deliveryVisible) {
			totalsHtml +=
				'<div class="pl-leasing-confirm-row"><span>' +
				escapeHtml(totals.deliveryLabel) +
				'</span><span>' +
				escapeHtml(totals.deliveryValue) +
				'</span></div>';
		}
		totalsHtml +=
			'<div class="pl-leasing-confirm-row pl-leasing-confirm-row--grand"><span>Сума за плащане с ДДС</span><span>' +
			escapeHtml(totals.grandValue) +
			'</span></div>';

		body.innerHTML =
			'<section class="pl-leasing-confirm-section">' +
			'<h3 class="pl-leasing-confirm-section__title">Количка</h3>' +
			'<div class="pl-leasing-confirm-items">' +
			itemsHtml +
			'</div>' +
			'<div class="pl-leasing-confirm-totals">' +
			totalsHtml +
			'</div>' +
			'</section>' +
			'<section class="pl-leasing-confirm-section">' +
			'<h3 class="pl-leasing-confirm-section__title">Доставка</h3>' +
			'<p class="pl-leasing-confirm-ship-title">' +
			escapeHtml(ship.title) +
			'</p>' +
			(ship.hint
				? '<p class="pl-leasing-confirm-ship-hint">' +
				  escapeHtml(ship.hint) +
				  '</p>'
				: '') +
			'<p class="pl-leasing-confirm-ship-cost">' +
			escapeHtml(ship.costLabel ? ship.costLabel + ': ' + ship.costValue : ship.costValue) +
			'</p>' +
			'</section>' +
			'<section class="pl-leasing-confirm-section">' +
			'<h3 class="pl-leasing-confirm-section__title">Схема на изплащане</h3>' +
			'<p class="pl-leasing-confirm-scheme">' +
			escapeHtml(scheme) +
			'</p>' +
			(function () {
				var rates = resolveApplySchemeRates(apply);
				var rows = '';
				if (rates.months && rates.monthly != null) {
					rows +=
						'<div><dt>Месечна вноска</dt><dd>' +
						escapeHtml(formatEuro(rates.monthly)) +
						' × ' +
						escapeHtml(String(rates.months)) +
						' вноски</dd></div>';
				}
				if (rates.downPayment > 0) {
					rows +=
						'<div><dt>Първон. вноска</dt><dd>' +
						escapeHtml(formatEuro(rates.downPayment)) +
						'</dd></div>';
				}
				if (rates.financed != null && isFinite(rates.financed)) {
					rows +=
						'<div><dt>Финансирана сума</dt><dd>' +
						escapeHtml(formatEuro(rates.financed)) +
						'</dd></div>';
				}
				if (rates.glp != null && isFinite(rates.glp)) {
					rows +=
						'<div><dt>ГЛП</dt><dd>' +
						escapeHtml(formatPercent(rates.glp)) +
						'</dd></div>';
				}
				if (rates.gpr != null && isFinite(rates.gpr)) {
					rows +=
						'<div><dt>ГПР</dt><dd>' +
						escapeHtml(formatPercent(rates.gpr)) +
						'</dd></div>';
				}
				if (rates.fee > 0) {
					rows +=
						'<div><dt>Такса ангажимент</dt><dd>' +
						escapeHtml(formatEuro(rates.fee)) +
						'</dd></div>';
				}
				if (rates.total != null && isFinite(rates.total)) {
					rows +=
						'<div class="pl-leasing-confirm-scheme-total"><dt>Общо за изплащане</dt><dd>' +
						escapeHtml(formatEuro(rates.total)) +
						'</dd></div>';
				}
				return rows
					? '<dl class="pl-leasing-confirm-scheme-meta">' + rows + '</dl>'
					: '';
			})() +
			(apply && apply.fullName
				? '<dl class="pl-leasing-confirm-applicant">' +
				  '<div><dt>Име</dt><dd>' +
				  escapeHtml(apply.fullName) +
				  '</dd></div>' +
				  '<div><dt>Телефон</dt><dd>' +
				  escapeHtml(apply.phone || '') +
				  '</dd></div>' +
				  '<div><dt>Ел. поща</dt><dd>' +
				  escapeHtml(apply.email || '') +
				  '</dd></div>' +
				  '</dl>'
				: '') +
			'</section>';
	}

	function openConfirmModal() {
		var overlay = ensureConfirmModal();
		renderConfirmModalBody();
		overlay.hidden = false;
		document.body.classList.add('pl-leasing-confirm-open');
		var submit = document.getElementById('pl-leasing-confirm-submit');
		if (submit) {
			try {
				submit.focus();
			} catch (err) {
				/* ignore */
			}
		}
	}

	function closeConfirmModal() {
		var overlay = document.getElementById('pl-leasing-confirm-overlay');
		if (overlay) overlay.hidden = true;
		document.body.classList.remove('pl-leasing-confirm-open');
	}

	/** Mobile stacked checkout (≤1100px): show order summary confirm before submit. */
	function isMobileConfirmViewport() {
		try {
			return !!(window.matchMedia && window.matchMedia('(max-width: 1100px)').matches);
		} catch (err) {
			return typeof window.innerWidth === 'number' && window.innerWidth <= 1100;
		}
	}

	function requestLeasingBuyConfirm() {
		if (isMobileConfirmViewport()) {
			openConfirmModal();
			return;
		}
		/* Desktop: skip summary overlay — submit application data immediately. */
		proceedLeasingConfirm();
	}

	function onLeasingBuyConfirmClick(e) {
		if (leasingConfirmProceed) return;
		if (!isLeasingCompletedCtaActive()) return;
		if (e) {
			e.preventDefault();
			e.stopPropagation();
		}
		requestLeasingBuyConfirm();
	}

	function bindLeasingBuyConfirmClick(buy) {
		if (!buy || buy.getAttribute('data-lease-confirm-bound') === '1') return;
		buy.setAttribute('data-lease-confirm-bound', '1');
		buy.addEventListener('click', onLeasingBuyConfirmClick);
	}

	function proceedLeasingConfirm() {
		closeConfirmModal();
		try {
			document.dispatchEvent(
				new CustomEvent('plasico:leasing-confirm', {
					bubbles: true,
					detail: readSavedApply(),
				})
			);
		} catch (err) {
			/* ignore */
		}
		var buy = getFinishBuyButton();
		var form =
			(buy && buy.form) ||
			document.querySelector('#checkout-new form, #checkout form, form.cl');
		if (!form) return;

		leasingConfirmProceed = true;
		var hadNoValidate = form.hasAttribute('novalidate');
		var prevType = buy ? buy.getAttribute('type') : null;
		form.setAttribute('novalidate', '');
		if (buy) buy.setAttribute('type', 'submit');
		try {
			if (typeof form.requestSubmit === 'function') {
				form.requestSubmit(buy || undefined);
			} else if (typeof form.submit === 'function') {
				form.submit();
			}
		} catch (err) {
			try {
				form.submit();
			} catch (err2) {
				/* ignore */
			}
		} finally {
			if (!hadNoValidate) form.removeAttribute('novalidate');
			if (buy) {
				buy.setAttribute(
					'type',
					isLeasingCompletedCtaActive() ? 'button' : prevType || 'submit'
				);
			}
			leasingConfirmProceed = false;
		}
	}

	function bindLeasingConfirmGate() {
		if (leasingConfirmBound) return;
		leasingConfirmBound = true;
		document.addEventListener(
			'click',
			function (e) {
				if (leasingConfirmProceed) return;
				if (!isLeasingCompletedCtaActive()) return;
				var t = e.target;
				if (!t || !t.closest) return;
				var buy = t.closest('.checkout-finish.btn');
				if (!buy || !buy.classList.contains('is-leasing-complete')) return;
				e.preventDefault();
				e.stopPropagation();
				requestLeasingBuyConfirm();
			},
			true
		);
		document.addEventListener(
			'submit',
			function (e) {
				if (leasingConfirmProceed) {
					leasingConfirmProceed = false;
					return;
				}
				if (!isLeasingCompletedCtaActive()) return;
				var form = e.target;
				if (!form || !form.querySelector) return;
				var buy = form.querySelector('.checkout-finish.btn.is-leasing-complete');
				if (!buy) return;
				e.preventDefault();
				e.stopPropagation();
				requestLeasingBuyConfirm();
			},
			true
		);
		document.addEventListener('keydown', function (e) {
			if (e.key !== 'Escape') return;
			var overlay = document.getElementById('pl-leasing-confirm-overlay');
			if (overlay && !overlay.hidden) closeConfirmModal();
		});
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
	var wantInvoiceLockBound = false;

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

	/** Clear auto-checked invoice when leaving installment payment. */
	function clearInvoiceFieldsPanel() {
		var want = document.getElementById('want-invoice');
		var inv = document.getElementById('checkout-invoice-fields');
		var label = document.querySelector('label.co-invoice-check[for=want-invoice]');
		if (want && want.checked) {
			want.checked = false;
			dispatchDomChange(want);
		}
		if (label) label.classList.remove('is-checked');
		if (inv) {
			inv.classList.add('hide', 'sf-hidden');
			inv.setAttribute('hidden', '');
		}
	}

	/**
	 * ПБ Лични финанси installment (payment_id=8): „Искам фактура“ must stay checked
	 * and cannot be cleared. Leaving installment unlocks and clears the check.
	 * @param {boolean} locked
	 */
	function setWantInvoiceLocked(locked) {
		var want = document.getElementById('want-invoice');
		var label = document.querySelector('label.co-invoice-check[for=want-invoice]');
		if (!want) return;
		if (locked) {
			want.setAttribute('data-invoice-locked', '1');
			want.setAttribute('aria-disabled', 'true');
			if (label) {
				label.classList.add('is-invoice-locked');
				label.setAttribute('aria-disabled', 'true');
			}
			showInvoiceFieldsPanel();
		} else {
			var wasLocked = want.getAttribute('data-invoice-locked') === '1';
			want.removeAttribute('data-invoice-locked');
			want.removeAttribute('aria-disabled');
			if (label) {
				label.classList.remove('is-invoice-locked');
				label.removeAttribute('aria-disabled');
			}
			/* Only clear when leaving the forced installment lock — not on cold init. */
			if (wasLocked) clearInvoiceFieldsPanel();
		}
	}

	function syncWantInvoiceLockForInstallment() {
		setWantInvoiceLocked(isPostBankInstallmentPaymentSelected());
	}

	function bindWantInvoiceLockGuards() {
		if (wantInvoiceLockBound) return;
		wantInvoiceLockBound = true;
		document.addEventListener(
			'click',
			function (e) {
				var want = document.getElementById('want-invoice');
				if (!want || want.getAttribute('data-invoice-locked') !== '1') return;
				var t = e.target;
				if (!t) return;
				var onCb = t === want || t.id === 'want-invoice';
				var onLabel =
					t.closest &&
					!!t.closest('label.co-invoice-check[for="want-invoice"], label.co-invoice-check[for=want-invoice]');
				if (!onCb && !onLabel) return;
				e.preventDefault();
				e.stopPropagation();
				if (!want.checked) showInvoiceFieldsPanel();
			},
			true
		);
		document.addEventListener(
			'change',
			function (e) {
				var t = e.target;
				if (!t || t.id !== 'want-invoice') return;
				if (t.getAttribute('data-invoice-locked') !== '1') return;
				if (!t.checked) showInvoiceFieldsPanel();
			},
			true
		);
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
	 * On „На изплащане“ (payment_id=8): lock/check „Искам фактура“, green notice,
	 * hide Физическо лице + „Тип лице“, keep ЮЛ as unexpanded opt-in (auto физ).
	 * With leasing apply filled: autofill + МОЛ badge when firm selected.
	 * Notices/locks clear when payment leaves installment.
	 * @param {{ forceIndividual?: boolean }} opts
	 */
	function syncInvoiceFromLeasing(opts) {
		if (invoiceSyncLock) return;
		invoiceSyncLock = true;
		try {
			opts = opts || {};
			syncWantInvoiceLockForInstallment();
			var data = readSavedApply();
			var filled = isLeasingApplyFilled();
			var installment = isPostBankInstallmentPaymentSelected();
			var pathActive = !!(filled && data && installment);
			var ui = ensureInvoiceLeasingMessages();

			/* Left installment → clear notices + unlock person-type UI. */
			if (!installment) {
				hideInvoiceLeasingUi();
				return;
			}

			/* Installment: invoice locked + hide физ; ЮЛ stays available but not auto-expanded. */
			showInvoiceFieldsPanel();
			ui = ensureInvoiceLeasingMessages();
			syncFizicheskoPersonTypeAvailability(true);

			var want = document.getElementById('want-invoice');
			var primed = document.body.getAttribute('data-leasing-invoice') === '1';
			var shouldPrime = opts.forceIndividual || !primed;

			if (shouldPrime) {
				document.body.setAttribute('data-leasing-invoice', '1');
				/* HTML defaults to ЮЛ checked — force auto физ so firm panel stays collapsed. */
				selectInvoicePersonType('1');
			}

			if (!want || !want.checked) {
				showInvoiceFieldsPanel();
				want = document.getElementById('want-invoice');
			}
			if (!want || !want.checked) {
				showInstallmentInvoiceAutoMsg(ui);
				if (ui.badge) ui.badge.hidden = true;
				return;
			}

			var type = document.querySelector('input[name="invoice_person_type"]:checked');
			var isFirm = !!(type && String(type.value) === '2');

			/* Always hide individual fields on installment; firm panel only if ЮЛ chosen. */
			syncInvoicePersonPanels(isFirm, true);

			if (isFirm) {
				if (pathActive) applyLeasingToInvoiceMol(data);
				if (ui.top) ui.top.hidden = true;
				if (ui.badge) {
					if (pathActive) {
						ui.badge.textContent = INVOICE_LEASING_MOL_MSG;
						ui.badge.hidden = false;
					} else {
						ui.badge.hidden = true;
					}
				}
			} else {
				if (pathActive) applyLeasingToInvoiceIndividual(data);
				showInstallmentInvoiceAutoMsg(ui);
				if (ui.badge) ui.badge.hidden = true;
			}
		} finally {
			invoiceSyncLock = false;
		}
	}

	function bindInvoiceLeasingWatchers() {
		if (invoiceLeasingBound) return;
		invoiceLeasingBound = true;
		bindWantInvoiceLockGuards();
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
				if (t.name === 'payment_id' || t.name === 'want_invoice') {
					syncWantInvoiceLockForInstallment();
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
				if (!isPostBankInstallmentPaymentSelected()) return;
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
				if (!isPostBankInstallmentPaymentSelected()) return;
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
			buildSavedSchemeDetailsHtml(data) +
			'<div class="pl-leasing-saved__actions">' +
			'<button type="button" class="pl-leasing-saved__edit" id="pl-leasing-saved-edit">Промени данните</button>' +
			'<button type="button" class="pl-leasing-saved__clear" id="pl-leasing-saved-clear">Изтрий данните</button>' +
			'</div>';

		var editBtn = document.getElementById('pl-leasing-saved-edit');
		if (editBtn) {
			editBtn.addEventListener('click', function () {
				openModal({ column: data.column || 'personal' });
			});
		}
		var clearBtn = document.getElementById('pl-leasing-saved-clear');
		if (clearBtn) {
			clearBtn.addEventListener('click', function () {
				clearLeasingApplyUi();
			});
		}

		var pay8 = document.querySelector('input[name="payment_id"][value="8"]');
		if (pay8 && pay8.checked) {
			host.classList.remove('hide', 'sf-hidden');
			host.removeAttribute('hidden');
			var install = document.getElementById('installment-options');
			if (install) {
				install.classList.remove('hide', 'sf-hidden');
				install.removeAttribute('hidden');
			}
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

		/* Backdrop click does not close — use X only */
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
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed)) return false;
		// Reject bare .co TLD (allow .com, .co.uk, …)
		var domain = trimmed.slice(trimmed.lastIndexOf('@') + 1).toLowerCase().replace(/\.+$/, '');
		var parts = domain.split('.');
		if (parts[parts.length - 1] === 'co') return false;
		return true;
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
			glp: selected.glp,
			gpr: selected.gpr,
			fee: selected.fee,
			promoCode: state.promoCode,
			downPayment: state.downPayment,
			price: state.price,
			financed: getFinancedAmount(),
			prodId: state.prodId,
			products: getLeasingCartProductTitles(null),
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
		/* Stay at current scroll position — do not jump to payment methods */
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
		document.querySelectorAll('.js-open-leasing').forEach(function (btn) {
			if (btn.id === 'aside-leasing-btn') {
				btn.hidden = !hasPrice;
				if (btn.hidden) btn.setAttribute('aria-hidden', 'true');
				else btn.removeAttribute('aria-hidden');
				return;
			}
			btn.hidden = !hasPrice;
		});
		syncCheckoutCta();
	}

	function renderTeaser() {
		syncLeasingControls();
		var buttons = document.querySelectorAll('.js-open-leasing');
		if (!buttons.length) return;

		var text = state.price ? teaserText(getTeaserTerm()) : '';

		buttons.forEach(function (btn) {
			if (btn.classList.contains('is-submitted')) return;
			var teaser = btn.querySelector('.pl-leasing-teaser-text');
			if (teaser) {
				teaser.textContent = text;
			}
		});
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

	function clearLeasingApplyUi() {
		clearSavedApply();
		renderSavedApply();
		renderTeaser();
		syncCheckoutCta();
		/* Re-sync invoice UI: stay locked + green msg if installment still selected. */
		syncInvoiceFromLeasing({ forceIndividual: false });
	}

	function bindTriggers() {
		document.body.addEventListener(
			'click',
			function (e) {
				var clearAction = e.target.closest('.aside-leasing__preview-clear');
				if (clearAction) {
					e.preventDefault();
					e.stopPropagation();
					clearLeasingApplyUi();
					return false;
				}

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
		bindLeasingConfirmGate();
		/* Refresh keeps apply in sessionStorage, but payment radios reset —
		 * re-select ПБ Лични финанси installments so #leasing-schema / scheme stay visible. */
		if (isLeasingApplyFilled()) {
			syncCheckoutPaymentInstallments();
			if (state.apply && state.apply.column) {
				syncInstallmentOptionSelection(state.apply.column);
			}
		}
		renderSavedApply();
		bindTriggers();
		syncWantInvoiceLockForInstallment();

		document.addEventListener('plasico:cart-updated', refresh);

		var paymentRadios = document.querySelectorAll('input[name="payment_id"]');
		Array.prototype.slice.call(paymentRadios).forEach(function (radio) {
			radio.addEventListener('change', function () {
				syncWantInvoiceLockForInstallment();
				if (radio.value === '8') {
					renderSavedApply();
					syncInvoiceFromLeasing({ forceIndividual: false });
				} else {
					syncCheckoutCta();
					syncInvoiceFromLeasing({ forceIndividual: false });
				}
			});
		});

		syncCheckoutCta();
		syncInvoiceFromLeasing({ forceIndividual: false });

		window.PlasicoLeasing = {
			open: openModal,
			close: closeModal,
			refresh: refresh,
			getApply: readSavedApply,
			clearApply: clearLeasingApplyUi,
			isApplyFilled: isLeasingApplyFilled,
			isCompletedCtaActive: isLeasingCompletedCtaActive,
			syncCheckoutCta: syncCheckoutCta,
			syncInvoiceFromLeasing: syncInvoiceFromLeasing,
			syncWantInvoiceLockForInstallment: syncWantInvoiceLockForInstallment,
			openConfirmModal: openConfirmModal,
			closeConfirmModal: closeConfirmModal,
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
		/* Some checkout wires re-hide panels after DOMContentLoaded — restore once more. */
		if (isLeasingApplyFilled()) {
			syncCheckoutPaymentInstallments();
			if (state.apply && state.apply.column) {
				syncInstallmentOptionSelection(state.apply.column);
			}
			renderSavedApply();
		}
		refresh();
	});
})();

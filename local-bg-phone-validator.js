/**
 * Bulgarian mobile phone validator for checkout.
 * Accepts: 08xxxxxxxx (10 digits), +3598xxxxxxxx, 003598xxxxxxxx
 * Rejects wrong lengths (e.g. 11-digit 089…).
 * Targets #field-phone, .telephone, and #field-address-person-phone.
 */
(function () {
	'use strict';

	var MSG =
		'Моля въведете валиден мобилен телефон (08xxxxxxxx или +3598…)';
	var MSG_REQUIRED = 'Моля въведете телефонен номер (08xxxxxxxx)';

	function normalize(raw) {
		return String(raw || '')
			.trim()
			.replace(/[\s\-().]/g, '');
	}

	/** Typical BG mobile: 08 + 8 digits, or intl +359 / 00359 forms. */
	function isValidBgMobile(raw) {
		var s = normalize(raw);
		if (/^08\d{8}$/.test(s)) return true;
		if (/^\+3598\d{8}$/.test(s)) return true;
		if (/^003598\d{8}$/.test(s)) return true;
		return false;
	}

	function isRequiredField(input) {
		if (!input) return false;
		if (input.id === 'field-phone') return true;
		if (input.hasAttribute('required')) return true;
		if (input.id === 'field-address-person-phone') {
			var cb = document.getElementById('want-alternate-recipient');
			var fields = document.getElementById('alternate-recipient-fields');
			var alternateOn = !!(cb && cb.checked);
			var visible =
				fields &&
				!fields.hasAttribute('hidden') &&
				!fields.classList.contains('hide');
			return alternateOn || visible;
		}
		return false;
	}

	function ensureErrorEl(input) {
		var id = (input.id || 'phone') + '-error';
		var existing = document.getElementById(id);
		if (existing) return existing;
		var el = document.createElement('p');
		el.id = id;
		el.className = 'field-error telephone-error';
		el.setAttribute('role', 'alert');
		el.hidden = true;
		var parent = input.closest('.checkout-guest-field') || input.parentElement;
		if (parent) parent.appendChild(el);
		else input.insertAdjacentElement('afterend', el);
		return el;
	}

	function clearError(input) {
		if (!input) return;
		input.classList.remove('is-invalid');
		input.removeAttribute('aria-invalid');
		if (typeof input.setCustomValidity === 'function') {
			input.setCustomValidity('');
		}
		var err = document.getElementById((input.id || 'phone') + '-error');
		if (err) {
			err.hidden = true;
			err.textContent = '';
		}
	}

	function showError(input, message) {
		if (!input) return;
		input.classList.add('is-invalid');
		input.setAttribute('aria-invalid', 'true');
		if (typeof input.setCustomValidity === 'function') {
			input.setCustomValidity(message);
		}
		var err = ensureErrorEl(input);
		err.textContent = message;
		err.hidden = false;
	}

	function validateOne(input, opts) {
		opts = opts || {};
		if (!input) return true;
		var raw = input.value;
		var empty = !String(raw || '').trim();
		var required = isRequiredField(input);

		if (empty) {
			if (required) {
				if (opts.show) showError(input, MSG_REQUIRED);
				else if (typeof input.setCustomValidity === 'function') {
					input.setCustomValidity(MSG_REQUIRED);
				}
				return false;
			}
			clearError(input);
			return true;
		}

		if (isValidBgMobile(raw)) {
			clearError(input);
			return true;
		}

		if (opts.show) showError(input, MSG);
		else if (typeof input.setCustomValidity === 'function') {
			input.setCustomValidity(MSG);
		}
		return false;
	}

	function collectInputs() {
		var seen = [];
		var list = [];
		function add(el) {
			if (!el || seen.indexOf(el) >= 0) return;
			seen.push(el);
			list.push(el);
		}
		add(document.getElementById('field-phone'));
		Array.prototype.forEach.call(
			document.querySelectorAll('#checkout input.telephone, #checkout input[type=tel].telephone'),
			add
		);
		add(document.getElementById('field-address-person-phone'));
		return list;
	}

	function validateAll(opts) {
		opts = opts || {};
		var ok = true;
		var firstInvalid = null;
		collectInputs().forEach(function (input) {
			if (!validateOne(input, opts)) {
				ok = false;
				if (!firstInvalid) firstInvalid = input;
			}
		});
		if (!ok && opts.focus && firstInvalid) {
			try {
				firstInvalid.focus();
				if (firstInvalid.scrollIntoView) {
					firstInvalid.scrollIntoView({ behavior: 'smooth', block: 'center' });
				}
			} catch (e) {}
		}
		return ok;
	}

	function onBlur(e) {
		var t = e.target;
		if (!t || t.tagName !== 'INPUT') return;
		if (
			t.id === 'field-phone' ||
			t.id === 'field-address-person-phone' ||
			t.classList.contains('telephone')
		) {
			validateOne(t, { show: true });
		}
	}

	function onInput(e) {
		var t = e.target;
		if (!t || t.tagName !== 'INPUT') return;
		if (
			t.id === 'field-phone' ||
			t.id === 'field-address-person-phone' ||
			t.classList.contains('telephone')
		) {
			if (t.classList.contains('is-invalid') || t.getAttribute('aria-invalid') === 'true') {
				validateOne(t, { show: true });
			} else if (typeof t.setCustomValidity === 'function') {
				validateOne(t, { show: false });
			}
		}
	}

	function onSubmit(e) {
		if (!validateAll({ show: true, focus: true })) {
			e.preventDefault();
			e.stopPropagation();
			return false;
		}
	}

	function bind() {
		var form =
			document.querySelector('#checkout-new form') ||
			document.querySelector('#checkout form.cl') ||
			document.querySelector('#checkout form');
		if (!form) return;

		var phone = document.getElementById('field-phone');
		if (phone) {
			phone.setAttribute('required', '');
			if (!phone.classList.contains('telephone')) phone.classList.add('telephone');
			phone.setAttribute('inputmode', 'tel');
			phone.setAttribute('autocomplete', phone.getAttribute('autocomplete') || 'tel');
		}

		var recipient = document.getElementById('field-address-person-phone');
		if (recipient && !recipient.classList.contains('telephone')) {
			recipient.classList.add('telephone');
		}

		form.addEventListener('blur', onBlur, true);
		form.addEventListener('input', onInput, true);
		form.addEventListener('submit', onSubmit, true);

		var altCb = document.getElementById('want-alternate-recipient');
		if (altCb) {
			altCb.addEventListener('change', function () {
				var r = document.getElementById('field-address-person-phone');
				if (!r) return;
				if (!altCb.checked) clearError(r);
				else if (String(r.value || '').trim()) validateOne(r, { show: true });
			});
		}

		// Keep constraint state in sync without showing errors yet
		collectInputs().forEach(function (input) {
			validateOne(input, { show: false });
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', bind);
	} else {
		bind();
	}

	window.PlasicoBgPhone = {
		isValid: isValidBgMobile,
		normalize: normalize,
		validateAll: validateAll,
		validateOne: validateOne
	};
})();

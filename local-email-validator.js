/**
 * Checkout / auth email validator.
 * Rejects addresses whose domain TLD (last label) is exactly "co"
 * (e.g. user@something.co). Allows .com, .co.uk, etc.
 * Targets #field-email (guest) and #auth-email (auth modal).
 */
(function () {
	'use strict';

	var MSG_CO =
		'Домейнът .co не е позволен. Моля използвайте друг имейл (напр. .com, .bg).';

	function domainLastLabel(email) {
		var trimmed = String(email || '').trim();
		var at = trimmed.lastIndexOf('@');
		if (at < 0) return '';
		var domain = trimmed.slice(at + 1).toLowerCase().replace(/\.+$/, '');
		if (!domain) return '';
		var parts = domain.split('.');
		return parts[parts.length - 1] || '';
	}

	/** True when the domain's final label is exactly "co" (not .com / .co.uk). */
	function hasBlockedCoTld(email) {
		return domainLastLabel(email) === 'co';
	}

	function isDemoLoggedIn() {
		return !!(document.body && document.body.classList.contains('is-demo-logged-in'));
	}

	function ensureErrorEl(input) {
		var id = (input.id || 'email') + '-error';
		var existing = document.getElementById(id);
		if (existing) return existing;
		var el = document.createElement('p');
		el.id = id;
		el.className = 'field-error email-error';
		el.setAttribute('role', 'alert');
		el.hidden = true;
		input.insertAdjacentElement('afterend', el);
		return el;
	}

	function clearError(input) {
		if (!input) return;
		input.classList.remove('is-invalid');
		input.removeAttribute('aria-invalid');
		if (typeof input.setCustomValidity === 'function') {
			input.setCustomValidity('');
		}
		var err = document.getElementById((input.id || 'email') + '-error');
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
		// Auth modal relies on native reportValidity; skip injected alert there.
		if (input.id === 'auth-email') return;
		var err = ensureErrorEl(input);
		err.textContent = message;
		err.hidden = false;
	}

	function validateOne(input, opts) {
		opts = opts || {};
		if (!input) return true;

		// Guest email is hidden when logged in — skip
		if (input.id === 'field-email' && isDemoLoggedIn()) {
			clearError(input);
			return true;
		}

		var raw = String(input.value || '').trim();
		if (!raw) {
			clearError(input);
			return true;
		}

		if (hasBlockedCoTld(raw)) {
			if (opts.show) showError(input, MSG_CO);
			else if (typeof input.setCustomValidity === 'function') {
				input.setCustomValidity(MSG_CO);
			}
			return false;
		}

		clearError(input);
		return true;
	}

	function collectInputs() {
		var list = [];
		var guest = document.getElementById('field-email');
		var auth = document.getElementById('auth-email');
		if (guest) list.push(guest);
		if (auth) list.push(auth);
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

	function isTarget(el) {
		return el && (el.id === 'field-email' || el.id === 'auth-email');
	}

	function onBlur(e) {
		if (isTarget(e.target)) validateOne(e.target, { show: true });
	}

	function onInput(e) {
		var t = e.target;
		if (!isTarget(t)) return;
		if (t.classList.contains('is-invalid') || t.getAttribute('aria-invalid') === 'true') {
			validateOne(t, { show: true });
		} else if (typeof t.setCustomValidity === 'function') {
			validateOne(t, { show: false });
		}
	}

	function onCheckoutSubmit(e) {
		var guest = document.getElementById('field-email');
		if (!validateOne(guest, { show: true })) {
			e.preventDefault();
			e.stopPropagation();
			try {
				if (guest) {
					guest.focus();
					if (guest.scrollIntoView) {
						guest.scrollIntoView({ behavior: 'smooth', block: 'center' });
					}
				}
			} catch (err) {}
			return false;
		}
	}

	function onAuthEmailSubmit(e) {
		var auth = document.getElementById('auth-email');
		if (!validateOne(auth, { show: true })) {
			e.preventDefault();
			e.stopPropagation();
			if (auth && typeof auth.reportValidity === 'function') {
				auth.reportValidity();
			}
			return false;
		}
	}

	function bind() {
		var form =
			document.querySelector('#checkout-new form') ||
			document.querySelector('#checkout form.cl') ||
			document.querySelector('#checkout form');
		if (form) {
			form.addEventListener('blur', onBlur, true);
			form.addEventListener('input', onInput, true);
			form.addEventListener('submit', onCheckoutSubmit, true);
		}

		var authForm = document.getElementById('auth-email-form');
		var authInput = document.getElementById('auth-email');
		if (authForm) {
			authForm.addEventListener('submit', onAuthEmailSubmit, true);
		}
		if (authInput) {
			authInput.addEventListener('blur', function () {
				validateOne(authInput, { show: true });
			});
			authInput.addEventListener('input', function () {
				if (
					authInput.classList.contains('is-invalid') ||
					authInput.getAttribute('aria-invalid') === 'true' ||
					(typeof authInput.validationMessage === 'string' &&
						authInput.validationMessage)
				) {
					validateOne(authInput, { show: true });
				} else {
					validateOne(authInput, { show: false });
				}
			});
		}

		collectInputs().forEach(function (input) {
			validateOne(input, { show: false });
		});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', bind);
	} else {
		bind();
	}

	window.PlasicoEmail = {
		hasBlockedCoTld: hasBlockedCoTld,
		domainLastLabel: domainLastLabel,
		validateOne: validateOne,
		validateAll: validateAll,
		MSG_CO: MSG_CO
	};
})();

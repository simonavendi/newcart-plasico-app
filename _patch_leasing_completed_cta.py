# -*- coding: utf-8 -*-
"""Patch leasing-completed checkout CTA into local-leasing-modal.js (+ CSS mirror)."""
from pathlib import Path

JS_INSERT_AFTER_WRITE = r'''
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
	}

'''

CSS_APPEND = r'''

/* Checkout finish CTA after leasing apply is filled */
.checkout-finish-wrap {
	display: inline-block;
	margin: 12px 0 0;
	vertical-align: top;
	text-align: center;
}

.checkout-finish-wrap .checkout-finish.btn {
	margin-top: 0 !important;
}

#checkout .checkout-finish.btn.is-leasing-complete,
.checkout-finish.btn.is-leasing-complete {
	display: inline-flex !important;
	flex-direction: column;
	align-items: center;
	justify-content: center;
	min-height: 48px;
	padding: 12px 28px;
	border: 2px solid #55a630;
	border-radius: 4px;
	background: #55a630;
	color: #fff;
	font-family: "exo2b", sans-serif;
	font-size: 16px;
	font-weight: bold;
	line-height: 1.2;
	text-align: center;
	text-transform: none;
	cursor: pointer;
	box-sizing: border-box;
}

#checkout .checkout-finish.btn.is-leasing-complete:hover,
.checkout-finish.btn.is-leasing-complete:hover {
	background: #4a9229;
	border-color: #4a9229;
	color: #fff;
}

#checkout .checkout-finish.btn.is-leasing-complete .checkout-finish__label,
.checkout-finish.btn.is-leasing-complete .checkout-finish__label {
	display: block;
	color: #fff;
	font-size: inherit;
	font-weight: bold;
	line-height: 1.2;
	letter-spacing: 0.02em;
}

#checkout .checkout-finish__hint,
.checkout-finish__hint {
	display: block;
	margin: 6px 0 0;
	padding: 0;
	color: #666;
	font-family: "exo2b", sans-serif;
	font-size: 12px;
	font-weight: normal;
	line-height: 1.3;
	letter-spacing: 0;
	text-transform: none;
	text-align: center;
}

#aside-leasing-btn[hidden],
#checkout .aside-leasing[hidden] {
	display: none !important;
}
'''


def patch_js(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    if 'function syncCheckoutCta(' in text:
        print(path, 'already has syncCheckoutCta')
        return

    anchor = (
        "\tfunction writeSavedApply(payload) {\n"
        "\t\tstate.apply = payload;\n"
        "\t\ttry {\n"
        "\t\t\tsessionStorage.setItem(APPLY_STORAGE_KEY, JSON.stringify(payload));\n"
        "\t\t} catch (e) {\n"
        "\t\t\t/* private mode / quota — in-memory still works */\n"
        "\t\t}\n"
        "\t}\n\n"
        "\tfunction syncInstallmentOptionSelection(columnId) {"
    )
    if anchor not in text:
        raise SystemExit(f'{path}: writeSavedApply anchor not found')
    text = text.replace(
        anchor,
        "\tfunction writeSavedApply(payload) {\n"
        "\t\tstate.apply = payload;\n"
        "\t\ttry {\n"
        "\t\t\tsessionStorage.setItem(APPLY_STORAGE_KEY, JSON.stringify(payload));\n"
        "\t\t} catch (e) {\n"
        "\t\t\t/* private mode / quota — in-memory still works */\n"
        "\t\t}\n"
        "\t}\n"
        + JS_INSERT_AFTER_WRITE
        + "\tfunction syncInstallmentOptionSelection(columnId) {",
        1,
    )

    old_nodata = (
        "\t\tif (!data) {\n"
        "\t\t\tpanel.hidden = true;\n"
        "\t\t\tpanel.innerHTML = '';\n"
        "\t\t\tsyncHiddenApplyFields(null);\n"
        "\t\t\treturn;\n"
        "\t\t}"
    )
    new_nodata = (
        "\t\tif (!data) {\n"
        "\t\t\tpanel.hidden = true;\n"
        "\t\t\tpanel.innerHTML = '';\n"
        "\t\t\tsyncHiddenApplyFields(null);\n"
        "\t\t\tsyncCheckoutCta();\n"
        "\t\t\treturn;\n"
        "\t\t}"
    )
    if old_nodata not in text:
        raise SystemExit(f'{path}: !data block not found')
    text = text.replace(old_nodata, new_nodata, 1)

    old_pay8 = (
        "\t\tvar pay8 = document.querySelector('input[name=\"payment_id\"][value=\"8\"]');\n"
        "\t\tif (pay8 && pay8.checked) {\n"
        "\t\t\thost.classList.remove('hide', 'sf-hidden');\n"
        "\t\t\thost.removeAttribute('hidden');\n"
        "\t\t}\n"
        "\t}"
    )
    # Only the end of renderSavedApply — match more specifically
    old_render_end = (
        "\t\tvar pay8 = document.querySelector('input[name=\"payment_id\"][value=\"8\"]');\n"
        "\t\tif (pay8 && pay8.checked) {\n"
        "\t\t\thost.classList.remove('hide', 'sf-hidden');\n"
        "\t\t\thost.removeAttribute('hidden');\n"
        "\t\t}\n"
        "\t}\n\n"
        "\tfunction readInputValue(sel) {"
    )
    new_render_end = (
        "\t\tvar pay8 = document.querySelector('input[name=\"payment_id\"][value=\"8\"]');\n"
        "\t\tif (pay8 && pay8.checked) {\n"
        "\t\t\thost.classList.remove('hide', 'sf-hidden');\n"
        "\t\t\thost.removeAttribute('hidden');\n"
        "\t\t}\n"
        "\t\tsyncCheckoutCta();\n"
        "\t}\n\n"
        "\tfunction readInputValue(sel) {"
    )
    if old_render_end not in text:
        raise SystemExit(f'{path}: renderSavedApply end not found')
    text = text.replace(old_render_end, new_render_end, 1)

    old_submit_tail = (
        "\t\tsyncCheckoutPaymentInstallments();\n"
        "\t\tsyncInstallmentOptionSelection(payload.column);\n"
        "\t\trenderSavedApply();\n"
        "\t\trenderTeaser();\n"
        "\t\tcloseModal();\n"
    )
    new_submit_tail = (
        "\t\tsyncCheckoutPaymentInstallments();\n"
        "\t\tsyncInstallmentOptionSelection(payload.column);\n"
        "\t\trenderSavedApply();\n"
        "\t\trenderTeaser();\n"
        "\t\tsyncCheckoutCta();\n"
        "\t\ttry {\n"
        "\t\t\tdocument.dispatchEvent(\n"
        "\t\t\t\tnew CustomEvent('plasico:leasing-apply', { detail: payload })\n"
        "\t\t\t);\n"
        "\t\t} catch (evtErr) {\n"
        "\t\t\t/* CustomEvent unsupported — syncCheckoutCta already ran */\n"
        "\t\t}\n"
        "\t\tcloseModal();\n"
    )
    if old_submit_tail not in text:
        raise SystemExit(f'{path}: handleApplySubmit tail not found')
    text = text.replace(old_submit_tail, new_submit_tail, 1)

    old_controls = (
        "\tfunction syncLeasingControls() {\n"
        "\t\tvar hasPrice = state.price > 0;\n"
        "\t\tdocument.querySelectorAll('.js-open-leasing').forEach(function (btn) {\n"
        "\t\t\tbtn.hidden = !hasPrice;\n"
        "\t\t});\n"
        "\t}"
    )
    new_controls = (
        "\tfunction syncLeasingControls() {\n"
        "\t\tvar hasPrice = state.price > 0;\n"
        "\t\tvar hideAsideFilled = isLeasingCompletedCtaActive();\n"
        "\t\tdocument.querySelectorAll('.js-open-leasing').forEach(function (btn) {\n"
        "\t\t\tif (btn.id === 'aside-leasing-btn') {\n"
        "\t\t\t\tbtn.hidden = !hasPrice || hideAsideFilled;\n"
        "\t\t\t\tif (btn.hidden) btn.setAttribute('aria-hidden', 'true');\n"
        "\t\t\t\telse btn.removeAttribute('aria-hidden');\n"
        "\t\t\t\treturn;\n"
        "\t\t\t}\n"
        "\t\t\tbtn.hidden = !hasPrice;\n"
        "\t\t});\n"
        "\t\tsyncCheckoutCta();\n"
        "\t}"
    )
    if old_controls not in text:
        raise SystemExit(f'{path}: syncLeasingControls not found')
    text = text.replace(old_controls, new_controls, 1)

    old_api = (
        "\t\tvar paymentRadios = document.querySelectorAll('input[name=\"payment_id\"]');\n"
        "\t\tArray.prototype.slice.call(paymentRadios).forEach(function (radio) {\n"
        "\t\t\tradio.addEventListener('change', function () {\n"
        "\t\t\t\tif (radio.value === '8') {\n"
        "\t\t\t\t\trenderSavedApply();\n"
        "\t\t\t\t}\n"
        "\t\t\t});\n"
        "\t\t});\n\n"
        "\t\twindow.PlasicoLeasing = {\n"
        "\t\t\topen: openModal,\n"
        "\t\t\tclose: closeModal,\n"
        "\t\t\trefresh: refresh,\n"
        "\t\t\tgetApply: readSavedApply,\n"
        "\t\t\tgetState: function () {\n"
        "\t\t\t\tvar selected = getSelectedTerm();\n"
        "\t\t\t\tvar teaser = getTeaserTerm();\n"
        "\t\t\t\treturn {\n"
        "\t\t\t\t\tprice: state.price,\n"
        "\t\t\t\t\tdownPayment: state.downPayment,\n"
        "\t\t\t\t\tpromoCode: state.promoCode,\n"
        "\t\t\t\t\tfinanced: getFinancedAmount(),\n"
        "\t\t\t\t\tprodId: state.prodId,\n"
        "\t\t\t\t\tcolumn: state.column,\n"
        "\t\t\t\t\tprovider: COLUMNS[state.column].provider,\n"
        "\t\t\t\t\tselectedMonths: state.selectedMonths,\n"
        "\t\t\t\t\tpersonalMonths: state.personalMonths,\n"
        "\t\t\t\t\tselected: selected,\n"
        "\t\t\t\t\tteaser: teaser,\n"
        "\t\t\t\t\tapply: readSavedApply(),\n"
        "\t\t\t\t};\n"
        "\t\t\t},\n"
        "\t\t};\n"
        "\t}"
    )
    new_api = (
        "\t\tvar paymentRadios = document.querySelectorAll('input[name=\"payment_id\"]');\n"
        "\t\tArray.prototype.slice.call(paymentRadios).forEach(function (radio) {\n"
        "\t\t\tradio.addEventListener('change', function () {\n"
        "\t\t\t\tif (radio.value === '8') {\n"
        "\t\t\t\t\trenderSavedApply();\n"
        "\t\t\t\t} else {\n"
        "\t\t\t\t\tsyncCheckoutCta();\n"
        "\t\t\t\t}\n"
        "\t\t\t});\n"
        "\t\t});\n\n"
        "\t\tsyncCheckoutCta();\n\n"
        "\t\twindow.PlasicoLeasing = {\n"
        "\t\t\topen: openModal,\n"
        "\t\t\tclose: closeModal,\n"
        "\t\t\trefresh: refresh,\n"
        "\t\t\tgetApply: readSavedApply,\n"
        "\t\t\tclearApply: function () {\n"
        "\t\t\t\tclearSavedApply();\n"
        "\t\t\t\trenderSavedApply();\n"
        "\t\t\t\trenderTeaser();\n"
        "\t\t\t\tsyncCheckoutCta();\n"
        "\t\t\t},\n"
        "\t\t\tisApplyFilled: isLeasingApplyFilled,\n"
        "\t\t\tisCompletedCtaActive: isLeasingCompletedCtaActive,\n"
        "\t\t\tsyncCheckoutCta: syncCheckoutCta,\n"
        "\t\t\tgetState: function () {\n"
        "\t\t\t\tvar selected = getSelectedTerm();\n"
        "\t\t\t\tvar teaser = getTeaserTerm();\n"
        "\t\t\t\treturn {\n"
        "\t\t\t\t\tprice: state.price,\n"
        "\t\t\t\t\tdownPayment: state.downPayment,\n"
        "\t\t\t\t\tpromoCode: state.promoCode,\n"
        "\t\t\t\t\tfinanced: getFinancedAmount(),\n"
        "\t\t\t\t\tprodId: state.prodId,\n"
        "\t\t\t\t\tcolumn: state.column,\n"
        "\t\t\t\t\tprovider: COLUMNS[state.column].provider,\n"
        "\t\t\t\t\tselectedMonths: state.selectedMonths,\n"
        "\t\t\t\t\tpersonalMonths: state.personalMonths,\n"
        "\t\t\t\t\tselected: selected,\n"
        "\t\t\t\t\tteaser: teaser,\n"
        "\t\t\t\t\tapply: readSavedApply(),\n"
        "\t\t\t\t\tcompletedCta: isLeasingCompletedCtaActive(),\n"
        "\t\t\t\t};\n"
        "\t\t\t},\n"
        "\t\t};\n"
        "\t}"
    )
    if old_api not in text:
        raise SystemExit(f'{path}: PlasicoLeasing API block not found')
    text = text.replace(old_api, new_api, 1)

    path.write_text(text, encoding='utf-8')
    assert 'function syncCheckoutCta(' in text
    assert 'КУПИ НА ИЗПЛАЩАНЕ' in text
    print(path, 'PATCHED OK')


def patch_css(path: Path) -> None:
    text = path.read_text(encoding='utf-8')
    if 'checkout-finish.btn.is-leasing-complete' in text:
        print(path, 'CSS already patched')
        return
    if not text.endswith('\n'):
        text += '\n'
    path.write_text(text + CSS_APPEND, encoding='utf-8')
    print(path, 'CSS PATCHED OK')


def main() -> None:
    patch_js(Path('local-leasing-modal.js'))
    patch_css(Path('local-leasing-modal.css'))
    # Mirror JS for local WIP copies used by older verify docs
    Path('_leasing_modal.js').write_text(
        Path('local-leasing-modal.js').read_text(encoding='utf-8'), encoding='utf-8'
    )
    print('_leasing_modal.js mirrored')


if __name__ == '__main__':
    main()

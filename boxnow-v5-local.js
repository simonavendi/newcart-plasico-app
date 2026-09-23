function _bnclient_map_widget() {
  if (!window._bn_map_widget_config) {
    throw new Error(
      'Object `_bn_map_widget_config` is required for BoxNow Map Widget',
    )
  }
  if (!window._bn_map_widget_config.parentElement) {
    throw new Error('Property `parentElement` must be defined')
  }

  const parentElement = document.querySelector(
    window._bn_map_widget_config.parentElement,
  )
  if (!parentElement) {
    throw new Error(
      'Parent element ' +
        window._bn_map_widget_config.parentElement +
        ' does not exist',
    )
  }

  let _buttonSelector =
    window._bn_map_widget_config.buttonSelector || '.boxnow-map-widget-button'
  let _partnerId = window._bn_map_widget_config.partnerId || 0
  let _lockerId = window._bn_map_widget_config.lockerId
  let _zip = window._bn_map_widget_config.zip
  let _peer = window._bn_map_widget_config.peer
  let _a11y = window._bn_map_widget_config.a11y
  let _islands = window._bn_map_widget_config.islands
  let _iframeInsertAs = window._bn_map_widget_config.insert || 'beforeend'

  const _countryCode = window._bn_map_widget_config.countryCode !== undefined
    ? window._bn_map_widget_config.countryCode.toString().trim().toLowerCase()
    : undefined

  const _language = window._bn_map_widget_config.language !== undefined
    ? window._bn_map_widget_config.language.toString().trim().toLowerCase()
    : undefined

  let _autoGps = 'yes'
  if (window._bn_map_widget_config.gps !== undefined) {
    if (typeof window._bn_map_widget_config.gps !== 'boolean') {
      throw new Error('Property `gps` must be a boolean')
    }
    if (window._bn_map_widget_config.gps === false) {
      _autoGps = 'no'
    }
  }

  let _autoSelect = 'yes'
  if (window._bn_map_widget_config.autoselect !== undefined) {
    if (typeof window._bn_map_widget_config.autoselect !== 'boolean') {
      throw new Error('Property `autoselect` must be a boolean')
    }
    if (window._bn_map_widget_config.autoselect === false) {
      _autoSelect = 'no'
    }
  }

  let _listener = true
  if (window._bn_map_widget_config.listener !== undefined) {
    if (typeof window._bn_map_widget_config.listener !== 'boolean') {
      throw new Error('Property `listener` must be a boolean')
    } else {
      _listener = window._bn_map_widget_config.listener
    }
  }

  let _type = window._bn_map_widget_config.type || 'iframe'
  if (
    _type !== 'iframe' &&
    _type !== 'popup' &&
    _type !== 'navigate' &&
    _type !== 'navigateen'
  ) {
    throw new Error(
      'Property value `type` must be one of `iframe`, `popup`, `navigate`, `navigateen`',
    )
  }

  if (_type === 'iframe' || _type === 'popup') {
    if (!window._bn_map_widget_config.afterSelect) {
      window._bn_map_widget_config.afterSelect = function () {}
    }
    if (typeof window._bn_map_widget_config.afterSelect !== 'function') {
      throw new Error('Property `afterSelect` must be a function')
    }
  } else {
    window._bn_map_widget_config.afterSelect = function () {}
  }

  let _autoClose = 'no'
  if (window._bn_map_widget_config.autoclose !== undefined) {
    if (typeof window._bn_map_widget_config.autoclose !== 'boolean') {
      throw new Error('Property `autoclose` must be a boolean')
    }
    if (window._bn_map_widget_config.autoclose === true) {
      _autoClose = 'yes'
    }
  }

  let _autoShow = false
  if (window._bn_map_widget_config.autoshow !== undefined) {
    if (typeof window._bn_map_widget_config.autoshow !== 'boolean') {
      throw new Error('Property `autoshow` must be a boolean')
    } else {
      _autoShow = window._bn_map_widget_config.autoshow
    }
  }

  let iframe_style = `border:0;width:100%;height:100%;`
  if (_type === 'popup') {
    iframe_style = `border:0;width:100%;height:100%;position:fixed;top:0;left:0;`
    _autoClose = 'yes'
  }

  let urlConfig = [
    'partnerId=' + encodeURIComponent(_partnerId),
    'gps=' + encodeURIComponent(_autoGps),
    'autoselect=' + encodeURIComponent(_autoSelect),
    'autoclose=' + encodeURIComponent(_autoClose),
  ]

  if (_zip !== undefined) urlConfig.push('zip=' + encodeURIComponent(_zip))
  if (_lockerId !== undefined) urlConfig.push('lockerId=' + encodeURIComponent(_lockerId))
  if (_peer !== undefined) urlConfig.push('peer=' + encodeURIComponent(_peer))
  if (_a11y !== undefined) urlConfig.push('a11y=' + encodeURIComponent(_a11y))
  if (_islands !== undefined) urlConfig.push('islands=' + encodeURIComponent(_islands))
  if (_countryCode !== undefined)
    urlConfig.push('countryCode=' + encodeURIComponent(_countryCode))
  if (_language !== undefined)
    urlConfig.push('language=' + encodeURIComponent(_language))

  let iframe_id = `boxnow_map_widget${Math.floor(
    (1 + Math.random()) * 0x10000,
  )}`

  function createIframe() {
    let i = document.createElement('iframe')
    i.src =
      'https://widget-v5.boxnow.bg/' + _type + '.html?' + urlConfig.join('&')
    i.allowtransparency = 'true'
    i.allow = 'geolocation'
    i.id = iframe_id
    i.style = iframe_style
    parentElement.insertAdjacentElement(_iframeInsertAs, i)
  }

  if (_autoShow === false) {
    const showMapButton = document.querySelector(_buttonSelector)
    if (showMapButton) {
      showMapButton.addEventListener('click', (e) => {
        e.preventDefault()
        e.stopPropagation()
        createIframe()
      })
    }
  } else {
    createIframe()
  }

  function isAllowedOrigin(origin) {
    try {
      const u = new URL(origin)
      const host = u.hostname
      const explicit = new Set([
        'https://widget.boxnow.bg',
        'https://widget-v1.boxnow.bg',
        'https://widget-v2.boxnow.bg',
        'https://widget-v3.boxnow.bg',
        'https://widget-v4.boxnow.bg',
        'https://widget-v5.boxnow.bg',
      ])
      if (explicit.has(origin)) return true

      return /^(map|widget-new)\.boxnow\.[a-z0-9-]+$/i.test(host)
    } catch {
      return false
    }
  }

  if (_listener) {
    window.addEventListener('message', (event) => {
      if (!isAllowedOrigin(event.origin)) return

      if (event.data) {
        if (_autoClose === 'yes') {
          const el = document.getElementById(iframe_id)
          if (el) el.remove()
        }
        window._bn_map_widget_config.afterSelect(event.data)
      }
    })
  }
}

'loading' !== document.readyState
  ? _bnclient_map_widget()
  : document.addEventListener
  ? document.addEventListener('DOMContentLoaded', _bnclient_map_widget)
  : document.attachEvent('onreadystatechange', function () {
      'complete' === document.readyState && _bnclient_map_widget()
    })
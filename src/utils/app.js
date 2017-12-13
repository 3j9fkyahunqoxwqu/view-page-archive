import browser from 'webextension-polyfill';
import _ from 'lodash';

import storage from 'storage/storage';
import {getText} from 'utils/common';

async function getEnabledEngines(options) {
  if (typeof options === 'undefined') {
    options = await storage.get(['engines', 'disabledEngines'], 'sync');
  }
  return _.difference(options.engines, options.disabledEngines);
}

function showNotification({message, messageId, title, type = 'info'}) {
  if (!title) {
    title = getText('extensionName');
  }
  if (messageId) {
    message = getText(messageId);
  }
  return browser.notifications.create(`vpa-notification-${type}`, {
    type: 'basic',
    title: title,
    message: message,
    iconUrl: '/src/icons/app/icon-48.png'
  });
}

function validateUrl(url) {
  if (url.length > 2048) {
    return;
  }

  let parsedUrl;
  try {
    parsedUrl = new URL(url);
  } catch (e) {
    return;
  }

  if (!/^(?:https?|ftp):$/i.test(parsedUrl.protocol)) {
    return;
  }

  return true;
}

module.exports = {
  getEnabledEngines,
  showNotification,
  validateUrl
};

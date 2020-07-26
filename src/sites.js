/**
 * Stores the time that is spent on each site.
 * The primary interface to this class is through setCurrentFocus.
 */
export default function Sites(config) {
  this._config = config;
  if(!localStorage.sites) {
    localStorage.sites = JSON.stringify({});
  }

  // store sites data for each day separately
  const key = getKeyName();
  if(localStorage.getItem(key) === null) {
    localStorage.setItem( key, JSON.stringify({}));
  }

  this._currentSite = null;
  this._siteRegexp = /^(\w+:\/\/[^\/]+).*$/;
  this._startTime = null;
  console.log("Load Site object");
}

/**
 *
 */
function getKeyName() {
  const date = new Date();
  let keyName = date.getFullYear() + "-" + (date.getMonth() + 1 ) + "-" + date.getDate();
  keyName = "sites:intervention@" + keyName;
  console.log("Key Name: " + keyName);
  return keyName;
}


/**
 * Returns the a dictionary of site -> seconds.
 */
Object.defineProperty(Sites.prototype, "sites", {
  get: function () {
    const siteList = JSON.parse(localStorage.sites);
    const sites = {};
    for(let site in siteList) {
      if(siteList.hasOwnProperty(site) && !this._config.isIgnoredSite(site)) {
        sites[site] = siteList[site];
      }
    }
    return sites;
  }
});

/**
 * Returns the a dictionary of sitesToday -> seconds.
 */
// Object.defineProperty(Sites.prototype, sitesToday, {
//     get: function () {
//         // Get per day stats
//         var key = getKeyName();
//         var st = JSON.parse(localStorage.getItem(sitesToday));
//         var sitesToday = {};
//         for(var site in st) {
//             if(st.hasOwnProperty(site) && !this._config.isIgnoredSite(site)) {
//                 sitesToday[site] = st[site];
//             }
//         }
//         console.log("sitesToday=" + sitesToday);
//         return sitesToday;
//     }
// });

/**
 * Returns just the site/domain from the url. Includes the protocol.
 * chrome://extensions/some/other?blah=ffdf -> chrome://extensions
 * @param {string} url The URL of the page, including the protocol.
 * @return {string} The site, including protocol, but not paths.
 */
Sites.prototype.getSiteFromUrl = function (url) {
  const match = url.match(this._siteRegexp);
  if(match) {
    return match[1];
  }
  return null;
};

Sites.prototype._updateTime = function () {
  if(!this._currentSite || !this._startTime) {
    return;
  }

  const delta = new Date() - this._startTime;
  console.log("*updateTime* " + new Date(), "(" + delta / 1000 + " secs):", this._currentSite);

  if(delta / 1000 / 60 > 2 * this._config.updateTimePeriodMinutes) {
    console.log("Delta of " + delta / 1000 + " seconds too long; ignored.");
    return;
  }

  const sites = this.sites;
  if(!sites[this._currentSite]) {
    sites[this._currentSite] = 0;
  }
  sites[this._currentSite] += delta / 1000;
  localStorage.sites = JSON.stringify(sites);

  // Store data in sitesToday
  const sitesToday = getSitesToday();
  const key = getKeyName();
  if(!sitesToday[this._currentSite]) {
    sitesToday[this._currentSite] = 0;
  }
  sitesToday[this._currentSite] += delta / 1000;
  localStorage.setItem( key, JSON.stringify(sitesToday));
};

/**
 * This method should be called whenever there is a potential focus change.
 * Provide url=null if Chrome is out of focus.
 */
Sites.prototype.setCurrentFocus = function (url) {
  this._updateTime();
  if(url != null) {
    this._currentSite = this.getSiteFromUrl(url);
    this._startTime = new Date();

    // Sets the icon for the browser action.
    // The icon can be specified as the path to an image file,
    // as the pixel data from a canvas element,
    // or as a dictionary of one of those
    chrome.browserAction.setIcon({ path: { 19: 'assets/icon19.png', 38: 'assets/icon38.png'}});

    if(this._currentSite === null) return;

    // if(this._currentSite.indexOf("www.facebook.com") > -1) {
    //     var fbTime = JSON.parse(localStorage.sites)[this._currentSite];
    //     var msg = 'You have spent ' + fbTime + " seconds on Facebook.";
    //     msg += '\nSo when are you leaving Facebook?';
    // }

    // Gets all tabs that have the specified properties, or all tabs if no properties are specified
    chrome.tabs.query({active: true, currentWindow: true}, function (tabs) {
      console.log("sites.js tabs[0]: ", tabs[0]);

      // Sends a single message to the content script(s) in the specified tab,
      // with an optional callback to run when a response is sent back.
      // The runtime.onMessage event is fired in each content script running in the specified tab for the current extension
      chrome.tabs.sendMessage(tabs[0].id, {currentTab: tabs[0]});
    });
  } else {
    this._currentSite = null;
    this._startTime = null;
    chrome.browserAction.setIcon({ path: { 19: 'assets/icon_paused19.png', 38: 'assets/icon_paused38.png'}});
  }
};

function redirectPage(tab) {
  setTimeout(function () {
    // chrome.tabs.update(tab.id, {url: "https://medium.com/"});
    const sites = getSitesToday();
    let site = "unknown";

    let time = 0;
    if(tab.url.indexOf("www.facebook.com") > -1) {
      site = "Facebook";
      time = sites["https://www.facebook.com"];
    }

    if(tab.url.indexOf("www.youtube.com") > -1) {
      site = "Youtube";
      time = sites["https://www.youtube.com"];
    }

    const redirectURL = "/quote.html?site=" + site + "&time=" + time;
    chrome.tabs.update(tab.id, {url: redirectURL});
  }, 5 * 60 * 1000);
}


/*
 * Get sites for today
 */
function getSitesToday() {
  // Get per day stats
 const key = getKeyName();
  const siteList = JSON.parse(localStorage.getItem(key));
  const sitesToday = {};
  for(let site in siteList) {
    if(siteList.hasOwnProperty(site)) {
      sitesToday[site] = siteList[site];
    }
  }
  return sitesToday;
}

/**
 * Clear all statistics.
 */
Sites.prototype.clear = function () {
  localStorage.sites = JSON.stringify({});
  this._config.lastClearTime = new Date().getTime();
};

// Fired when a message is sent from either an extension process or a content script
chrome.runtime.onMessage.addListener(function (request, sender, sendResponse) {
  if(request.action === "redirect") {
    redirectPage(request.tabToRedirect);
  }
});

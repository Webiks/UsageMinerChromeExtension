// var _gaq = _gaq || [];
// _gaq.push(['_setAccount', 'UA-45267314-2']);
// _gaq.push(['_trackPageview']);
//
// (function () {
//     var ga = document.createElement('script');
//     ga.type = 'text/javascript';
//     ga.async = true;
//     ga.src = 'https://ssl.google-analytics.com/ga.js';
//     var s = document.getElementsByTagName('script')[0];
//     s.parentNode.insertBefore(ga, s);
// })();

function clearStats() {

  if(config.clearStatsInterval < 3600) {
    config.nextTimeToClear = 0;
    return;
  }

  if(!config.nextTimeToClear) {
    const date = new Date();
    date.setTime(date.getTime() + config.clearStatsInterval * 1000);
    date.setMinutes(0);
    date.setSeconds(0);
    if(config.clearStatsInterval > 3600) {
      date.setHours(0);
    }
    config.nextTimeToClear = date.getTime();
  }
  const now = new Date();
  if(now.getTime() > config.nextTimeToClear) {
    sites.clear();
    const nextTimeToClear = new Date(config.nextTimeToClear + config.clearStatsInterval * 1000);
    config.nextTimeToClear = nextTimeToClear.getTime();
    // return;
  }
}

const config = new Config();
const sites = new Sites(config);
const tracker = new Tracker(config, sites);

// Listen for message which come from the user through the popup.
// Fired when a message is sent from either an extension process or a content script
chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
  switch(message.action) {
    case "clearStats":
      console.log("Clear stats: " + message.action);
      sites.clear();
      sendResponse({});
      break;
    case "addIgnoredSite":
      console.log("Add ignored site: " + message.action);
      config.addIgnoredSite(message.site);
      sendResponse({});
      break;
    default:
      console.log("Invalid action given: " + message.action);
  }
  // if(message.action === "clearStats") {
  //     console.log("Clear stats: " + message.action);
  //     sites.clear();
  //     sendResponse({});
  // } else if(message.action === "addIgnoredSite") {
  //     console.log("Add ignored site: " + message.action);
  //     config.addIgnoredSite(message.site);
  //     sendResponse({});
  // } else {
  //     console.log("Invalid action given: " + message.action);
  // }
});

// Creates an alarm. Near the time(s) specified by alarmInfo, the onAlarm event is fired.
chrome.alarms.create("clearStats", {periodInMinutes: 2});

// Fired when an alarm period has elapsed
chrome.alarms.onAlarm.addListener(alarm => {
  if(alarm.name === "clearStats") {
    clearStats(config);
  }
});

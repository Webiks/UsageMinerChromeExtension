"use strict";

import Config from './config';
import Sites from './sites';
import Tracker from './tracker';
import Publisher from './publisher';

function clearStats() {

  if(theConfig.clearStatsInterval < 3600) {
    theConfig.nextTimeToClear = 0;
    return;
  }

  if(!theConfig.nextTimeToClear) {
    const date = new Date();
    date.setTime(date.getTime() + theConfig.clearStatsInterval * 1000);
    date.setMinutes(0);
    date.setSeconds(0);
    if(theConfig.clearStatsInterval > 3600) {
      date.setHours(0);
    }
    theConfig.nextTimeToClear = date.getTime();
  }

  const now = new Date();
  if(now.getTime() > theConfig.nextTimeToClear) {
    theSites.clear();
    const nextTimeToClear = new Date(theConfig.nextTimeToClear + theConfig.clearStatsInterval * 1000);
    theConfig.nextTimeToClear = nextTimeToClear.getTime();
    // return;
  }
}

const theConfig = new Config();
const theSites = new Sites(theConfig);
const theTracker = new Tracker(theConfig, theSites);
const publisher = new Publisher(theSites);

// Listen for message which come from the user through the popup.
// Fired when a message is sent from either an extension process or a content script
chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
  switch(message.action) {
    case 'clearStats':
      console.log('Clear stats: ' + message.action);
      theSites.clear();
      sendResponse({});
      break;
    case 'addIgnoredSite':
      console.log('Add ignored site: ' + message.action);
      theConfig.addIgnoredSite(message.site);
      sendResponse({});
      break;
    default:
      console.log('Invalid action given: ' + message.action);
  }
});

// Creates an alarm. Near the time(s) specified by alarmInfo, the onAlarm event is fired.
chrome.alarms.create('clearStats', {periodInMinutes: 2});

// Fired when an alarm period has elapsed
chrome.alarms.onAlarm.addListener(alarm => {
  if(alarm.name === 'clearStats') {
    clearStats(theConfig);
  }
});
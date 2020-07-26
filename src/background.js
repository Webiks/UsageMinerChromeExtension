
import axios from 'axios';
import Config from './config';
import Sites from './sites';
import Tracker from './tracker';

const postStats = async (stats) => {
// const postStats = (stats) => {
  const data = { stats: stats };
  const url = "localhost:3003";
  console.log("Publish JSON: " + JSON.stringify(data, null, 2) );
  console.log("Publish JSON: " + url);

  const res = await axios.post(url, data);

  console.log(`Status code: ${res.status}`);
  console.log(`Status text: ${res.statusText}`);
  console.log(`Request method: ${res.request.method}`);
  console.log(`Path: ${res.request.path}`);

  console.log(`Date: ${res.headers.date}`);
  console.log(`Data: ${res.data}`);
}

function publishStats() {

  const stats = [];
  const siteList = JSON.parse(localStorage.sites);
  for(let site in siteList) {
    if(siteList.hasOwnProperty(site) /* && !theConfig.isIgnoredSite(site) */ ) {
      console.log(`Publish Stats: ${site} : ${siteList[site]}`);
      stats.push({domain: site, time: siteList[site]});
    }
  }
  console.log("Publish JSON: " + JSON.stringify(stats));
  // publisher.postStats(stats);
  postStats(stats);


  // TODO support request optionals: autoPlay, rate and interval?
  // return new Promise<string>((resolve, reject) => {
  //   const routeServiceUrl = 'http://localhost:3003/route?from={from}&to={to}'; // TODO get url from configuration (options)/storage
  //   const url = routeServiceUrl.replace('{from}', encodeURIComponent(request.from)).replace('{to}', encodeURIComponent(request.to));
  //   console.log(url);
  //   // TODO move service logic to extension (no need for external service, but requires more configuration/options)
  //   axios.get(url).then(({ data }) => {
  //     window.postMessage({
  //       type: 'setRoute',
  //       route: data
  //     }, '*');
  //     resolve('Route ready to play');
  //   }).catch(err => reject(err));
  // });
  clearStats(theConfig);
}

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
// const publisher = new Publisher();

// Listen for message which come from the user through the popup.
// Fired when a message is sent from either an extension process or a content script
chrome.runtime.onMessage.addListener( (message, sender, sendResponse) => {
  switch(message.action) {
    case "clearStats":
      console.log("Clear stats: " + message.action);
      theSites.clear();
      sendResponse({});
      break;
    case "addIgnoredSite":
      console.log("Add ignored site: " + message.action);
      theConfig.addIgnoredSite(message.site);
      sendResponse({});
      break;
    default:
      console.log("Invalid action given: " + message.action);
  }
  // if(message.action === "clearStats") {
  //     console.log("Clear stats: " + message.action);
  //     theSites.clear();
  //     sendResponse({});
  // } else if(message.action === "addIgnoredSite") {
  //     console.log("Add ignored site: " + message.action);
  //     theConfig.addIgnoredSite(message.site);
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
    clearStats(theConfig);
  }
});

// Creates an alarm. Near the time(s) specified by alarmInfo, the onAlarm event is fired.
chrome.alarms.create("publishStats", {periodInMinutes: 1});

// Fired when an alarm period has elapsed
chrome.alarms.onAlarm.addListener(alarm => {
  if(alarm.name === "publishStats") {
    publishStats(theSites);
  }
});

"use strict";

import axios from "axios";

Publisher.prototype.postStats =  async function(stats, sites) {

  console.log('Port: ' +  this.port);
  console.log('Hostname: ' +  this.hostname);

  const url = 'http://' + this.hostname + ':' + this.port + '/data';
  console.log('Publish JSON: ' + JSON.stringify(stats, null, 2) );
  console.log('Publish JSON: ' + url);

  await axios.post(url, stats)
    .then((response) => {
      console.log('Status Code: ' + response.status);
      if(response.status === 200) {
        console.log('Status Text: ' + response.statusText);
        // clearStats(theConfig);
        sites.clear();
      }
    }, (error) => {
      console.log(error);
    })
    .catch(() => console.log('Can’t access ' + url + ' response. Blocked by browser?'))
}

Publisher.prototype.publishStats = function(sites) {

  const stats = [];
  const siteList = JSON.parse(localStorage.sites);
  for(let site in siteList) {
    if(siteList.hasOwnProperty(site) /* && !theConfig.isIgnoredSite(site) */ ) {
      console.log(`Publish Stats: ${site} : ${siteList[site]}`);
      stats.push({domain: site, time: siteList[site]});
    }
  }
  console.log('Publish JSON: ' + JSON.stringify(stats));
  const p = this.postStats(stats, sites);
}

export default function Publisher(sites) {

  const port = 8006;
  const host = "127.0.0.1";
  const interval = 15;

  const xhr = new XMLHttpRequest();
  xhr.open("GET", chrome.runtime.getURL('/config.json'), true);
  xhr.onreadystatechange = () => {
    if(xhr.readyState === 4) {
      console.log("load file", xhr.response);
      const conf = JSON.parse(xhr.response);

      this.port = conf.port || port;
      this.hostname = conf.hostname || host;
      this.intervalInMinutes = conf.intervalInMinutes || interval;

      console.log('Interval: ' +  this.intervalInMinutes);

      console.log("Load Publisher object");

      chrome.alarms.create('publishStats', {periodInMinutes: this.intervalInMinutes});

      chrome.alarms.onAlarm.addListener(alarm => {
        if(alarm.name === 'publishStats') {
          this.publishStats(sites);
        }
      });
    }
  }
  xhr.send();
}

Object.defineProperty(Publisher.prototype, "hostname", {
  get: function() {
    return localStorage.host;
  },

  set: function(host) {
    localStorage.host = host;
  }
});

Object.defineProperty(Publisher.prototype, "port", {
  get: function() {
    return parseInt(localStorage.port);
  },

  set: function(port) {
    localStorage.port = port.toString();
  }
});

Object.defineProperty(Publisher.prototype, "intervalInMinutes", {
  get: function() {
    return parseInt(localStorage.intervalInMinutes);
  },

  set: function(interval) {
    localStorage.intervalInMinutes = interval.toString();
  }
});
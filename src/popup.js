import Config from './config';
import Sites from './sites';

const theConfig = new Config();
const gsites = new Sites(theConfig);

function addIgnoredSite(add_site) {
  return function() {
    chrome.runtime.sendMessage({action: "addIgnoredSite", site: add_site}, response => {
      initialize();
    });
  };
}

function secondsToString(seconds) {
  if(theConfig.timeDisplayFormat === Config.timeDisplayFormatEnum.MINUTES) {
    return (seconds / 60).toFixed(2);
  }

  const years = Math.floor(seconds / 31536000);
  const days = Math.floor((seconds % 31536000) / 86400);
  const hours = Math.floor(((seconds % 31536000) % 86400) / 3600);
  const mins = Math.floor((((seconds % 31536000) % 86400) % 3600) / 60);
  const secs = (((seconds % 31536000) % 86400) % 3600) % 60;
  let secAsStr = "";
  if(years) {
    secAsStr = secAsStr + " " + years + "y";
  }
  if(days) {
    secAsStr = secAsStr + " " + days + "d";
  }
  if(hours) {
    secAsStr = secAsStr + " " + hours + "h";
  }
  if(mins) {
    secAsStr = secAsStr + " " + mins + "m";
  }
  if(secs) {
    secAsStr = secAsStr + " " + secs.toFixed(0) + "s";
  }
  return secAsStr;
}

function addLocalDisplay() {
  const old_tbody = document.getElementById("stats_tbody");
  const new_tbody = document.createElement("tbody");
  new_tbody.setAttribute("id", "stats_tbody");
  old_tbody.parentNode.replaceChild(new_tbody, old_tbody);

  /* Sort sites by time spent */
  const sites = gsites.sites;
  const sortedSites = new Array();
  let totalTime = 0;

  for(let site in sites) {
    sortedSites.push([site, sites[site]]);
    totalTime += sites[site];
  }
  sortedSites.sort(function(a, b) {
    return b[1] - a[1];
  });

  /* Show only the top 15 sites by default */
  let max = 15;
  if(document.location.href.indexOf("show=all") != -1) {
    max = sortedSites.length;
  }

  /* Add total row. */
  let row = document.createElement("tr");
  let cell = document.createElement("td");

  cell.innerHTML = "<b>Total</b>";
  row.appendChild(cell);
  cell = document.createElement("td");
  cell.appendChild(document.createTextNode(secondsToString(totalTime)));
  row.appendChild(cell);
  cell = document.createElement("td");
  cell.appendChild(document.createTextNode(("100")));
  row.appendChild(cell);
  row = setPercentageBG(row, 0);
  new_tbody.appendChild(row);

  let maxTime = 0;
  if(sortedSites.length) {
    maxTime = sites[sortedSites[0][0]];
  }

  let relativePct = 0;
  for(let index = 0; ((index < sortedSites.length) && (index < max)); index++) {
    const site = sortedSites[index][0];
    row = document.createElement("tr");
    cell = document.createElement("td");
    const removeImage = document.createElement("img");
    removeImage.src = chrome.runtime.getURL("assets/remove.png");
    removeImage.title = "Remove and stop tracking.";
    removeImage.width = 10;
    removeImage.height = 10;
    removeImage.onclick = addIgnoredSite(site);
    cell.appendChild(removeImage);
    const anchor = document.createElement('a');
    anchor.appendChild(document.createTextNode(site));
    anchor.title = "Open link in new tab";
    anchor.href = site;
    anchor.target = "_blank";
    cell.appendChild(anchor);
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.appendChild(document.createTextNode(secondsToString(sites[site])));
    row.appendChild(cell);
    cell = document.createElement("td");
    cell.appendChild(document.createTextNode((sites[site] / totalTime * 100).toFixed(2)));
    relativePct = (sites[site] / maxTime * 100).toFixed(2);
    row = setPercentageBG(row, relativePct);
    row.appendChild(cell);
    new_tbody.appendChild(row);
  }

  /* Show the "Show All" link if there are some sites we didn't show. */
  if(max < sortedSites.length && document.getElementById("show") == null) {
    /* Add an option to show all stats */
    const showAllLink = document.createElement("a");
    showAllLink.onclick = function() {
      chrome.tabs.create({url: "popup.html?show=all"});
    }
    showAllLink.setAttribute("id", "show");
    showAllLink.setAttribute("href", "javascript:void(0)");
    showAllLink.setAttribute("class", "pure-button");
    showAllLink.appendChild(document.createTextNode("Show All"));
    document.getElementById("button_row").appendChild(showAllLink);
  } else if(document.getElementById("show") != null) {
    const showLink = document.getElementById("show");
    showLink.parentNode.removeChild(showLink);
  }
}

function setPercentageBG(row, pct) {
  const color = "#e8edff";
  row.style.backgroundImage = "-webkit-linear-gradient(left, " + color + " " + pct + "%,#ffffff " + pct + "%)";
  row.style.backgroundImage = "    -moz-linear-gradient(left, " + color + " " + pct + "%, #ffffff " + pct + "%)";
  row.style.backgroundImage = "     -ms-linear-gradient(left, " + color + " " + pct + "%,#ffffff " + pct + "%)";
  row.style.backgroundImage = "      -o-linear-gradient(left, " + color + " " + pct + "%,#ffffff " + pct + "%)";
  row.style.backgroundImage = "         linear-gradient(to right, " + color + " " + pct + "%,#ffffff " + pct + "%)";
  return row;
}

function sendStats() {
  // chrome.extension.sendRequest({
  chrome.runtime.sendMessage({action: "sendStats"}, response => {
    /* Reload the iframe. */
    const iframe = document.getElementById("stats_frame");
    iframe.src = iframe.src;
  });
}

function clearStats() {
  chrome.runtime.sendMessage({action: "clearStats"}, function(response) {
    initialize();
  });
}

function initialize() {
  addLocalDisplay();

  if(theConfig.lastClearTime) {
    const div = document.getElementById("lastClear");
    if(div.childNodes.length === 1) {
      div.removeChild(div.childNodes[0]);
    }
    div.appendChild(
      document.createTextNode("Last Reset: " + new Date(theConfig.lastClearTime).toString()));
  }

  let nextClearStats = theConfig.nextTimeToClear;
  if(nextClearStats) {
    nextClearStats = parseInt(nextClearStats, 10);
    nextClearStats = new Date(nextClearStats);
    const nextClearDiv = document.getElementById("nextClear");
    if(nextClearDiv.childNodes.length === 1) {
      nextClearDiv.removeChild(nextClearDiv.childNodes[0]);
    }
    nextClearDiv.appendChild(document.createTextNode("Next Reset: " + nextClearStats.toString()));
  }
}

document.addEventListener("DOMContentLoaded", function() {

  document.getElementById("clear")
    .addEventListener("click", function() {
      if(confirm("Are you sure?")) {
        clearStats();
      }
    });

  document.getElementById("options")
    .addEventListener("click", function() {
      chrome.runtime.openOptionsPage();
    });

  const buttons = document.querySelectorAll("button");
  for(let i = 0; i < buttons.length; i++) {
    buttons[i].addEventListener("click", function(me) {
      console.log("Track Event: " + me.target.id + "clicked");
      // _gaq.push(["_trackEvent", me.target.id, "clicked"]);
    });
  }
  initialize();
});

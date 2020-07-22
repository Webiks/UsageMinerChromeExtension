"use strict";

import  axios from '../node_modules/axios/lib/axios.js';

function Publisher() {
  console.log("Load Publisher object");
}

Publisher.prototype.postStats = async (stats) => {
  const data = { stats: stats };
  const url = "localhost:3000";
  console.log("Publish JSON: " + JSON.stringify(data, null, 2) );
  console.log("Publish JSON: " + url);
  const res = await axios.post(url, data);
}
function createAPIEnvoy(serverURL) {

var APIEnvoy = {
  serverURL: serverURL,
  queuesForIntervals: {}
};

APIEnvoy.request = function request(jsonBody, done) {
  var xhr = new XMLHttpRequest();
  xhr.open('POST', this.serverURL);
  xhr.setRequestHeader('Content-Type', 'application/json');
  xhr.setRequestHeader('accept', 'application/json');

  xhr.onload = function gotSprig() {
    if (this.status === 200) {
      var response = JSON.parse(this.responseText);
      done(null, response);
    }
    else {
      done(this.status, null);
    }
  };

  xhr.send(JSON.stringify(jsonBody));
};

APIEnvoy.addRequestToQueue = function queueForBatchedRequest(
  batchIntervalInSeconds, jsonBody, done) {

  var queueKey = queuesForIntervals.toString();
  var queue = null;
  if (queueKey in this.queuesForIntervals) {
    queue = this.queuesForIntervals[queueKey];
  }
  else {
    queue = [];
    this.queuesForIntervals[queueKey] = queue;
  }

  queue.push({
    jsonBody: jsonBody,
    done: done
  });

};

return APIEnvoy;
}


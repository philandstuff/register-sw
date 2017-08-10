var getJSON = function(url) {
  return new Promise(function(resolve, reject) {
    var xhr = new XMLHttpRequest();
    xhr.open('get', url, true);
    xhr.responseType = 'json';
    xhr.onload = function() {
      var status = xhr.status;
      if (status == 200) {
	resolve(xhr.response);
      } else {
	reject(status);
      }
    };
    xhr.send();
  });
};

var buttonHandler = function(event) {
  event.preventDefault();
  var cc = document.getElementById('cc').value;
  getJSON('https://country.register.gov.uk/record/' + cc + '.json').then(function(data) {
    var item = data[cc].item[0];
    document.getElementById('code').innerHTML = cc;
    document.getElementById('shortname').innerHTML = item.name;
    document.getElementById('fullname').innerHTML = item['official-name'];
  }, function(status) {
    console.log('Something went wrong.' + status);
  });
}

if ('serviceWorker' in navigator) {
  window.addEventListener('load', function() {
    navigator.serviceWorker.register('/sw.js').then(function(registration) {
      // Registration was successful
      console.log('ServiceWorker registration successful with scope: ', registration.scope);
    }, function(err) {
      // registration failed :(
      console.log('ServiceWorker registration failed: ', err);
    });
  });
}

document.getElementById("submit").onclick = buttonHandler;

// from https://raw.githubusercontent.com/jakearchibald/idb-keyval/cc960ba082679d2c8c3b71522985da4f2175d3f6/idb-keyval.js
  'use strict';
  var db;

  function getDB() {
    if (!db) {
      db = new Promise(function(resolve, reject) {
        var openreq = indexedDB.open('keyval-store', 1);

        openreq.onerror = function() {
          reject(openreq.error);
        };

        openreq.onupgradeneeded = function() {
          // First time setup: create an empty object store
          openreq.result.createObjectStore('keyval');
        };

        openreq.onsuccess = function() {
          resolve(openreq.result);
        };
      });
    }
    return db;
  }

  function withStore(type, callback) {
    return getDB().then(function(db) {
      return new Promise(function(resolve, reject) {
        var transaction = db.transaction('keyval', type);
        transaction.oncomplete = function() {
          resolve();
        };
        transaction.onerror = function() {
          reject(transaction.error);
        };
        callback(transaction.objectStore('keyval'));
      });
    });
  }

  var idbKeyval = {
    get: function(key) {
      var req;
      return withStore('readonly', function(store) {
        req = store.get(key);
      }).then(function() {
        return req.result;
      });
    },
    set: function(key, value) {
      return withStore('readwrite', function(store) {
        store.put(value, key);
      });
    },
    delete: function(key) {
      return withStore('readwrite', function(store) {
        store.delete(key);
      });
    },
    clear: function() {
      return withStore('readwrite', function(store) {
        store.clear();
      });
    },
    keys: function() {
      var keys = [];
      return withStore('readonly', function(store) {
        // This would be store.getAllKeys(), but it isn't supported by Edge or Safari.
        // And openKeyCursor isn't supported by Safari.
        (store.openKeyCursor || store.openCursor).call(store).onsuccess = function() {
          if (!this.result) return;
          keys.push(this.result.key);
          this.result.continue();
        };
      }).then(function() {
        return keys;
      });
    }
  };
// ------

self.addEventListener('install', function(event) {
  event.waitUntil(
    fetch('https://country.register.gov.uk/records.json?page-size=5000')
      .then(function(response) {
        return response.json();
      }) .then(function(data) {
      return Promise.all(
        Object.keys(data).map(function(countryCode) {
          var obj = {};
          obj[countryCode] = data[countryCode];
          return idbKeyval.set(countryCode, obj);
        })
      );
    })
  );
});

self.addEventListener('fetch', function(event) {
  var match = event.request.url.match('https://country\.register\.gov\.uk/record/(.*)\.json');
  if (match) {
    event.respondWith(
      idbKeyval.get(match[1]).then(function(record){
        if (!record) {
          return fetch(event.request);
        }
        return new Response(JSON.stringify(record), {
          headers: {'Content-Type': 'application/json'}
        })
      })
    );
  }
});

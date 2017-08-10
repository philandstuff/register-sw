self.addEventListener('install', function(event) {
  console.log('in install event');
  if (self.skipWaiting) { self.skipWaiting(); }
});

self.addEventListener('push', function(event) {
  let data = {};
  try {
    data = event.data ? event.data.json() : {};
  } catch (e) {
    console.error("Error parsing push data", e);
  }

  const title = data.title || 'تنبيه من شبكة الميكروتك';
  const options = {
    body: data.body || 'هناك تغيير في حالة الشبكة',
    icon: '/vite.svg', // You can replace this with a custom icon later
    badge: '/vite.svg',
    vibrate: [200, 100, 200, 100, 200, 100, 200], // Strong vibration pattern
    requireInteraction: true, // Keeps the notification open until the user clicks or dismisses it
    data: {
      url: '/'
    }
  };

  event.waitUntil(self.registration.showNotification(title, options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  
  // Open the app when the notification is clicked
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function(clientList) {
      if (clientList.length > 0) {
        let client = clientList[0];
        for (let i = 0; i < clientList.length; i++) {
          if (clientList[i].focused) {
            client = clientList[i];
          }
        }
        return client.focus();
      }
      return clients.openWindow('/');
    })
  );
});

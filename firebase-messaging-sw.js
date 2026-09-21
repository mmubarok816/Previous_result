// firebase-messaging-sw.js

importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-app-compat.js"
);
importScripts(
  "https://www.gstatic.com/firebasejs/12.0.0/firebase-messaging-compat.js"
);

firebase.initializeApp({
  apiKey: "AIzaSyBm31uBHEea0TnvrI_OkG7GRkFWRZTboFQ",
  authDomain: "mahira-fast-food.firebaseapp.com",
  databaseURL: "https://mahira-fast-food-default-rtdb.firebaseio.com",
  projectId: "mahira-fast-food",
  storageBucket: "mahira-fast-food.firebasestorage.app",
  messagingSenderId: "233550566877",
  appId: "1:233550566877:web:fff6bd2984be8926ef1234",
  measurementId: "G-4376MP90MZ"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {

  console.log(
    "[firebase-messaging-sw.js] Background message:",
    payload
  );

  const notificationTitle =
    payload.notification?.title ||
    payload.data?.title ||
    "Mahira Fast Food";

  const notificationOptions = {
    body:
      payload.notification?.body ||
      payload.data?.body ||
      "You have a new notification.",

    icon: "/icon-192.png",

    badge: "/icon-192.png",

    data: {
      url:
        payload.data?.url ||
        "https://previousr.netlify.app/"
    },

    vibrate: [200, 100, 200],

    tag:
      payload.data?.tag ||
      "mahira-notification",

    renotify: true
  };

  return self.registration.showNotification(
    notificationTitle,
    notificationOptions
  );
});

self.addEventListener("notificationclick", function(event) {

  event.notification.close();

  const url =
    event.notification?.data?.url ||
    "https://previousr.netlify.app/";

  event.waitUntil(
    clients.matchAll({
      type: "window",
      includeUncontrolled: true
    }).then(function(clientList) {

      for (const client of clientList) {

        if ("focus" in client) {
          client.navigate(url);
          return client.focus();
        }

      }

      if (clients.openWindow) {
        return clients.openWindow(url);
      }

    })
  );

});

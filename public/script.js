const eventSource = new EventSource("/events");

eventSource.onmessage = function (event) {
  if (event.data === "reload") {
    window.location.reload();
  }
};

(function () {
  "use strict";

  document.querySelectorAll("[data-visitor-map]").forEach(function (map) {
    var image = map.querySelector(".visitor-map-image");
    var frame = map.querySelector(".visitor-map-frame");
    var status = map.querySelector("[data-visitor-map-status]");
    if (!image || !frame || !status) return;
    var timeout;

    function update(state) {
      map.setAttribute("data-map-state", state);
      frame.setAttribute("aria-busy", state === "loading" ? "true" : "false");
      if (state === "error") status.textContent = "Visitor map is temporarily unavailable.";
      if (state !== "loading") window.clearTimeout(timeout);
    }

    function loaded() {
      // Treat a provider's empty tracking pixel as unavailable, too.
      update(image.naturalWidth >= 100 && image.naturalHeight >= 50 ? "ready" : "error");
    }

    image.addEventListener("load", loaded);
    image.addEventListener("error", function () { update("error"); });
    if (image.complete) {
      loaded();
    } else {
      update("loading");
      timeout = window.setTimeout(function () { update("error"); }, 12000);
    }
  });
})();

window.PROMPTDECK_ADSENSE = Object.freeze({
  // Fallback for deployments without the admin-settings API. Runtime admin settings take precedence.
  // A valid client with no slots enables the Google CMP/Auto ads tag without reserving banner space.
  enabled: true,
  client: "",
  slots: Object.freeze([
    "", // Desktop left and mobile slot
    ""  // Desktop right slot
  ])
});

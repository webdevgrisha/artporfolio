// The entry of the built server would start a server of its own: the function is the server.
// firebase.js imports this module first, so it runs before the entry reads the variable.
process.env.ASTRO_NODE_AUTOSTART = "disabled";

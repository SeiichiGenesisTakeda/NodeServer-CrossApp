(function(e) {

  if (!e) {
    console.log("No exports object in Node.js.");
    return;
  }

  e.conf = {
    update: new Date(Date.now()).toUTCString(),
    version: "1.0.0",
    path: "/Users/SeiichiTakeda/Dropbox/public_html/test.arice.in/node/cron/public_html",
    port: {
      http: 80,
      https: 443
    },
    domain: "127.0.0.1",
    key: "/server.key",
    cert: "/server.crt",
    ca: "/server.csr",
    expires : 60 * 60 * 24 * 365,
    //expires: 10,
    cache_flag: ":cache",
  };

})(exports);

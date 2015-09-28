var http = require("http");
var fs = require("fs");
var url = require("url");
var extension = require("./module/extension.js");
var optimizer = require("./module/optimizer.js");

//var EXPIRES = 60 * 60 * 24 * 365;
var EXPIRES = 10;
var CACHE_FLAG = ":cache";

var getEtag = function(stats) {
  return "'" + stats.size + '-' + Number(stats.mtime) + "'";
}

var getLastModified = function(stats) {
  return stats.mtime.toUTCString();
}


http.createServer(function(req, res) {

  var infoHeader = {
    "Server": "Shenglong Optimization System",
    "X-Powered-By": "NodeJS",
    "X-XSS-Protection": "1; mode=block",
    "X-Frame-Options": "SAMEORIGIN",
    "Content-Type": "text/plain",
    "Cache-Control": "public, max-age:" + EXPIRES,
    "Expires": new Date(Date.now() + EXPIRES * 1000).toUTCString()
  };

  var pathname = __dirname;
  var location = url.parse(req.url);
  pathname += location.pathname;
  pathname += (location.pathname.substr(location.pathname.length - 1, 1) == "/") ? "index.html" : "";

  var flagUpdate = false;

  var publishCompressFile = function(pathname) {
    res.writeHead(200, infoHeader);
    var rs = fs.createReadStream(pathname);
    var data = "";
    rs.on("data", function(chunk) {
      data += chunk;
    }).on("end", function() {
      optimizer.compressFile(data, pathname);
      console.log("End pipe Event");
    });
    console.log("Prepare pipe");
    rs.pipe(res);
    console.log("End pipe");
    return 1;
  };

  fs.stat(pathname, function(err, stats) {

    if (err) {
      res.writeHead(404, infoHeader);
      res.end();
      //console.log("Orignal File 404:" + pathname);
      return;
    }

    var extObject = extension.getContentTypeFromExt(pathname);
    infoHeader["Content-Type"] = extObject.mimeType;
    var etag = getEtag(stats);
    infoHeader["ETag"] = etag;
    var lastModified = getLastModified(stats);
    infoHeader["Last-Modified"] = lastModified;

    if (req.headers["if-none-match"]) {
      if (req.headers["if-none-match"] == etag + CACHE_FLAG) {
        res.writeHead(304, infoHeader);
        res.end();
        //console.log("Cache File 304:" + pathname);
        return;
      } else if(req.headers["if-none-match"].indexOf(CACHE_FLAG) > -1){
        flagUpdate = true;
      }
    }

    switch (extObject.extention) {
      case "html":
      case "htm":
      case "js":
      case "css":
      case "manifest":
        var gzipPathname = pathname + ".gz";
        fs.stat(gzipPathname, function(err, stats) {

          if (err || flagUpdate) {
            publishCompressFile(pathname);
            //console.log("No Gzip File 200:" + pathname);
          } else {
            infoHeader["Content-Encoding"] = "gzip";
            infoHeader["ETag"] += CACHE_FLAG;
            res.writeHead(200, infoHeader);
            var rs = fs.createReadStream(gzipPathname);
            rs.pipe(res);
            //console.log("Gzip File 200:" + pathname);
          }

        });
        break;
      case "jpeg":
      case "jpg":
      case "gif":
      case "png":
      case "ico":
      default:
        infoHeader["ETag"] += CACHE_FLAG;
        res.writeHead(200, infoHeader);
        var rs = fs.createReadStream(pathname);
        rs.pipe(res);
    }


  });

}).listen(1111, "127.0.0.1");

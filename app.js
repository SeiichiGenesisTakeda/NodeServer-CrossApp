(function() {

  var conf = require("./settings").conf;
  if (!conf) {
    console.log("No settings.js file");
    return;
  } else {
    console.log("Shenglong v." + conf.version + "-" + conf.update);
  }

  var spdy = require("spdy");
  var http = require("http");
  var fs = require("fs");
  var url = require("url");
  var extension = require("./module/extension");
  var optimizer = require("./module/optimizer");

  var pathname = conf.path || __dirname;

  var option = {
    key: fs.readFileSync(__dirname + conf.key),
    cert: fs.readFileSync(__dirname + conf.cert),
    ca: fs.readFileSync(__dirname + conf.ca)
  };

  var getEtag = function(stats) {
    return stats.size + '-' + Number(stats.mtime);
  }

  var getLastModified = function(stats) {
    return stats.mtime.toUTCString();
  }


  var serverHttp = http.createServer(function(req, res) {
    var infoHeader = {
      "Server": "Shenglong Optimization System",
      "X-Powered-By": "NodeJS",
      "X-XSS-Protection": "1; mode=block",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age:" + conf.expires,
      "Expires": new Date(Date.now() + conf.expires * 1000).toUTCString()
    };

    var location = url.parse(req.url);
    var targetPath = pathname + location.pathname;
    targetPath += (location.pathname.substr(location.pathname.length - 1, 1) == "/") ? "/index.html" : "";

    var flagUpdate = false;

    var publishCompressFile = function(pathname) {
      res.writeHead(200, infoHeader);
      var rs = fs.createReadStream(pathname, conf);
      var data = "";
      rs.on("data", function(chunk) {
        data += chunk;
      }).on("end", function() {
        optimizer.compressFile(data, pathname);
      });
      rs.pipe(res);
      return 1;
    };

    fs.stat(targetPath, function(err, stats) {

      if (err) {
        res.writeHead(404, infoHeader);
        res.end();
        return;
      }

      var extObject = extension.getContentTypeFromExt(targetPath);
      infoHeader["Content-Type"] = extObject.mimeType;
      var etag = getEtag(stats);
      infoHeader["ETag"] = etag;
      var lastModified = getLastModified(stats);
      infoHeader["Last-Modified"] = lastModified;

      if (req.headers["if-none-match"]) {
        if (req.headers["if-none-match"] == etag + conf.cache_flag) {
          infoHeader["Vary"] = "Accept-Encoding";
          res.writeHead(304, infoHeader);
          res.end();
          return;
        } else if (req.headers["if-none-match"].indexOf(conf.cache_flag) > -1) {
          flagUpdate = true;
        }
      } else {
        //console.log("No etag");
        //console.log(req.headers["if-none-match"]);
        //console.log(etag + settings.conf.cache_flag);        
      }

      switch (extObject.extention) {
        case "html":
        case "htm":
        case "js":
        case "css":
        case "scss":
        case "manifest":
          infoHeader["Content-Type"] += "; charset=utf-8";
          var gzipPathname = targetPath + ".gz";
          fs.stat(gzipPathname, function(err, stats) {
            req.setEncoding("utf8");
            if (err || flagUpdate) {
              publishCompressFile(targetPath);
            } else {
              infoHeader["Content-Encoding"] = "gzip";
              infoHeader["Vary"] = "Accept-Encoding";              
              infoHeader["ETag"] += conf.cache_flag;
              res.writeHead(200, infoHeader);
              var rs = fs.createReadStream(gzipPathname);
              rs.pipe(res);
            }

          });
          break;
        case "jpeg":
        case "jpg":
        case "gif":
        case "png":
        case "ico":
        default:
          infoHeader["ETag"] += conf.cache_flag;
          res.writeHead(200, infoHeader);
          var rs = fs.createReadStream(targetPath);
          rs.pipe(res);
      }

    });
  }).listen(conf.port.http, conf.domain);

  var serverHttps = spdy.createServer(option, function(req, res) {

    var infoHeader = {
      "Server": "Shenglong Optimization System",
      "X-Powered-By": "NodeJS",
      "X-XSS-Protection": "1; mode=block",
      "X-Frame-Options": "SAMEORIGIN",
      "Content-Type": "text/plain",
      "Cache-Control": "public, max-age:" + conf.expires,
      "Expires": new Date(Date.now() + conf.expires * 1000).toUTCString()
    };

    var location = url.parse(req.url);
    var targetPath = pathname + location.pathname;
    targetPath += (location.pathname.substr(location.pathname.length - 1, 1) == "/") ? "/index.html" : "";

    var flagUpdate = false;

    var publishCompressFile = function(pathname) {
      res.writeHead(200, infoHeader);
      var rs = fs.createReadStream(pathname);
      var data = "";
      rs.on("data", function(chunk) {
        data += chunk;
      }).on("end", function() {
        optimizer.compressFile(data, pathname);
      });
      rs.pipe(res);
      return 1;
    };

    fs.stat(targetPath, function(err, stats) {

      if (err) {
        res.writeHead(404, infoHeader);
        res.end();
        return;
      }

      var extObject = extension.getContentTypeFromExt(targetPath);
      infoHeader["Content-Type"] = extObject.mimeType;
      var etag = getEtag(stats);
      infoHeader["ETag"] = etag;
      var lastModified = getLastModified(stats);
      infoHeader["Last-Modified"] = lastModified;

      if (req.headers["if-none-match"]) {
        if (req.headers["if-none-match"] == etag + conf.cache_flag) {
          infoHeader["Vary"] = "Accept-Encoding";
          res.writeHead(304, infoHeader);
          res.end();
          return;
        } else if (req.headers["if-none-match"].indexOf(conf.cache_flag) > -1) {
          flagUpdate = true;
        }
      } else {
        //console.log("No etag");
        //console.log(req.headers["if-none-match"]);
        //console.log(etag + settings.conf.cache_flag);        
      }

      switch (extObject.extention) {
        case "html":
        case "htm":
        case "js":
        case "css":
        case "manifest":
          var gzipPathname = targetPath + ".gz";
          fs.stat(gzipPathname, function(err, stats) {

            if (err || flagUpdate) {
              publishCompressFile(targetPath);
            } else {
              infoHeader["Content-Encoding"] = "gzip";
              infoHeader["Vary"] = "Accept-Encoding";              
              infoHeader["ETag"] += conf.cache_flag;
              res.writeHead(200, infoHeader);
              var rs = fs.createReadStream(gzipPathname);
              rs.pipe(res);
            }

          });
          break;
        case "jpeg":
        case "jpg":
        case "gif":
        case "png":
        case "ico":
        default:
          infoHeader["ETag"] += conf.cache_flag;
          res.writeHead(200, infoHeader);
          var rs = fs.createReadStream(targetPath);
          rs.pipe(res);
      }

    });
  }).listen(conf.port.https, conf.domain);

})();

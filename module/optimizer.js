module.exports = module.exports || {};

console.log('optimizer module load!');

var htmlminifier = require("html-minifier");
var cheerio = require('cheerio');
var fs = require("fs");
var zlib = require("zlib");
var util = require('util');
var CleanCSS = require("clean-css");
var UglifyJS = require("uglify-js");

var optimizer = function() {


  //var SUCCESS = 1;
  //var FALSE = 0;
  //var ERROR = -1;

  var minifiedPreExtention = "min";
  var gzipedExtention = "gz";

  var pathname;
  var pathDirectories;
  var fileName;
  var fileParts;
  var fileTitle;
  var fileExtention;

  var detectFileInfo = function(path) {

    if (!path) {
      return 0;
    }

    try {
      pathname = path;
      pathDirectories = path.split("/");
      fileName = pathDirectories[pathDirectories.length - 1];
      fileParts = fileName.split(".");
      fileTitle = fileParts[0];
      fileExtention = fileParts[1];
    } catch (e) {
      console.log(e);
      return -1;
    }

    return 1;
  }

  var saveFile = function(data, path) {

    if (!path || !data) {
      return 0;
    }

    var ws = fs.createWriteStream(path);
    ws.on('error', function(e) {
      console.log('write: ' + e);
    });
    ws.on('close', function() {

    });
    ws.write(data);
    ws.end();
    return 1;
  }

  return {
    compressGzip: function(data, path) {

      if (!path || !data) {
        return 0;
      }

      zlib.gzip(data, function(err, binary) {
        saveFile(binary, path);
      });

      return 1;
    },
    compressFileToGzip: function(orgFile) {

      if (!orgFile) {
        return 0;
      }

      var inFile = fs.createReadStream(orgFile);
      var outFile = fs.createWriteStream(orgFile + "." + gzipedExtention);
      var gzip = zlib.createGzip();
      inFile.pipe(gzip).pipe(outFile);

    },
    addScriptForAppManifest: function(data) {

      return 1;

    },
    adjustPosition: function(data) {

      var $ = cheerio.load(data);
      //$("html").attr("manifest", fileTitle + ".manifest");
      var $css = $("body [rel=stylesheet]");
      $css.each(function(i, elem) {
        $("head").append($(this));
      });
      var $css = $("body style");
      $css.each(function(i, elem) {
        $("head").append($(this));
      });
      var $script = $("script[class=onHead]");
      $script.each(function(i, elem) {
        $("head").append($(this));
      });
      var $script = $("script[class=onBody]");
      $script.each(function(i, elem) {
        $("body").append($(this));
      });

      var dataManifest = "CACHE MANIFEST\n";
      dataManifest += "# Version : " + new Date(Date.now()).toUTCString() + "\n";
      dataManifest += "CACHE:\n";
      var $cache = $(".CACHE");
      $cache.each(function(i, elem) {
        if (elem.attribs.src) {
          dataManifest += elem.attribs.src + "\n";
        }else if(elem.attribs.href){
          dataManifest += elem.attribs.href + "\n";
        }
        $(elem).removeClass("CACHE");
      });

      dataManifest += "NETWORK:\n";
      var $cache = $(".NETWORK");
      $cache.each(function(i, elem) {
        if (elem.attribs.src) {
          dataManifest += elem.attribs.src + "\n";
        }else if(elem.attribs.href){
          dataManifest += elem.attribs.href + "\n";
        }
        $(elem).removeClass("NETWORK");
      });

      dataManifest += "FALLBACK:\n";
      var $cache = $(".FALLBACK");
      $cache.each(function(i, elem) {
        if (elem.attribs.src) {
          dataManifest += elem.attribs.src + "\n";
        }else if(elem.attribs.href){
          dataManifest += elem.attribs.href + "\n";
        }
        $(elem).removeClass("FALLBACK");
      });

      //console.log(dataManifest);
      saveFile(dataManifest, pathname + ".manifest");

      data = $.html();

      return data;
    },
    compressImg: function(data, path) {

      if (path) {
        var ret = detectFileInfo(path);
        if (ret != 1) {
          console.log("detectFile status : " + ret);
          return 0;
        }
      }

      //var minifiedFileName = pathname.replace(fileName, fileTitle + "." + minifiedPreExtention + "." + fileExtention);
      //saveFile(data, minifiedFileName);
      var gzipedFileName = pathname + "." + gzipedExtention;
      this.compressGzip(data, gzipedFileName);

    },
    compressHtml: function(data, path) {

      if (path) {
        var ret = detectFileInfo(path);
        if (ret != 1) {
          console.log("detectFile status : " + ret);
          return 0;
        }
      }

      data = this.adjustPosition(data);

      data = htmlminifier.minify(data, {
        removeComments: true,
        removeCommentsFromCDATA: true,
        collapseWhitespace: true,
        collapseBooleanAttributes: true,
        removeAttributeQuotes: true,
        removeEmptyAttributes: true,
      });

      var minifiedFileName = pathname.replace(fileName, fileTitle + "." + minifiedPreExtention + "." + fileExtention);
      saveFile(data, minifiedFileName);

      var gzipedFileName = pathname + "." + gzipedExtention;
      this.compressGzip(data, gzipedFileName);

      console.log("file done");

      return 1;

    },
    compressCss: function(data, path) {

      if (path) {
        var ret = detectFileInfo(path);
        if (ret != 1) {
          console.log("detectFile status : " + ret);
          return 0;
        }
      }

      data = new CleanCSS().minify(data).styles;
      var minifiedFileName = pathname.replace(fileName, fileTitle + "." + minifiedPreExtention + "." + fileExtention);
      saveFile(data, minifiedFileName);

      var gzipedFileName = pathname + "." + gzipedExtention;
      this.compressGzip(data, gzipedFileName);

      return 1;

    },
    compressJs: function(data, path) {

      if (path) {
        var ret = detectFileInfo(path);
        if (ret != 1) {
          console.log("detectFile status : " + ret);
          return 0;
        }
      }

      var result = UglifyJS.minify(pathname);
      data = result.code;
      //console.log(data);
      var minifiedFileName = pathname.replace(fileName, fileTitle + "." + minifiedPreExtention + "." + fileExtention);
      saveFile(data, minifiedFileName);

      var gzipedFileName = pathname + "." + gzipedExtention;
      this.compressGzip(data, gzipedFileName);

      return 1;

    },
    compressFile: function(data, path) {

      if (path) {
        var ret = detectFileInfo(path);
        if (ret != 1) {
          console.log("detectFile status : " + ret);
          return 0;
        }
      }

      switch (fileExtention) {
        case "html":
          this.compressHtml(data);
          break;
        case "css":
          this.compressCss(data);
          break;
        case "js":
          this.compressJs(data);
          break;
        case "svg":
        case "manifest":
          this.compressFileToGzip(path);
        default:
      }
      return 1;
    }
  };
}();

module.exports = optimizer;

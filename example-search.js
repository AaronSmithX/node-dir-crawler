const fs = require('fs');
const path = require('path');
const DirCrawler = require('./');
const reportProgress = require('./report-progress');

// Initialize result file
let resultFile = path.resolve('./__report.txt');
fs.writeFileSync(resultFile, ''); // Clear result always

// Logs a found item and whether it is a directory or a file
// (Simplified - assumes all items are files or directories)
function logResult(itemPath, stats) {
  let type = stats.isDirectory() ? 'DIR' : 'FILE';
  let message = `[${type}]\t${itemPath}\n`;
  fs.appendFileSync(resultFile, message);
}

// Logs the number of items in a directory
function logDirCount(itemPath) {
  let contentsArray = fs.readdirSync(itemPath);
  let displayNum = ('0000'+contentsArray.length).substring(contentsArray.length);
  let message = `[${displayNum}]\t${itemPath}\n`;
  fs.appendFileSync(resultFile, message);
}

// Compile Regular Expressions once
let fileMatcher = /\.txt$|\.md$/;
let dirMatcher = /subfolder/i;
let dirSkipper = /node_modules/i;

// Initialize crawler
let dirCrawler = new DirCrawler({
    fileMatch: function(itemPath, stats, context, tracker) {
        return fileMatcher.test(itemPath);
    },
    dirMatch: function(itemPath, stats, context, tracker) {
        return dirMatcher.test(itemPath);
    },
    dirIgnore: function(itemPath, stats, context, tracker) {
        return dirSkipper.test(itemPath);
    },
    maxDepth: 20,
    fileMatched: function(itemPath, stats, context, tracker) {
        logResult(itemPath, stats);
    },
    dirMatched: function(itemPath, stats, context, tracker) {
        logResult(itemPath, stats);
    },
    postFile: function(itemPath, stats, context, tracker) {
        // Take no additional action on files
    },
    postDir: function(itemPath, stats, context, tracker) {
        reportProgress(tracker);
    },
});

(async () => {
  // Can operate on as many directories as you like
  let targetDirs = ['./']; 
  for (let targetDir of targetDirs) await dirCrawler.crawl(targetDir);
})();

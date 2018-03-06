// Console progress reporting
function reportProgress(tracker) {

    let {
        startTime,
        dirCount,
        dirSkips,
        dirFinds,
        fileCount,
        fileFinds,
        currentDepth,
        crawler,
    } = tracker;

    let {
        fileMatch,
        dirMatch,
        dirIgnore,

        maxDepth,

        fileMatched,
        dirMatched,

        postFile,
        postDir,
    } = crawler;

    let report =
        'DIRECTORY CRAWL PROGRESS\n\n' +
        `Time Elapsed:\t${Math.round((Date.now().valueOf() - startTime) / 1000)} seconds\n\n` +
        `${dirCount}\t directories checked\n` +
        `${dirFinds}\t directories matched\n` +
        `${dirSkips}\t directories skipped\n` +
        `${fileCount}\t files checked\n` +
        `${fileFinds}\t files matched\n` +
        `${currentDepth}\t directories deep\n\n` +
        'CURRENT OPTIONS\n\n' +
        // `Dir Matcher:\t${dirMatch}\n` +
        // `Dir Skipper:\t${dirIgnore}\n` +
        // `File Matcher:\t${fileMatch}\n` +
        `Max Depth:\t${maxDepth}`;

    drawConsoleFrame(report);
}

function drawConsoleFrame(str) {
    process.stdout.write('\033c' + str + '\n');
}

module.exports = reportProgress;

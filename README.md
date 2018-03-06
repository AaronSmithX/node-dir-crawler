# Node Directory Crawler

Crawls a given directory and invokes provided callbacks at different hooks. Entirely `async`/`await` compatible. Allows precise control flow and well-defined interaction with the directory tree.

Especially suited for handling backups and code directories. Can be used to:
* index items (for later review or processing)
* search for files or directories with specific qualities
* identify and handle duplicates
* remove extraneous items such as node_modules folders

## Quickstart
This example will find all .txt files and output a list:
```js
const DirCrawler = require('dir-crawler');
const path = require('path');

// Initialize the crawler
let dirCrawler = new DirCrawler({
  // Options. See other options below.
  fileMatch: async function(itemPath, stats, context, tracker) {
    return (path.parse(itemPath).ext === 'txt');
  },
  fileMatched: async function(itemPath, stats, context, tracker) {
    context.foundFiles.push(itemPath);
  },
});

// Awaitable/thenable
await dirCrawler.crawl('./target/directory', {
  // Initial Context. See below.
    foundFiles: []
  })
  .then((context, tracker) => {
    console.log(`${tracker.fileFinds} files found.`);
    
    let fileList = context.foundFiles.join('\n');
    fs.writeFileSync('found-files.txt', fileList);
  });
```

For a more thorough example, see `./example-search.js`.

## Available Options

Options are passed in a single `options` object to the `DirCrawler` constructor.

There are seven optional callbacks, described below, and a `maxDepth` option. The `maxDepth` option sets how deep into subdirectories the crawler should go. If the crawler reaches `maxDepth` levels deep, it will no longer delve into subdirectories.

The seven callbacks provide control flow and hooks:
* `options.fileMatch` can return `true` to consider the file a match. Results in `fileMatched` being called on the file. By default, no files will be matched.
* `options.dirMatch` can return `true` to consider the directory a match. Results in `dirMatched` being called on the directory. By default, no directory will be matched.
* `options.dirIgnore` can return `true` to skip the directory's contents. By default, no directory's contents will be skipped.
* `options.fileMatched` can take action on a matched file. By default, no action will be taken.
* `options.dirMatched` can take action on a matched directory. By default, no action will be taken.
* `options.postFile` can take action after a file has been inspected. It is now safe to rename, delete, etc.
* `options.postDir` can take action after a directory has been inspected. It is now safe to rename, delete, etc.

All callbacks have the same signature. If they are `async` functions (or return Promises), `DirCrawler` will `await` their resolution.

```js
/**
 * DirCrawler callback signature.
 * @itemPath the fully qualified path of the directory or file
 * @stats result of fs.statSync(itemPath)
 * @context see below
 * @tracker see below
 */
async function(itemPath, stats, context, tracker) {
  // May or may not be async
  await yourOwnAsyncLogic();
}
```

All callbacks receive a `context`, which is a plain JavaScript object that can hold and maintain any values while the crawler is working. An initial `context` object can be passed as the second argument to `DirCrawler.crawl`.

Callbacks also receive a `tracker`, which is used by the crawler to tally up how many files and directories have been matched or skipped. This should be considered a read-only object. It is exposed to allow progress reporting.

`DirCrawler.crawl()` resolves with an object containing both the context and tracker, allowing post-processing.

## Reporting

A `report-progress` function is included in a separate file. Use it to display ongoing `DirCrawler` progress in the console. It is used by the recipes below.

```js
const reportProgress = require('./report-progress');
```

## Example Use Cases

1. Search for files with a given name, extension, or other attribute. Write a text file report of the matches.
2. Rename all files matching a certain pattern (such as Windows File History backups).
3. Index all files and their sizes in a SQLite3 database or other store, then examine files of the same size to check for duplicates.
4. Delete all `node_modules` directories. Especially useful for copying an entire code directory across drives.
5. Copy the contents of one directory into another, skipping non-essential files and directories (like `/node-modules` and `/.git`). Useful when code is needed for demonstration purposes on another machine.

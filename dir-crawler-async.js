const fs = require('fs');
const path = require('path');

// Ability to crawl directory tree using callbacks to navigate, match items, and work with them
class DirCrawler
{
    constructor(opts) {

        // Callbacks are: (itemPath, stats, context, tracker) => Promise<boolean> || boolean
        // Return boolean for matching and ignoring
        // Return a Promise<Boolean> for async operations

        let {
            fileMatch, // a callback that returns true to include a file in flat index
            dirMatch, // a callback that returns true to include a directory (sans contents) in flat index
            dirIgnore, // a callback that returns true to skip a directory's contents

            maxDepth, // the maximum number of subdirectories to explore

            fileMatched, // a callback that is called after a file is identified as a match
            dirMatched, // a callback that is called after a directory is identified as a match

            postFile, // a callback that is called after a file has been inspected (so it is safe to rename, delete, etc.)
            postDir, // a callback that is called after a directory has been inspected (so it is safe to rename, delete, etc.)
        } = opts;

        this.fileMatch = fileMatch || (async () => false); // If not provided, no files will be matched
        this.dirMatch  = dirMatch  || (async () => false); // If not provided, no directories will be matched
        this.dirIgnore = dirIgnore || (async () => false); // If not provided, no directories will be skipped

        this.maxDepth = maxDepth || 5;
        
        this.fileMatched = fileMatched || (async a => a); // By default, nothing happens
        this.dirMatched  = dirMatched  || (async a => a); // By default, nothing happens

        this.postFile = postFile || (async a => a); // By default, nothing happens
        this.postDir  = postDir  || (async a => a); // By default, nothing happens
    }

    // From a root directory, read through all files and subdirectories, looking for items
    // Returns a Promise, as crawl recursively calls itself
    async crawl(directory, workingContext, workingTracker) {

        // Provided as a safe place for callbacks to store state
        const context = workingContext || {};

        // Used internally to track progress - available for reporting
        const tracker = workingTracker || {
            startTime: Date.now().valueOf(),
            dirCount: 0,
            dirSkips: 0,
            dirFinds: 0,
            fileCount: 0,
            fileFinds: 0,
            currentDepth: 0,
            crawler: this,
        };

        // Fully qualify directory path and read contents
        const dir = path.resolve(directory);
        let items = fs.readdirSync(dir);

        // Iterate each item in the directory
        for (let i = 0, l = items.length; i < l; i++) {
            let item = items[i];

            // Fully qualify the item's path and get its stats
            let itemPath = path.resolve(dir, item);
            let stats = fs.statSync(itemPath);

            // Work with directories
            if (stats.isDirectory()) {
                tracker.dirCount++;
                
                let dirMatch = await this.dirMatch(itemPath, stats, context, tracker);
                if (dirMatch) {
                    tracker.dirFinds++;
                    await this.dirMatched(itemPath, stats, context, tracker);
                }
                
                let dirIgnore = await this.dirIgnore(itemPath, stats, context, tracker);
                if (!dirIgnore) { // Ignore if filtered out
                    if (tracker.currentDepth < this.maxDepth) { // Skip if max depth reached
                        tracker.currentDepth++;
                        // crawl() MUST be async to account for multiple awaits within (otherwise nested crawl will jump ahead)
                        await this.crawl(itemPath, context, tracker); // Recurse only if not ignored
                        tracker.currentDepth--;
                    } else tracker.dirSkips++; // Count skipped if depth was provided (and thus exceeded here)
                } else tracker.dirSkips++; // Count skipped if filter was provided (and thus matched here)
            
                await this.postDir(itemPath, stats, context, tracker);
            }
            // Work with files
            else {
                tracker.fileCount++;
                
                let fileMatch = await this.fileMatch(itemPath, stats, context, tracker);
                if (fileMatch) {
                    tracker.fileFinds++;
                    await this.fileMatched(itemPath, stats, context, tracker);
                }

                await this.postFile(itemPath, stats, context, tracker);
            }
        }

        if (tracker.currentDepth === 0) await this.postDir(dir, fs.statSync(dir), context, tracker);

        // Return context and tracker for follow-up processing
        return Promise.resolve({ context, tracker });
    }
}

module.exports = DirCrawler;

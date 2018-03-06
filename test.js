import test from 'ava';
import DirCrawler from './';
import fs from 'fs';
import path from 'path';

test('Find files by extension (.txt)', async t => {
  let dirCrawler = new DirCrawler({
    fileMatch: async function(itemPath, stats, context, tracker) {
      return (path.parse(itemPath).ext === '.txt');
    },
    fileMatched: async function(itemPath, stats, context, tracker) {
      context.foundFiles.push(itemPath);
    },
  });

  let { context } = await dirCrawler.crawl('./test-dir', {
    foundFiles: [],
  });
  
  t.is(context.foundFiles.length, 5);
});

test('Find files by content (contains string "node")', async t => {
  let dirCrawler = new DirCrawler({
    fileMatch: async function(itemPath, stats, context, tracker) {
      let contents = fs.readFileSync(itemPath, 'utf8');
      return contents.indexOf('node') > -1;
    },
    fileMatched: async function(itemPath, stats, context, tracker) {
      let contents = fs.readFileSync(itemPath, 'utf8');
      context.foundFileContents.push(contents);
    },
  });

  let { context } = await dirCrawler.crawl('./test-dir', {
    foundFileContents: [],
  });
  
  t.is(context.foundFileContents.length, 2);
  t.is(context.foundFileContents[1], 'This file contains the word node.');
});

test('See and match all files', async t => {
  let dirCrawler = new DirCrawler({
    fileMatch: async function(itemPath, stats, context, tracker) {
      return true;
    },
  });

  let { tracker } = await dirCrawler.crawl('./test-dir');
  
  t.is(tracker.fileCount, 11);
  t.is(tracker.fileFinds, 11);
});

test('Skip directory by name (contains "skip")', async t => {
  let dirCrawler = new DirCrawler({
    dirIgnore: async function(itemPath, stats, context, tracker) {
      return /\w*skip\w*$/.test(itemPath);
    },
  });

  let { tracker } = await dirCrawler.crawl('./test-dir');
  
  t.is(tracker.fileCount, 7); // 7 means 4 were skipped correctly
});

test('Skip directory by file count (3+)', async t => {
  let dirCrawler = new DirCrawler({
    dirIgnore: async function(itemPath, stats, context, tracker) {
      return fs.readdirSync(itemPath)
        .filter(item => {
          let absPath = path.resolve(itemPath, item);
          return fs.statSync(absPath).isFile();
        }).length >= 3;
    },
  });

  let { tracker } = await dirCrawler.crawl('./test-dir');
  
  t.is(tracker.fileCount, 6); // 6 means 5 were skipped correctly
});

test('Skip directory when maxDepth reached (2+)', async t => {
  let dirCrawler = new DirCrawler({
    // Means the crawler will only enter directories that are the 1st
    // subdirectory of the target root directory
    // In other words, it will see its own files and subdirectories,
    // which are treated as level-1 items, and it will see
    // the contents of those level-1 subdirectories,
    // But it will not enter level-2 subdirectories
    // maxDepth zero means it would not delve into any subdirectories
    maxDepth: 1,
  });

  let { tracker } = await dirCrawler.crawl('./test-dir');

  t.is(tracker.fileCount, 7); // 7 means 4 were skipped correctly
});
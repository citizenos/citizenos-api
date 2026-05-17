#!/usr/bin/env node
'use strict';

/**
 * Splits test/api/topic.js into per-feature test files.
 *
 * Structure of topic.js:
 *   Lines 1-1357:   Shared API helper functions + module.exports
 *   Lines 1358-1415: Test-only imports (chai, supertest, models, etc.)
 *   Lines 1416-9012: suite('Users') { suite('Topics') { ... } }
 *     1445-1548:    Create
 *     1550-1999:    Read
 *     2001-2166:    Update
 *     2168-2219:    Delete
 *     2221-3048:    List
 *     3051-3636:    Members
 *     3638-4642:    Invites  (Users/invites sub-suite)
 *     4644-5000:    Join     (accidentally nested inside Invites braces)
 *     5003-8257:    Votes
 *     8260-8289:    Mentions (suite.skip)
 *     8292-8634:    Attachments
 *     8637-9011:    Reports
 *   Lines 9013-10142: suite('Topics') { ... }  <- public/unauth endpoints
 *
 * Output files in test/api/:
 *   topic-crud.js                  Create + Read + Update + Delete
 *   topic-list.js                  List
 *   topic-members.js               Members
 *   topic-invites.js               Invites (Users)
 *   topic-join.js                  Join
 *   topic-votes.js                 Votes
 *   topic-attachments-reports.js   Mentions(skip) + Attachments + Reports
 *   topic-public.js                Public suite('Topics') unauthenticated endpoints
 */

const fs = require('fs');
const path = require('path');

const SRC = path.join(__dirname, '../test/api/topic.js');
const OUT_DIR = path.join(__dirname, '../test/api');

const raw = fs.readFileSync(SRC, 'utf8');
const lines = raw.split('\n');

// Helper: get lines [from, to] (1-indexed, inclusive) as a string
function getLines(from, to) {
    return lines.slice(from - 1, to).join('\n');
}

// Shared preamble: helper functions + module.exports (lines 1-1357)
const HELPERS = getLines(1, 1357);

// Test-only imports block (lines 1358-1415)
const IMPORTS = getLines(1358, 1415);

// The monkey-patch setup for cosSignature and etherpadClient that wraps all Topics suites
const TOPICS_SETUP = `
    let originalCreateVoteFiles;
    let originalGetHTMLAsync;

    suiteSetup(function () {
        // Store original if it exists
        originalGetHTMLAsync = etherpadClient.getHTMLAsync;

        originalCreateVoteFiles = cosSignature.createVoteFiles;
        cosSignature.createVoteFiles = async function () {
            return Promise.resolve();
        };
    });

    suiteTeardown(function () {
        cosSignature.createVoteFiles = originalCreateVoteFiles;
        if (originalGetHTMLAsync) {
            etherpadClient.getHTMLAsync = originalGetHTMLAsync;
        }
    });
`;

// Wrap content in Users > Topics suite
function wrapUserTopics(content) {
    return `// API - /api/users*
suite('Users', function () {

    suiteSetup(async function () {
        return shared.syncDb();
    });

    // API - /api/users/:userId/topics*
    suite('Topics', function () {
${TOPICS_SETUP}
${content}
    });

});
`;
}

// Build file content: helpers + imports + wrapped suites
function makeFile(suitesContent) {
    return [
        HELPERS,
        '',
        IMPORTS,
        '',
        wrapUserTopics(suitesContent),
    ].join('\n');
}

// ─── Define splits ────────────────────────────────────────────────────────────

const splits = [
    {
        file: 'topic-crud.js',
        comment: '// topic-crud.js - Create, Read, Update, Delete',
        // Create: 1445-1548, Read: 1550-1999, Update: 2001-2166, Delete: 2168-2219
        content: () => [
            getLines(1445, 1548),
            '',
            getLines(1550, 1999),
            '',
            getLines(2001, 2166),
            '',
            getLines(2168, 2219),
        ].join('\n'),
    },
    {
        file: 'topic-list.js',
        comment: '// topic-list.js - Topic list endpoints',
        // List: 2221-3048
        content: () => getLines(2221, 3048),
    },
    {
        file: 'topic-members.js',
        comment: '// topic-members.js - Topic member management',
        // Members: 3051-3636
        content: () => getLines(3051, 3636),
    },
    {
        file: 'topic-invites.js',
        comment: '// topic-invites.js - Topic invite flows',
        // Invites outer suite opens at 3638; its Users sub-content ends at 4642
        // We extract 3638-4642 (the full Invites suite block, minus Join/Votes which
        // were accidentally nested — we close Invites properly here)
        content: () => getLines(3638, 4642),
    },
    {
        file: 'topic-join.js',
        comment: '// topic-join.js - Topic join-via-token',
        // Join: 4644-5000
        content: () => getLines(4644, 5000),
    },
    {
        file: 'topic-votes.js',
        comment: '// topic-votes.js - Voting flows (soft + hard auth)',
        // Votes: 5003-8257
        content: () => getLines(5003, 8257),
    },
    {
        file: 'topic-attachments-reports.js',
        comment: '// topic-attachments-reports.js - Attachments, Reports, Mentions',
        // Mentions(skip): 8260-8289, Attachments: 8292-8634, Reports: 8637-9011
        content: () => [
            getLines(8260, 8289),
            '',
            getLines(8292, 8634),
            '',
            getLines(8637, 9011),
        ].join('\n'),
    },
];

// The public (unauthenticated) suite is a standalone top-level suite — no wrapping needed
const publicSplit = {
    file: 'topic-public.js',
    comment: '// topic-public.js - Public unauthenticated topic endpoints',
    // suite('Topics') at line 9015 through end (10142)
    content: () => getLines(9015, 10142),
};

// ─── Write files ─────────────────────────────────────────────────────────────

for (const split of splits) {
    const body = makeFile(split.content());
    const filePath = path.join(OUT_DIR, split.file);
    fs.writeFileSync(filePath, `'use strict';\n${split.comment}\n\n${body}\n`);
    const lines_ = body.split('\n').length;
    console.log(`✓ ${split.file}  (${lines_} lines)`);
}

// Public split: helpers + imports + standalone suite
const publicBody = [
    HELPERS,
    '',
    IMPORTS,
    '',
    `// API - /api/topics - unauthenticated endpoints`,
    publicSplit.content(),
].join('\n');

fs.writeFileSync(
    path.join(OUT_DIR, publicSplit.file),
    `'use strict';\n${publicSplit.comment}\n\n${publicBody}\n`,
);
console.log(`✓ ${publicSplit.file}`);

console.log('\nDone. Original topic.js preserved. Update Gruntfile.js to add new workers.');

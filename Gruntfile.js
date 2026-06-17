'use strict';

/**
 * Builds a mocha command for a single test file running against its own database.
 *
 * Each worker database is named citizenos_test_<workerName>.
 * The base connection string is derived from DATABASE_URL by replacing the db name.
 * Before running parallel tests, create the databases once with:
 *   bash scripts/test-parallel-setup.sh
 *
 * @param {string} workerName - Short identifier, e.g. 'auth', 'topic'
 * @param {string} file       - Path relative to repo root, e.g. 'test/api/auth.js'
 */
function parallelTestCmd(workerName, file) {
    // Replace the DB name segment in DATABASE_URL with the worker-specific DB.
    // sed replaces the last path component: .../citizenos -> .../citizenos_test_auth
    const dbSwap = `$(echo "$DATABASE_URL" | sed 's|/[^/]*$|/citizenos_test_${workerName}|')`;
    return [
        `NODE_ENV=test`,
        `FORCE_DB_SYNC=0`,
        `NODE_TLS_REJECT_UNAUTHORIZED=0`,
        `DATABASE_URL="${dbSwap}"`,
        `./node_modules/.bin/mocha`,
        `--expose-gc`,
        `--async-only`,
        `--check-leaks`,
        `--trace-deprecation`,
        `--reporter spec`,
        `--ui tdd`,
        file,
    ].join(' ');
}

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concurrent: {
            dev: {
                tasks: ['exec:start', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            },
            // Run all API test files in parallel, each against its own database.
            // Prerequisites: run `bash scripts/test-parallel-setup.sh` once first.
            test: {
                tasks: [
                    'exec:test_auth',
                    'exec:test_topic_attachments_reports',
                    'exec:test_topic_crud',
                    'exec:test_topic_invites',
                    'exec:test_topic_join',
                    'exec:test_topic_list',
                    'exec:test_topic_members',
                    'exec:test_topic_public',
                    'exec:test_topic_votes',
                    'exec:test_group',
                    'exec:test_discussion',
                    'exec:test_ideation',
                    'exec:test_user',
                    'exec:test_search',
                    'exec:test_activity',
                    'exec:test_partner',
                    'exec:test_invite',
                    'exec:test_upload',
                ],
                options: {
                    logConcurrentOutput: true,
                    limit: 6 // cap parallel processes to avoid overwhelming postgres/CI
                }
            }
        },
        exec: {
            start: { cmd: 'npm start' },
            test: { cmd: 'npm test' },

            // Per-file parallel test workers
            test_auth: { cmd: parallelTestCmd('auth', 'test/api/auth.js') },
            test_topic_attachments_reports: { cmd: parallelTestCmd('topic_attachments_reports', 'test/api/topic-attachments-reports.js') },
            test_topic_crud: { cmd: parallelTestCmd('topic_crud', 'test/api/topic-crud.js') },
            test_topic_invites: { cmd: parallelTestCmd('topic_invites', 'test/api/topic-invites.js') },
            test_topic_join: { cmd: parallelTestCmd('topic_join', 'test/api/topic-join.js') },
            test_topic_list: { cmd: parallelTestCmd('topic_list', 'test/api/topic-list.js') },
            test_topic_members: { cmd: parallelTestCmd('topic_members', 'test/api/topic-members.js') },
            test_topic_public: { cmd: parallelTestCmd('topic_public', 'test/api/topic-public.js') },
            test_topic_votes: { cmd: parallelTestCmd('topic_votes', 'test/api/topic-votes.js') },
            test_group: { cmd: parallelTestCmd('group', 'test/api/group.js') },
            test_discussion: { cmd: parallelTestCmd('discussion', 'test/api/discussion.js') },
            test_ideation: { cmd: parallelTestCmd('ideation', 'test/api/ideation.js') },
            test_user: { cmd: parallelTestCmd('user', 'test/api/user.js') },
            test_search: { cmd: parallelTestCmd('search', 'test/api/search.js') },
            test_activity: { cmd: parallelTestCmd('activity', 'test/api/activity.js') },
            test_partner: { cmd: parallelTestCmd('partner', 'test/api/partner.js') },
            test_invite: { cmd: parallelTestCmd('invite', 'test/api/invite.js') },
            test_upload: { cmd: parallelTestCmd('upload', 'test/api/upload.js') },
        },
        eslint: {
            dev: {
                src: ['**/*.js', '!node_modules/**', '!actions-runner/**', '!docs/**', '!coverage/**', '!dist/**', '!build/**']
            }
        },
        plantuml: {
            dev: {
                src: ['docs/src/schematics/*.puml'],
                dest: 'docs/imgs/schematics',
                options: {
                    format: 'svg'
                }
            }
        },
        markdown_toc: {
            dev: {
                src: ['./README.md']
            }
        },
        watch: {
            eslint: {
                files: ['**/*.js', '!node_modules/**'],
                tasks: ['eslint']
            },
            plantuml: {
                files: ['docs/src/schematics/**'],
                tasks: ['plantuml']
            },
            markdown_toc: {
                files: ['./README.md'],
                tasks: ['markdown_toc'],
                options: {
                    debounceDelay: 5000
                }
            }
        }
    });

    // Load the plugins
    grunt.loadNpmTasks('grunt-eslint');
    grunt.loadNpmTasks('grunt-contrib-watch');
    grunt.loadNpmTasks('grunt-concurrent');
    grunt.loadNpmTasks('grunt-exec');
    grunt.loadNpmTasks('grunt-plantuml');

    // Default task(s).
    grunt.registerTask('default', ['concurrent:dev']);
    grunt.registerTask('start', ['concurrent:dev']);
    grunt.registerTask('test', ['exec:test']);
    grunt.registerTask('test:parallel', ['concurrent:test']);
    grunt.registerTask('docs', ['plantuml:dev', 'markdown_toc:dev']);

};


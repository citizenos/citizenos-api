'use strict';

module.exports = function (grunt) {

    // Project configuration.
    grunt.initConfig({
        pkg: grunt.file.readJSON('package.json'),
        concurrent: {
            dev: {
                tasks: ['exec:start', 'mustache_render:dev', 'watch'],
                options: {
                    logConcurrentOutput: true
                }
            }
        },
        exec: {
            start: {
                cmd: 'npm start'
            },
            test: {
                cmd: 'npm test'
            }
        },
        eslint: {
            dev: {
                src: ['**/*.js', '!node_modules/**']
            }
        },
        mustache_render: {
            dev: {
                // TODO: Automatic discovery for new templates?
                files: [
                    {
                        expand: true,
                        src: 'views/emails/languages/*.json',
                        template: 'views/emails/accountVerification.mu',
                        dest: 'views/emails/build/',
                        extDot: 'first',
                        ext: '.mu',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + 'accountVerification_' + src;
                        }
                    },
                    {
                        expand: true,
                        src: 'views/emails/languages/*.json',
                        template: 'views/emails/passwordReset.mu',
                        dest: 'views/emails/build/',
                        extDot: 'first',
                        ext: '.mu',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + 'passwordReset_' + src;
                        }
                    },
                    {
                        expand: true,
                        src: 'views/emails/languages/*.json',
                        template: 'views/emails/inviteGroup.mu',
                        dest: 'views/emails/build/',
                        extDot: 'first',
                        ext: '.mu',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + 'inviteGroup_' + src;
                        }
                    },
                    {
                        expand: true,
                        src: 'views/emails/languages/*.json',
                        template: 'views/emails/inviteTopic.mu',
                        dest: 'views/emails/build/',
                        extDot: 'first',
                        ext: '.mu',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + 'inviteTopic_' + src;
                        }
                    },
                    {
                        expand: true,
                        src: 'views/emails/languages/*.json',
                        template: 'views/emails/reportCommentCreator.mu',
                        dest: 'views/emails/build/',
                        extDot: 'first',
                        ext: '.mu',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + 'reportCommentCreator_' + src;
                        }
                    },
                    {
                        expand: true,
                        src: 'views/emails/languages/*.json',
                        template: 'views/emails/reportCommentModerator.mu',
                        dest: 'views/emails/build/',
                        extDot: 'first',
                        ext: '.mu',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + 'reportCommentModerator_' + src;
                        }
                    },
                    {
                        expand: true,
                        src: 'views/emails/languages/*.json',
                        template: 'views/emails/inviteTopic_rahvaalgatus.ee.mu',
                        dest: 'views/emails/build/',
                        extDot: 'first',
                        ext: '.mu',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + 'inviteTopic_rahvaalgatus.ee_' + src;
                        }
                    },
                    {
                        expand: true,
                        src: 'views/emails/languages/*.json',
                        template: 'views/emails/inviteTopic_uuseakus.rahvaalgatus.ee.mu',
                        dest: 'views/emails/build/',
                        extDot: 'first',
                        ext: '.mu',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + 'inviteTopic_uuseakus.rahvaalgatus.ee_' + src;
                        }
                    },
                    {
                        expand: true,
                        src: 'views/emails/languages/et.json',
                        template: 'views/emails/governmentNotification.mu',
                        dest: 'views/emails/build/',
                        extDot: 'first',
                        ext: '.mu',
                        flatten: true,
                        rename: function (dest, src) {
                            return dest + 'governmentNotification_' + src;
                        }
                    }
                ]
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
            emails: {
                files: ['views/emails/**/*.mu', '!views/emails/build/**'],
                tasks: ['mustache_render']
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
    grunt.loadNpmTasks('grunt-mustache-render');
    grunt.loadNpmTasks('grunt-plantuml');
    grunt.loadNpmTasks('grunt-markdown-toc');

    // Default task(s).
    grunt.registerTask('default', ['concurrent:dev']);
    grunt.registerTask('start', ['concurrent:dev']);
    grunt.registerTask('test', ['exec:test']);
    grunt.registerTask('docs', ['plantuml:dev', 'markdown_toc:dev']);

};

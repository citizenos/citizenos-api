'use strict';

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
    grunt.loadNpmTasks('grunt-markdown-toc');

    // Default task(s).
    grunt.registerTask('default', ['concurrent:dev']);
    grunt.registerTask('start', ['concurrent:dev']);
    grunt.registerTask('test', ['exec:test']);
    grunt.registerTask('docs', ['plantuml:dev', 'markdown_toc:dev']);

};

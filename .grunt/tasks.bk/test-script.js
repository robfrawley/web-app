// .grunt/tasks/default.js

module.exports = function(grunt) {
  grunt.registerTask('test-script', ['jshint:script', 'jshint:grunt', 'jscs:script', 'jscs:grunt']);
};

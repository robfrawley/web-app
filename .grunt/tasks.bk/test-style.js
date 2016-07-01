// .grunt/tasks/default.js

module.exports = function(grunt) {
  grunt.registerTask('test-style', ['compile-style', 'lesslint']);
};

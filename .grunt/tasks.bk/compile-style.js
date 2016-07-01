// .grunt/tasks/default.js

module.exports = function(grunt) {
  grunt.registerTask('compile-css', ['scss', 'autoprefixer', 'cssmin', 'csscomb', 'decomment:style', 'decomment:style', 'usebanner:style']);
};

/*
 After you have changed the settings at "Your code goes here",
 run this with one of these options:
  "grunt" alone creates a new, completed images directory
  "grunt clean" removes the images directory
  "grunt responsive_images" re-processes images without removing the old ones
*/

module.exports = function(grunt) {

    grunt.initConfig({
      responsive_images: {
        dev: {
          options: {
            engine: 'im',
            sizes: [
            {
                width: 640,
                suffix: '_medium_2x',
                quality: 60
            }, {
                width: 320,
                suffix: '_small_2x',
                quality: 60
            },{
                width: 320,
                suffix: '_medium_1x',
                quality: 60
            }, {
                width: 160,
                suffix: '_small_1x',
                quality: 60
            }
          ]
          },
  
          /*
          You don't need to change this part if you don't change
          the directory structure.
          */
          files: [{
            expand: true,
            src: ['*.{gif,jpg,png}'],
            cwd: 'img/',
            dest: 'responsive-images/'
          }]
        }
      },
  
      /* Clear out the images directory if it exists */
      clean: {
        dev: {
          src: ['responsive-images/'],
        },
      },
  
      /* Generate the images directory if it is missing */
      mkdir: {
        dev: {
          options: {
            create: ['responsive-images/']
          },
        },
      },
  
      /* Copy the "fixed" images that don't go through processing into the images/directory */
      copy: {
        dev: {
          files: [{
            expand: true,
            src: 'images_src/fixed/*.{gif,jpg,png}',
            dest: 'images/'
          }]
        },
      },
    });
    
    grunt.loadNpmTasks('grunt-responsive-images');
    grunt.loadNpmTasks('grunt-contrib-clean');
    grunt.loadNpmTasks('grunt-contrib-copy');
    grunt.loadNpmTasks('grunt-mkdir');
    grunt.registerTask('default', ['clean', 'mkdir', 'copy', 'responsive_images']);
  
  };
  
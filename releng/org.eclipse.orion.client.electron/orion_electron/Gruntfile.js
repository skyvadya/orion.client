module.exports = function(grunt) {

  // configure the tasks
  grunt.initConfig({
  	clean: ['out/**/*'],
  	copy: {
  		copycore: {
  			files: [{
  				cwd: '../../../bundles/org.eclipse.orion.client.core/web',
  				src: ['**/*'],
  				dest: 'out/',
  				expand: true
  			}],
  			options: {
  				dot: true
  			}
  		},
  		copyeditor: {
  			files: [{
  				cwd: '../../../bundles/org.eclipse.orion.client.editor/web',
  				src: ['**/*'],
  				dest: 'out/',
  				expand: true
  			}],
  			options: {
  				dot: true
  			}
  		},
  		copyjavascript: {
  			files: [{
  				cwd: '../../../bundles/org.eclipse.orion.client.javascript/web',
  				src: ['**/*'],
  				dest: 'out/',
  				expand: true
  			}],
  			options: {
  				dot: true
  			}
  		},
  		copyui: {
  			files: [{
  				cwd: '../../../bundles/org.eclipse.orion.client.ui/web',
  				src: ['**/*'],
  				dest: 'out/',
  				expand: true
  			}],
  			options: {
  				dot: true
  			}
  		},
  		copyhelp: {
  			files: [{
  				cwd: '../../../bundles/org.eclipse.orion.client.help/web',
  				src: ['**/*'],
  				dest: 'out/',
  				expand: true
  			}],
  			options: {
  				dot: true
  			}
  		},
  		copygit: {
  			files: [{
  				cwd: '../../../bundles/org.eclipse.orion.client.git/web',
  				src: ['**/*'],
  				dest: 'out/',
  				expand: true
  			}],
  			options: {
  				dot: true
  			}
  		},
  		copywebtools: {
  			files: [{
  				cwd: '../../../bundles/org.eclipse.orion.client.webtools/web',
  				src: ['**/*'],
  				dest: 'out/',
  				expand: true
  			}],
  			options: {
  				dot: true
  			}
  		},
  		copyusers: {
  			files: [{
  				cwd: '../../../bundles/org.eclipse.orion.client.users/web',
  				src: ['**/*'],
  				dest: 'out/',
  				expand: true
  			}],
  			options: {
  				dot: true
  			}
  		},
  		fix_bidiUtils: {
  			files: [{
  				cwd: './electronFixing',
  				src: ['bidiUtils.js'],
  				dest: 'out/orion/',
  				expand: true
  			}],
  			options: {
  				dot: true
  			}
  		},
      fix_electron_xhr: {
        files: [{
          cwd: './electronFixing',
          src: ['xhr.js'],
          dest: 'out/orion/',
          expand: true
        }],
        options: {
          dot: true
        }
      },
      fix_electron_require: {
        files: [{
          cwd: './electronFixing',
          src: ['index.html'],
          dest: 'out/',
          expand: true
        }],
        options: {
          dot: true
        }
      },
  	},

  });

  // load the tasks
  grunt.loadNpmTasks('grunt-contrib-copy');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.registerTask('default',['clean','copy']);
  // define the tasks
};
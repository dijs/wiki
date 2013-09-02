module.exports = function(grunt) {

  grunt.initConfig({
    
    pkg: grunt.file.readJSON("package.json"),
    
    uglify: {
      options: {
        banner: "/*! <%= pkg.name %> <%= grunt.template.today(\"yyyy-mm-dd\") %> */\n",
      },
      build: {
        files: {
          "./build/wiki.min.js": ["./build/wiki.js"]
        }
      }
    },
    
    clean: {
      build: ["build"]
    },

    exec: {
      createBuildDir: {
        cmd: "mkdir -p build"
      },
      compile: {
        stdout: false,
        cmd: "kal -o build/ src/*.kal"
      },
      compileTests: {
        stdout: false,
        cmd: "kal -o test/ test/*.kal"
      }
    },

    mochaTest: {
      test: {
        options: {
          reporter: "spec",
          timeout: 15000
        },
        src: "test/*.js"
      }
    },

    bump: {
      options: {
        files: ["package.json"],
        commit: false,
        createTag: false,
        push: false
      }
    }

  });

  grunt.loadNpmTasks("grunt-contrib-uglify");
  grunt.loadNpmTasks("grunt-contrib-clean");
  grunt.loadNpmTasks("grunt-mocha-test");
  grunt.loadNpmTasks("grunt-exec");
  grunt.loadNpmTasks("grunt-bump");

  grunt.registerTask("init", ["clean:build", "exec:createBuildDir"]);
  grunt.registerTask("compile", ["exec:compile", "uglify"]);
  grunt.registerTask("test", ["exec:compileTests", "mochaTest"]);
  grunt.registerTask("default", ["init", "compile", "test"]);

};
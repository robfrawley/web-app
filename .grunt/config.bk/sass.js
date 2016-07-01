module.exports = {
  sass: {
    "options": {
      "includePaths": [
        "./web/assets/src/stylesheets/",
        "./web/components/bootstrap-sass/assets/stylesheets/"
      ],
      "precision": 12,
      "sourceMap": true,
      "outFile": "./web/assets/out/stylesheets/<%= pkg.name %>.css.map"
    },
    "all": {
      "src": "./web/assets/src/stylesheets/<%= pkg.name %>.scss",
      "dest": "./web/assets/out/stylesheets/<%= pkg.name %>.css"
    }
  }
};
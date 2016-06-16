var DocGen = require('../../node_modules/react-docgen/dist/main');
var gulp = require('gulp');
var gutil = require('gulp-util');

var del = require('del');
var dir = require('node-dir');
var mkdirp = require("mkdirp")
var fs = require("fs")
var path = require('path');

var conf = {
  src: [
    'src',
    //'src/**/*.js',
    //'src/**/*.jsx'
  ],
  output: "docs\\docs.json",
  extension:['js','jsx'],
  ignoreDir:null
};

function stringOfLength(string, length) {
  var newString = '';
  for (var i = 0; i < length; i++) {
    newString += string;
  }
  return newString;
}

function generateTitle(name, filepath) {
  var title = '`' + name + '` (component)';
  return title + '\n'
    + stringOfLength('=', title.length) + '\n'
    + '[view code](../' + filepath.replace(/\\/ig,'/') + ')';
}

function generateDesciption(description) {
  return description + '\n';
}

function generatePropType(type) {
  var values;
  if (Array.isArray(type.value)) {
    values = '(' +
      type.value.map(function(typeValue) {
        return typeValue.name || typeValue.value;
      }).join('|') +
      ')';
  } else {
    values = type.value;
  }

  return 'type: `' + type.name + (values ? values: '') + '`\n';
}

function generatePropDefaultValue(value) {
  return 'defaultValue: `' + value.value + '`\n';
}

function generateProp(propName, prop) {
  return (
    '### `' + propName + '`' + (prop.required ? ' (required)' : '') + '\n' +
    '\n' +
    (prop.description ? prop.description + '\n\n' : '') +
    (prop.type ? generatePropType(prop.type) : '') +
    (prop.defaultValue ? generatePropDefaultValue(prop.defaultValue) : '') +
    '\n'
  );
}

function generateProps(props) {
  var title = 'Props';

  return (
    title + '\n' +
    stringOfLength('-', title.length) + '\n' +
    '\n' +
    Object.keys(props || {}).sort().map(function(propName) {
      return generateProp(propName, props[propName]);
    }).join('\n')
  );
}

function generateMarkdown(name, reactAPI, key) {
  var markdownString =
    generateTitle(name, key) + '\n' +
    generateDesciption(reactAPI.description) + '\n' +
    generateProps(reactAPI.props);

  return markdownString;
}


function getComponentName(filepath) {
  var name = path.basename(filepath);
  var ext;
  while ((ext = path.extname(name))) {
    name = name.substring(0, name.length - ext.length);
  }
  return name;
}

function getFilepaths(api) {
    var keys=[];
  for (k in api)
  {
    if (api.hasOwnProperty(k))
    {
        keys.push(k);
    }
  }
  keys.sort();
  return keys;
}
function buildDocs(api) {
  // api is an object keyed by filepath. We use the file name as component name.
  var keys = getFilepaths(api)
  for (var i=0;i<keys.length;i++) {
    var key = keys[i];
    var name = getComponentName(key);
    if(name.indexOf('/index') >=0 ) { continue; }
    try {

      var markdown = generateMarkdown(name, api[key], key);

      var filename = 'docs' + path.sep + name + '.md';
      //in a for loop, so keep it sync
      mkdirp.sync(path.dirname(filename));
      fs.writeFileSync(filename, markdown);
    }
    catch(ex) {
      console.log('Cant process ' + key)
    }
  }
  createIndexPage(keys);
}

var createIndexPage = function(docs) {
  var markdown = '# API Docs\n';
  for(var i=0;i<docs.length;i++) {
    var file = docs[i];
    markdown+='- [' + file + '](' + getComponentName(file) +'.md)\n'
  }
  fs.writeFileSync('docs\\readme.md', markdown);
}

var task = gulp.task("docs:markdown", ["docs:api"], function (done) {
  buildDocs(JSON.parse(fs.readFileSync(conf.output)));
  done();
});

var task = gulp.task("docs:api", function (done) {
  var res = {};
  traverseDir('src',res, function() {
    mkdirp.sync(path.dirname(conf.output));
    fs.writeFile(conf.output, JSON.stringify(res, null, 2), done);
  });
});


// Clean up
gulp.task('cleanDocs', del.bind(null, './docs'));
var task = gulp.task("apiDocs",["docs:markdown", "cleanDocs"])

var extensions = new RegExp('\\.(?:' + conf.extension.join('|') + ')$');
function traverseDir(path, result, done) {
  dir.readFiles(
    path,
    {
      match: extensions,
      excludeDir: conf.ignoreDir
    },
    function(error, content, filename, next) {
      if (error) {
        exitWithError(error);
      }
      try {
        result[filename] = DocGen.parse(content);
      } catch(error) {
        writeError(error, filename);
      }
      next();
    },
    function(error) {
      if (error) {
        writeError(error);
      }
      done();
    }
  );
}


function writeError(msg, path) {
  if (path) {
    //process.stderr.write('Error with path "' + path + '": ');
  }
  //process.stderr.write(msg + '\n');
}

module.exports = task;

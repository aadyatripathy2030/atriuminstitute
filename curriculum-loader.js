// Loads all curriculum data files (per-course question banks + extras +
// english-extras) into a single COURSES object so the server can iterate
// sections without the browser. Same vm-sandbox approach the
// tools/prebuild-lessons.js script uses; extracted here so the admin
// prebuild endpoint and any future server-side curriculum analysis can
// share it.

const fs = require('fs');
const path = require('path');
const vm = require('vm');

const ROOT = path.resolve(__dirname);

let _cached = null;

function loadCourses() {
  if (_cached) return _cached;
  const sandbox = { console, Object, Array };
  vm.createContext(sandbox);
  const files = fs.readdirSync(ROOT).filter(f => f.endsWith('-data.js'));
  const ordered = [
    ...files,
    'courses.js',
    'extras.js',
    'english-extras.js',
  ].filter(f => fs.existsSync(path.join(ROOT, f)));
  for (const f of ordered) {
    let src;
    try { src = fs.readFileSync(path.join(ROOT, f), 'utf8'); }
    catch { continue; }
    src = src.replace(/^(const|let)\s+([A-Z_][A-Z_0-9]*)\s*=/gm, 'this.$2 =');
    src = src.replace(/^(const|let)\s+COURSE\s*=/gm, 'this.COURSE =');
    src = src.replace(/^function\s+setCourse/gm, 'this.setCourse = function');
    src = src.replace(/^function\s+_addQ/gm, 'this._addQ = function');
    src = src.replace(/^function\s+_setCum/gm, 'this._setCum = function');
    src = src.replace(/^const\s+R\s*=/gm, 'this.R =');
    src = src.replace(/^const\s+W\s*=/gm, 'this.W =');
    try { vm.runInContext(src, sandbox, { filename: f }); }
    catch (e) { console.warn(`curriculum-loader: could not load ${f}: ${e.message}`); }
  }
  _cached = sandbox.COURSES || {};
  return _cached;
}

module.exports = { loadCourses };

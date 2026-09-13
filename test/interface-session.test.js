const test = require('node:test');
const assert = require('node:assert/strict');
const {readFileSync} = require('node:fs');
const {join} = require('node:path');

const html = readFileSync(join(__dirname, '..', 'index.html'), 'utf8');

test('les commandes de séance gardent leur ordre et leurs libellés compacts', () => {
  const controls = html.match(/<div class="sessionControls"[\s\S]*?<\/div>/)?.[0] || '';
  assert.match(controls, />Menu</);
  assert.match(controls, />Mode focus</);
  assert.match(controls, />Terminer</);
  assert.ok(controls.indexOf('>Menu<') < controls.indexOf('>Mode focus<'));
  assert.ok(controls.indexOf('>Mode focus<') < controls.indexOf('>Terminer<'));
  assert.doesNotMatch(html, /Vue guidée|Aide charge|Aide répétitions|Aide effort|>Aide<\/button>/);
});

test('le focus possède un contraste dédié et un verrouillage réentrant', () => {
  assert.match(html, /\.focus \.guidedPrimary[^}]*background:[^}]*!important[^}]*color:[^}]*!important/);
  assert.match(html, /\.focus \.guidedPrimary:disabled/);
  assert.match(html, /function lockPageForFocus\(\)[\s\S]*if\(focusScrollLock\) return/);
  assert.match(html, /function unlockPageForFocus\(\)[\s\S]*window\.scrollTo\(x,y\)/);
  assert.match(html, /guidedScroll[^}]*overflow-y:auto/);
});

test('la dernière séance utilise un détail accessible sans faux chevron à vide', () => {
  assert.match(html, /<details class="lastSessionDetails"/);
  assert.match(html, /<summary>Dernière séance enregistrée/);
  assert.match(html, /Aucune séance enregistrée/);
  assert.match(html, /host\.dataset\.sessionKey===panelKey && host\.querySelector\('details'\)\?\.open/);
});

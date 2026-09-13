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

test('le repos essentiel est visible dans la barre stable et protège le chrono actif', () => {
  assert.match(html, /guidedActionBar[\s\S]*guidedRestButton[\s\S]*guidedRestIcon[\s\S]*Repos[\s\S]*\$\{escapeHtml\(next\.rest\)\}/);
  const menu = html.match(/<details class="guidedMenu"[\s\S]*?<\/details>/)?.[0] || '';
  assert.doesNotMatch(menu, /Lancer le repos/);
  assert.match(html, /function startRestForSid\(sid\)[\s\S]*if\(rtState\.running\)\{ rtShow\(true\); syncRestTimerHost\(\); return; \}/);
});

test('le repos compact conserve sept cibles accessibles et le focus quatre commandes', () => {
  const timer = html.match(/<div class="rt" id="rt"[\s\S]*?<\/div>\s*<\/div>\s*<script/)?.[0] || '';
  for(const label of ['Retirer 15 secondes','Ajouter 15 secondes','Réinitialiser le chronomètre','Passer en mode compact','Désactiver le son','Fermer le chronomètre']){
    assert.match(timer, new RegExp(`aria-label="${label}"`));
  }
  assert.match(html, /\.rt \.rtA[^}]*grid-template-columns:repeat\(7,minmax\(44px,1fr\)\)/);
  assert.match(html, /\.focusRestDock \.rtA[^}]*grid-template-columns:repeat\(4,minmax\(44px,1fr\)\)/);
  assert.doesNotMatch(html, /Mode compact actif : la séance reste visible/);
});

test('C1 est un rappel saisissable sans effort ni progression automatique', () => {
  assert.match(html, /sid:'C1'[\s\S]*?sets:2,lo:8,hi:12,rest:'2 min'[\s\S]*?trackable:true,autoProgress:false,effortOptional:true/);
  assert.match(html, /actives=S\.slots\.filter\(x=>x\.trackable!==false\)/);
  assert.doesNotMatch(html, /if\(next\.note\)[\s\S]*simple fiche/);
  assert.match(html, /eff:\(did && !sd\.effortOptional\)\?eff:null/);
  assert.match(html, /slotDef\.autoProgress===false\?null:decideNext/);
});

test('la dernière séance utilise un détail accessible sans faux chevron à vide', () => {
  assert.match(html, /<details class="lastSessionDetails"/);
  assert.match(html, /<summary>Dernière séance enregistrée/);
  assert.match(html, /Aucune séance enregistrée/);
  assert.match(html, /host\.dataset\.sessionKey===panelKey && host\.querySelector\('details'\)\?\.open/);
});

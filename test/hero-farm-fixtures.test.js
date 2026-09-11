'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../hero-farm-core.js');
const {scenarios}=require('../fixtures/hero-farm-scenarios.js');

test('les cinq jeux de recette sont acceptés par le validateur courant',()=>{
  assert.deepEqual(Object.keys(scenarios),['newUser','existingStrength','hybridDraft','legacyEdges','pagination']);
  for(const fixture of Object.values(scenarios)) assert.doesNotThrow(()=>core.validateBackup(fixture));
});

test('le scénario de reprise hybride conserve identité, programme et emplacements vides',()=>{
  const storage=scenarios.hybridDraft.storage;
  const draft=JSON.parse(storage.paogramme_session_draft_v1);
  assert.equal(draft.sessionId,'fixture-draft-hybrid');
  assert.equal(draft.programMode,'hybrid');
  assert.deepEqual(draft.items[0].setReps,[10,9,null,null]);
  assert.equal(core.hasPriorUse({getItem:key=>storage[key]??null}),true);
});

test('un brouillon réellement vide reste exportable et restaurable',()=>{
  const fixture={schema:'hero-farm-backup',version:4,exportedAt:1,storage:{
    paogramme_session_draft_v1:JSON.stringify({version:2,sessionId:'draft-empty',letter:'A',programMode:'strength',items:[{
      sid:'A1',vid:'decline_machine',sets:4,unit:'kg',load:null,repsTot:null,setReps:[null,null,null,null]
    }]})
  }};
  assert.doesNotThrow(()=>core.validateBackup(fixture));
});

test('un ancien total agrégé explicite reste importable sans inventer ses séries',()=>{
  const legacy=JSON.parse(scenarios.legacyEdges.storage.paogramme_log_v2).find(entry=>entry.id==='fixture-legacy-total').items[0];
  assert.equal(legacy.legacyAggregate,true);assert.deepEqual(legacy.setReps,[]);
  assert.equal(core.performedSets(legacy),4);
  assert.doesNotThrow(()=>core.validateBackup(scenarios.legacyEdges));
});

test('les cas historiques difficiles et la treizième séance restent consultables',()=>{
  const edges=JSON.parse(scenarios.legacyEdges.storage.paogramme_log_v2);
  assert.equal(core.exerciseResults(edges,'pullup_assist::unit::kg (assistance)')[0].load,0);
  assert.equal(core.sessionSummary(edges.find(entry=>entry.id==='fixture-empty-middle-slot')).performed,3);
  assert.equal(core.sessionSummary(edges.find(entry=>entry.id==='fixture-legacy-total')).performed,4);
  const pages=core.paginate(core.sortedSessions(JSON.parse(scenarios.pagination.storage.paogramme_log_v2)),1,12);
  assert.equal(pages.items.length,12);assert.equal(pages.hasMore,true);
  assert.equal(core.paginate(core.sortedSessions(JSON.parse(scenarios.pagination.storage.paogramme_log_v2)),2,12).shown,15);
});

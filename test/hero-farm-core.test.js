const test=require('node:test');
const assert=require('node:assert/strict');
const core=require('../hero-farm-core.js');

class MemoryStorage{
  constructor(initial={},failAt=Infinity){this.data=new Map(Object.entries(initial));this.writes=0;this.failAt=failAt;}
  get length(){return this.data.size;} key(i){return [...this.data.keys()][i]??null;}
  getItem(k){return this.data.has(k)?this.data.get(k):null;}
  setItem(k,v){if(++this.writes===this.failAt)throw Error('quota');this.data.set(k,String(v));}
  removeItem(k){this.data.delete(k);}
}

test('les types de charge ne sont pas convertis entre variantes',()=>{
  assert.equal(core.comparableUnit('kg','kg par haltère'),false);
  assert.equal(core.comparableUnit('kg','kg (assistance)'),false);
  assert.equal(core.comparableUnit('kg par haltère','kg par haltère'),true);
  const own=core.suggestedStart({rp10:20,targetReps:10,nearbyLoad:60});
  assert.equal(own.source,'rp10'); assert.equal(own.load,20);
  assert.deepEqual(core.suggestedStart({nearbyLoad:60}),{load:null,source:'calibration'});
});
test('assistance tractions et dips descend avec plancher et libellé exact',()=>{
  for(const vid of ['pullup_assist','dip_assist']){
    const variant={vid,unit:'kg (assistance)',step:2};
    assert.equal(core.progressLoad(40,variant),38);
    assert.equal(core.progressLoad(0,variant),0);
    assert.equal(core.progressLabel(variant),'Assistance réduite');
    assert.equal(core.tonnage({unit:variant.unit,load:40,repsTot:32}),0);
  }
  assert.equal(core.progressLoad(0,{unit:'lest (kg)',step:2}),2);
});
test('validation stricte des répétitions et charges sans coercition dangereuse',()=>{
  for(const bad of [-1,1.5,'abc',Infinity]) assert.equal(core.validateReps(bad,{allowEmpty:false}).ok,false);
  assert.equal(core.validateReps('',{allowEmpty:true}).value,null);
  assert.equal(core.validateReps(0,{allowEmpty:false}).ok,false);
  assert.deepEqual(core.validateLoad('12.5','total'),{ok:true,value:12.5});
  assert.equal(core.validateLoad(-1,'assistance').ok,false);
  assert.equal(core.validateLoad(0,'total').ok,false);
  assert.equal(core.validateLoad(0,'lest').ok,true);
});
test('les séries réalisées excluent les champs vides et préservent les agrégats anciens',()=>{
  assert.equal(core.performedSets({sets:4,setReps:[10,10,'',null],repsTot:20}),2);
  assert.equal(core.performedSets({sets:4,repsTot:null}),0);
  assert.equal(core.performedSets({sets:4,repsTot:40}),4);
});
test('sauvegarde v4 complète, restauration fidèle et clés étrangères refusées',()=>{
  const source=new MemoryStorage({paogramme_log_v2:'[]',aura_farm_prefs_v1:'{"theme":"light"}',paogramme_session_draft_v1:'{"sessionId":"s1","items":[]}',foreign:'keep'});
  const backup=core.createBackup(source,123);
  assert.equal(backup.version,4); assert.equal(backup.storage.foreign,undefined);
  const target=new MemoryStorage({paogramme_log_v2:'[{"id":"old"}]',foreign:'untouched'});
  assert.equal(core.restoreBackup(target,backup).ok,true);
  assert.equal(target.getItem('aura_farm_prefs_v1'),'{"theme":"light"}');
  assert.equal(target.getItem('foreign'),'untouched');
  assert.throws(()=>core.validateBackup({...backup,storage:{foreign:'x'}}),/étrangère/);
});
test('JSON incomplet/version inconnue refusés avant mutation',()=>{
  const s=new MemoryStorage({paogramme_log_v2:'[]'}), before=s.getItem('paogramme_log_v2');
  assert.throws(()=>core.validateBackup({storage:{}}));
  assert.throws(()=>core.validateBackup({schema:'hero-farm-backup',version:99,storage:{}}),/Version/);
  assert.equal(s.getItem('paogramme_log_v2'),before);
});
test('migration v3 conserve seulement les faits disponibles sans inventer de records',()=>{
  const p=core.validateBackup({version:'v3',storage:{programMode:'hybrid',log:'[]',cfg:'{}',last:{last_x:'{"performedLoad":20}'},state:{},rp10:{}}});
  assert.equal(p.migratedFrom,'v3'); assert.equal(p.storage.records_x,undefined);
});
test('échec de restauration remet les anciennes données et fournit une copie récupérable',()=>{
  const s=new MemoryStorage({paogramme_log_v2:'[{"id":"old"}]'} ,3);
  const payload={schema:'hero-farm-backup',version:4,storage:{paogramme_log_v2:'[]',aura_farm_prefs_v1:'{}'}};
  const result=core.restoreBackup(s,payload);
  assert.equal(result.ok,false); assert.match(result.recovery,/old/);
  assert.match(s.getItem('paogramme_log_v2'),/old/);
});
test('fin de séance atomique logique: brouillon conservé en échec, double clic dédupliqué',()=>{
  const draft='{"sessionId":"session-1"}', s=new MemoryStorage({paogramme_log_v2:'[]',paogramme_session_draft_v1:draft});
  const entry={id:'session-1',items:[]};
  assert.deepEqual(core.commitSession(s,entry),{ok:true,duplicate:false});
  assert.equal(s.getItem('paogramme_session_draft_v1'),null);
  assert.equal(core.commitSession(s,entry).duplicate,true);
  assert.equal(JSON.parse(s.getItem('paogramme_log_v2')).length,1);
  const broken=new MemoryStorage({paogramme_log_v2:'[]',paogramme_session_draft_v1:draft},1);
  assert.equal(core.commitSession(broken,entry).ok,false);
  assert.equal(broken.getItem('paogramme_session_draft_v1'),draft);
});
test('quatre séries de dix ne produisent aucun calcul e1RM dans le noyau',()=>{
  assert.equal('e1RM' in core,false);
  assert.equal(core.tonnage({unit:'kg',load:60,repsTot:40}),2400);
});
test('deux programmes ne confondent pas leur dernière séance A',()=>{
  const log=[{id:'s',letter:'A',programMode:'strength',ts:20},{id:'h',letter:'A',programMode:'hybrid',ts:10}];
  assert.equal(core.latestSession(log,'A','strength').id,'s');
  assert.equal(core.latestSession(log,'A','hybrid').id,'h');
});
test('la fusion répétée reste idempotente',()=>{
  const row={id:'csv-A-2026-01-01-1000'};
  const once=core.mergeUniqueEntries([], [row]);
  assert.equal(core.mergeUniqueEntries(once,[row]).length,1);
});

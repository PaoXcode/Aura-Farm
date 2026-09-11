(function(root, factory){
  const api=factory();
  if(typeof module==='object' && module.exports) module.exports=api;
  root.HFCore=api;
})(typeof globalThis!=='undefined'?globalThis:this, function(){
  'use strict';
  const BACKUP_VERSION=4;
  const EXACT_KEYS=new Set([
    'paogramme_log_v2','paogramme_cfg_v2','paogramme_active_session_v1','paogramme_session_draft_v1',
    'aurafarm_program_mode_v1','aura_farm_prefs_v1','paogramme_rt_state_v1','paogramme_rt_view_v1',
    'paogramme_rt_sound_v1','paogramme_recovery_backup_v1','onb_done_v5','rebuild_done_v1',
    'hero_farm_profile_v1','hero_farm_setup_v1'
  ]);
  const PREFIXES=['last_','state_','rp10_','records_','eff_'];
  const isAllowedKey=k=>typeof k==='string' && (EXACT_KEYS.has(k)||PREFIXES.some(p=>k.startsWith(p)));
  const chargeKind=unit=>{
    const u=String(unit||'').toLowerCase();
    if(u==='reps') return 'bodyweight';
    if(u.includes('assistance')) return 'assistance';
    if(u.includes('lest')) return 'lest';
    if(u.includes('par haltère')) return 'per_dumbbell';
    return 'total';
  };
  const comparableUnit=(a,b)=>chargeKind(a)===chargeKind(b) && String(a||'')===String(b||'');
  function validateReps(value,{allowEmpty=true}={}){
    if(value===''||value==null) return allowEmpty?{ok:true,value:null}:{ok:false,error:'Répétitions requises.'};
    const n=Number(value);
    if(!Number.isFinite(n)||!Number.isInteger(n)||n<0) return {ok:false,error:'Entre un nombre entier positif de répétitions.'};
    if(n===0) return {ok:false,error:'Une série à zéro répétition n’est pas réalisée.'};
    return {ok:true,value:n};
  }
  function validateLoad(value,kind,{allowEmpty=false}={}){
    if(value===''||value==null) return allowEmpty?{ok:true,value:null}:{ok:false,error:'Charge requise.'};
    const n=Number(value);
    if(!Number.isFinite(n)) return {ok:false,error:'Entre une charge numérique finie.'};
    if(n<0) return {ok:false,error:'La charge ne peut pas être négative.'};
    if(n===0 && !['lest','assistance'].includes(kind)) return {ok:false,error:'La charge doit être supérieure à zéro.'};
    return {ok:true,value:n};
  }
  function performedSets(item){
    if(Array.isArray(item?.setReps)&&item.setReps.length) return item.setReps.filter(x=>validateReps(x,{allowEmpty:false}).ok).length;
    if(Array.isArray(item?.setReps)&&!item.legacyAggregate) return 0;
    return item?.repsTot>0 ? (Number.isInteger(item.performedSets)?item.performedSets:(Number.isInteger(item.sets)?item.sets:0)) : 0;
  }
  function tonnage(item){
    if(chargeKind(item?.unit)==='assistance'||chargeKind(item?.unit)==='bodyweight') return 0;
    return Number.isFinite(item?.load)&&item.load>=0&&Number.isFinite(item?.repsTot)&&item.repsTot>0?item.load*item.repsTot:0;
  }
  function progressLoad(load, variant){
    if(!Number.isFinite(load)) return null;
    const step=Number.isFinite(variant?.step)?variant.step:Math.max(.5,Math.round(load*(variant?.pct||0)/100*2)/2);
    return chargeKind(variant?.unit)==='assistance'?Math.max(0,load-step):load+step;
  }
  function progressLabel(variant){ return chargeKind(variant?.unit)==='assistance'?'Assistance réduite':'CHARGE +'; }
  function suggestedStart({sameVariantLoad=null,rp10=null,targetReps=10}={}){
    if(Number.isFinite(sameVariantLoad)) return {load:sameVariantLoad,source:'history'};
    if(Number.isFinite(rp10)&&rp10>0){
      const reps=Math.max(1,Math.round(targetReps));
      return {load:rp10*(1+10/30)/(1+reps/30),source:'rp10'};
    }
    return {load:null,source:'calibration'};
  }
  const RECOVERY_KEY='paogramme_recovery_backup_v1';
  function collect(storage){ const out={}; for(let i=0;i<storage.length;i++){const k=storage.key(i);if(k!==RECOVERY_KEY&&isAllowedKey(k)) out[k]=storage.getItem(k);} return out; }
  const plainObject=x=>!!x&&typeof x==='object'&&!Array.isArray(x);
  const finiteOrNull=x=>x==null||Number.isFinite(x);
  function normalizeName(value){return String(value??'').trim().slice(0,30);}
  function validateProfile(value){
    if(!plainObject(value)||value.version!==1||typeof value.name!=='string'||value.name.length>30) throw new Error('Profil local invalide');
  }
  function validateSetup(value){
    if(!plainObject(value)||value.version!==1||![1,2,3].includes(value.step)||value.completed!=null&&typeof value.completed!=='boolean'||value.program!=null&&!['strength','hybrid'].includes(value.program)||typeof value.name!=='string'||value.name.length>30) throw new Error('Configuration de démarrage invalide');
  }
  function validateItem(item,where){
    if(!plainObject(item)) throw new Error(`${where} : exercice invalide`);
    for(const name of ['sid','vid']) if(typeof item[name]!=='string'||!item[name]||!/^[\w.:-]+$/u.test(item[name])) throw new Error(`${where} : ${name} manquant ou dangereux`);
    if(item.unit!=null&&!['kg','kg par haltère','kg (assistance)','lest (kg)','reps'].includes(item.unit)) throw new Error(`${where} : unité invalide`);
    for(const name of ['sets','lo','hi']) if(item[name]!=null&&(!Number.isInteger(item[name])||item[name]<0)) throw new Error(`${where} : ${name} invalide`);
    if(!finiteOrNull(item.load)||item.load<0) throw new Error(`${where} : charge invalide`);
    if(!finiteOrNull(item.repsTot)||item.repsTot<0||!Number.isInteger(item.repsTot)) throw new Error(`${where} : total de répétitions invalide`);
    if(item.setReps!=null){
      if(!Array.isArray(item.setReps)||item.setReps.some(r=>!Number.isInteger(r)||r<=0)) throw new Error(`${where} : séries invalides`);
      if(item.repsTot!=null&&item.setReps.reduce((a,b)=>a+b,0)!==item.repsTot) throw new Error(`${where} : total incohérent avec les séries`);
    }
    if(item.eff!=null&&!['EASY','OK','HARD'].includes(item.eff)) throw new Error(`${where} : effort invalide`);
  }
  function validateLog(value){
    const entries=Array.isArray(value)?value:(plainObject(value)?Object.values(value):null);
    if(!entries) throw new Error('Journal invalide : une liste de séances est attendue');
    const ids=new Set();
    entries.forEach((entry,i)=>{
      if(!plainObject(entry)||typeof entry.id!=='string'||!entry.id||!/^[\w.:-]+$/u.test(entry.id)||ids.has(entry.id)) throw new Error(`Journal : identifiant de séance invalide à l’index ${i}`);
      ids.add(entry.id);
      if(!Number.isFinite(entry.ts)||entry.ts<0) throw new Error(`Journal : date invalide pour ${entry.id}`);
      if(typeof entry.letter!=='string'||!entry.letter) throw new Error(`Journal : séance invalide pour ${entry.id}`);
      if(entry.programMode!=null&&!['strength','hybrid'].includes(entry.programMode)) throw new Error(`Journal : programme invalide pour ${entry.id}`);
      if(!Array.isArray(entry.items)) throw new Error(`Journal : exercices invalides pour ${entry.id}`);
      entry.items.forEach((item,j)=>validateItem(item,`Journal ${entry.id}, exercice ${j+1}`));
    });
  }
  function validateDraft(value){
    if(Array.isArray(value)){value.forEach((x,i)=>validateItem(x,`Brouillon, exercice ${i+1}`));return;}
    if(!plainObject(value)||!Array.isArray(value.items)) throw new Error('Brouillon invalide');
    if(value.sessionId!=null&&(typeof value.sessionId!=='string'||!value.sessionId)) throw new Error('Brouillon : identifiant invalide');
    if(value.letter!=null&&typeof value.letter!=='string') throw new Error('Brouillon : séance invalide');
    if(value.programMode!=null&&!['strength','hybrid'].includes(value.programMode)) throw new Error('Brouillon : programme invalide');
    value.items.forEach((x,i)=>validateItem(x,`Brouillon, exercice ${i+1}`));
  }
  function validateStoredValue(k,v){
    if(typeof v!=='string') throw new Error(`Valeur invalide pour ${k}`);
    if(k==='aurafarm_program_mode_v1'&&!['strength','hybrid'].includes(v)) throw new Error('Programme invalide');
    if(k==='paogramme_active_session_v1'&&!/^[\w.-]*$/u.test(v)) throw new Error('Séance active invalide');
    if(k==='paogramme_rt_view_v1'&&!['full','compact'].includes(v)) throw new Error('Vue du chronomètre invalide');
    if(k==='paogramme_rt_sound_v1'&&!['0','1'].includes(v)) throw new Error('Son du chronomètre invalide');
    if(['onb_done_v5','rebuild_done_v1'].includes(k)&&v!=='1') throw new Error(`Indicateur invalide pour ${k}`);
    let parsed;
    if(/^(paogramme_log_v2|paogramme_cfg_v2|paogramme_session_draft_v1|aura_farm_prefs_v1|paogramme_rt_state_v1|hero_farm_profile_v1|hero_farm_setup_v1|last_|state_|records_|eff_|rp10_)/.test(k)) try{parsed=JSON.parse(v)}catch{throw new Error(`JSON invalide pour ${k}`)}
    if(k==='paogramme_log_v2') validateLog(parsed);
    else if(k==='paogramme_session_draft_v1') validateDraft(parsed);
    else if(k==='paogramme_cfg_v2' && (!plainObject(parsed)||Object.values(parsed).some(x=>typeof x!=='string'))) throw new Error('Configuration invalide');
    else if(k==='aura_farm_prefs_v1' && (!plainObject(parsed)||(parsed.theme!=null&&!['system','light','dark'].includes(parsed.theme))||(parsed.motion!=null&&typeof parsed.motion!=='boolean'))) throw new Error('Préférences invalides');
    else if(k==='hero_farm_profile_v1') validateProfile(parsed);
    else if(k==='hero_farm_setup_v1') validateSetup(parsed);
    else if(k.startsWith('eff_')&&!['EASY','OK','HARD'].includes(parsed)) throw new Error(`Effort invalide pour ${k}`);
    else if(k.startsWith('rp10_')&&(!Number.isFinite(parsed)||parsed<=0)) throw new Error(`Référence invalide pour ${k}`);
    else if(/^(last_|state_|records_)/.test(k)&&!plainObject(parsed)) throw new Error(`État dérivé invalide pour ${k}`);
  }
  function createBackup(storage,now=Date.now()){return {schema:'hero-farm-backup',version:BACKUP_VERSION,exportedAt:now,storage:collect(storage)};}
  function migrateBackup(payload){
    if(!payload||typeof payload!=='object'||Array.isArray(payload)) throw new Error('Sauvegarde incomplète');
    if(payload.schema==='hero-farm-backup'){
      if(payload.version!==BACKUP_VERSION) throw new Error('Version de sauvegarde non prise en charge');
      if(!payload.storage||typeof payload.storage!=='object'||Array.isArray(payload.storage)) throw new Error('Stockage manquant');
      return payload;
    }
    if(payload.version==='v3'&&payload.storage&&typeof payload.storage==='object'){
      const s=payload.storage, flat={};
      if(s.log!=null) flat.paogramme_log_v2=s.log;
      if(s.cfg!=null) flat.paogramme_cfg_v2=s.cfg;
      flat.aurafarm_program_mode_v1=s.programMode==='hybrid'?'hybrid':'strength';
      for(const group of ['last','state','rp10']) for(const [k,v] of Object.entries(s[group]||{})) flat[k]=v;
      return {schema:'hero-farm-backup',version:BACKUP_VERSION,migratedFrom:'v3',exportedAt:payload.exportedAt||null,storage:flat};
    }
    throw new Error('Format ou version de sauvegarde non pris en charge');
  }
  function validateBackup(payload){
    const p=migrateBackup(payload), keys=Object.keys(p.storage);
    if(!keys.length && p.empty!==true) throw new Error('Sauvegarde vide non explicitement déclarée');
    for(const k of keys){if(k===RECOVERY_KEY||!isAllowedKey(k)) throw new Error(`Clé étrangère refusée : ${k}`);validateStoredValue(k,p.storage[k]);}
    return p;
  }
  function restoreBackup(storage,payload){
    const p=validateBackup(payload), old=collect(storage), recovery=JSON.stringify({schema:'hero-farm-recovery',version:1,status:'prepared',backup:createBackup(storage)});
    try{storage.setItem(RECOVERY_KEY,recovery);if(storage.getItem(RECOVERY_KEY)!==recovery)throw Error('Vérification de la copie de récupération impossible');}catch(error){return {ok:false,error,recoveryAvailable:false,restored:false};}
    try{
      for(const k of Object.keys(old)) storage.removeItem(k);
      for(const [k,v] of Object.entries(p.storage)) storage.setItem(k,v);
      for(const [k,v] of Object.entries(p.storage)) if(storage.getItem(k)!==v) throw new Error(`Vérification impossible pour ${k}`);
      storage.removeItem(RECOVERY_KEY);
      return {ok:true,migratedFrom:p.migratedFrom||null};
    }catch(error){
      let restored=false;
      try{for(const k of Object.keys(collect(storage))) storage.removeItem(k);for(const [k,v] of Object.entries(old)) storage.setItem(k,v);restored=Object.entries(old).every(([k,v])=>storage.getItem(k)===v);}catch{}
      return {ok:false,error,recovery,recoveryAvailable:storage.getItem(RECOVERY_KEY)===recovery,restored};
    }
  }
  function inspectRecovery(storage){
    const raw=storage.getItem(RECOVERY_KEY); if(!raw)return null;
    try{const x=JSON.parse(raw);if(x?.schema!=='hero-farm-recovery'||x.version!==1)return {valid:false,error:'Copie de récupération illisible'};return {valid:true,backup:validateBackup(x.backup),raw};}catch(error){return {valid:false,error:error.message};}
  }
  function recoverBackup(storage){
    const recovery=inspectRecovery(storage);if(!recovery?.valid)return {ok:false,error:new Error(recovery?.error||'Aucune copie de récupération')};
    const wanted=recovery.backup.storage;
    try{for(const k of Object.keys(collect(storage)))storage.removeItem(k);for(const [k,v] of Object.entries(wanted))storage.setItem(k,v);if(!Object.entries(wanted).every(([k,v])=>storage.getItem(k)===v))throw Error('Vérification de récupération impossible');storage.removeItem(RECOVERY_KEY);return {ok:true};}catch(error){return {ok:false,error,recoveryAvailable:storage.getItem(RECOVERY_KEY)===recovery.raw};}
  }
  function validateSessionItems(items){
    for(const item of items||[]){const count=performedSets(item);if(!count)continue;const kind=chargeKind(item.unit);if(kind!=='bodyweight'){const check=validateLoad(item.load,kind);if(!check.ok)return {ok:false,sid:item.sid,error:`${item.name||item.sid} : ${check.error}`};}}
    return {ok:true};
  }
  function isCompletedExercise(item){return !!item&&!item.note&&performedSets(item)>0&&((item.legacyAggregate&&Number.isInteger(item.performedSets)&&item.performedSets>=item.sets)||(!item.legacyAggregate&&performedSets(item)>=(item.sets||1)));}
  function editHistoryItem(item,{repsTot,load,setReps}={}){
    const next={...item}; if(!Array.isArray(item.setReps))next.legacyAggregate=true;if(load!==undefined)next.load=load;
    if(setReps!==undefined){next.setReps=setReps.slice();next.repsTot=setReps.reduce((a,b)=>a+b,0)||null;next.legacyAggregate=false;delete next.performedSets;}
    else if(repsTot!==undefined&&repsTot!==item.repsTot){next.repsTot=repsTot;if(item.legacyAggregate){next.setReps=[];}else if(repsTot==null){next.setReps=[];next.legacyAggregate=false;}else throw Error('Modifie les répétitions série par série pour une séance détaillée.');}
    return next;
  }
  function commitSession(storage,entry,draftKey='paogramme_session_draft_v1',logKey='paogramme_log_v2'){
    if(!entry||typeof entry.id!=='string'||!entry.id) return {ok:false,error:new Error('Identifiant de séance manquant')};
    let log; try{log=JSON.parse(storage.getItem(logKey)||'[]');if(!Array.isArray(log))throw Error('Journal invalide');}catch(error){return {ok:false,error};}
    if(log.some(x=>x&&x.id===entry.id)) return {ok:true,duplicate:true};
    try{storage.setItem(logKey,JSON.stringify([...log,entry]));storage.removeItem(draftKey);return {ok:true,duplicate:false};}
    catch(error){return {ok:false,error};}
  }
  function latestSession(log,letter,programMode){return (log||[]).filter(e=>e?.letter===letter&&(e.programMode||'strength')===programMode).sort((a,b)=>(b.ts||0)-(a.ts||0))[0]||null;}
  function mergeUniqueEntries(existing,incoming){const seen=new Set((existing||[]).map(e=>e?.id).filter(Boolean));return [...(existing||[]),...(incoming||[]).filter(e=>e?.id&&!seen.has(e.id)&&(seen.add(e.id),true))];}
  function hasPriorUse(storage){
    if(storage.getItem('onb_done_v5')==='1') return true;
    for(const key of ['paogramme_log_v2','paogramme_session_draft_v1','paogramme_active_session_v1']){
      const raw=storage.getItem(key); if(!raw)continue;
      if(key==='paogramme_active_session_v1'||raw!=='[]'&&raw!=='{}'&&raw!=='null') return true;
    }
    return false;
  }
  function saveSetup(storage,input,{complete=false}={}){
    const name=normalizeName(input?.name),program=input?.program,step=Math.max(1,Math.min(3,Number(input?.step)||1));
    if(program!=null&&!['strength','hybrid'].includes(program)) return {ok:false,error:new Error('Choisis un programme disponible.')};
    if(complete&&!program) return {ok:false,error:new Error('Choisis un programme avant de terminer.')};
    const setup={version:1,step,completed:!!complete,name,program:program||null};
    try{
      if(complete){
        storage.setItem('aurafarm_program_mode_v1',program);
        storage.setItem('hero_farm_profile_v1',JSON.stringify({version:1,name}));
      }
      // Écrit en dernier : « completed » ne peut jamais annoncer un succès partiel.
      storage.setItem('hero_farm_setup_v1',JSON.stringify(setup));
      if(complete) storage.setItem('onb_done_v5','1');
      const verified=JSON.parse(storage.getItem('hero_farm_setup_v1')||'null');
      if(!verified||verified.completed!==!!complete||verified.program!==setup.program) throw Error('La configuration n’a pas pu être vérifiée.');
      if(complete&&storage.getItem('aurafarm_program_mode_v1')!==program) throw Error('Le programme n’a pas pu être vérifié.');
      return {ok:true,setup};
    }catch(error){return {ok:false,error};}
  }
  return {BACKUP_VERSION,RECOVERY_KEY,chargeKind,comparableUnit,validateReps,validateLoad,performedSets,tonnage,progressLoad,progressLabel,suggestedStart,isAllowedKey,createBackup,migrateBackup,validateBackup,restoreBackup,inspectRecovery,recoverBackup,validateSessionItems,isCompletedExercise,editHistoryItem,commitSession,latestSession,mergeUniqueEntries,normalizeName,validateProfile,validateSetup,hasPriorUse,saveSetup};
});

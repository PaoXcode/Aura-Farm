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
    'paogramme_rt_sound_v1','paogramme_recovery_backup_v1','onb_done_v5','rebuild_done_v1'
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
    if(Array.isArray(item?.setReps)) return item.setReps.filter(x=>validateReps(x,{allowEmpty:false}).ok).length;
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
  function collect(storage){ const out={}; for(let i=0;i<storage.length;i++){const k=storage.key(i);if(isAllowedKey(k)) out[k]=storage.getItem(k);} return out; }
  function validateStoredValue(k,v){
    if(typeof v!=='string') throw new Error(`Valeur invalide pour ${k}`);
    if(k==='aurafarm_program_mode_v1'&&!['strength','hybrid'].includes(v)) throw new Error('Programme invalide');
    if(/^(paogramme_log_v2|paogramme_cfg_v2|paogramme_session_draft_v1|last_|state_|records_|eff_)/.test(k)) try{JSON.parse(v)}catch{throw new Error(`JSON invalide pour ${k}`)}
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
    for(const k of keys){if(!isAllowedKey(k)) throw new Error(`Clé étrangère refusée : ${k}`);validateStoredValue(k,p.storage[k]);}
    return p;
  }
  function restoreBackup(storage,payload){
    const p=validateBackup(payload), old=collect(storage), recovery=JSON.stringify(createBackup(storage));
    storage.setItem('paogramme_recovery_backup_v1',recovery);
    try{
      for(const k of Object.keys(old)) storage.removeItem(k);
      for(const [k,v] of Object.entries(p.storage)) storage.setItem(k,v);
      storage.removeItem('paogramme_recovery_backup_v1');
      return {ok:true,migratedFrom:p.migratedFrom||null};
    }catch(error){
      try{for(const k of Object.keys(collect(storage))) storage.removeItem(k);for(const [k,v] of Object.entries(old)) storage.setItem(k,v);}catch{}
      return {ok:false,error,recovery};
    }
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
  return {BACKUP_VERSION,chargeKind,comparableUnit,validateReps,validateLoad,performedSets,tonnage,progressLoad,progressLabel,suggestedStart,isAllowedKey,createBackup,migrateBackup,validateBackup,restoreBackup,commitSession,latestSession,mergeUniqueEntries};
});

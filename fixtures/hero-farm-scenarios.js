'use strict';

// Données exclusivement fictives. Les dates et identifiants sont fixes afin que
// les captures et assertions restent comparables d'une exécution à l'autre.
const BASE_TS=Date.UTC(2026,7,20,18,0,0);
const item=(overrides={})=>({
  sid:'A1',vid:'decline_machine',name:'Développé décliné convergent',muscle:'Pectoraux',
  sets:4,lo:6,hi:10,rest:'2–3 min',unit:'kg',load:60,repsTot:32,
  setReps:[8,8,8,8],eff:'OK',...overrides
});
const session=(id,day,overrides={})=>({
  id,ts:BASE_TS+day*86400000,letter:'A',programMode:'strength',partial:false,
  items:[item()],vol:{Pectoraux:4},total:4,...overrides
});
const encode=value=>JSON.stringify(value);
const backup=(storage,extra={})=>({
  schema:'hero-farm-backup',version:4,exportedAt:BASE_TS,storage,...extra
});
const profile=name=>encode({version:1,name});
const setup=(name,program)=>encode({version:1,step:3,completed:true,name,program});
const common=(name,program)=>({
  onb_done_v5:'1',
  aurafarm_program_mode_v1:program,
  hero_farm_profile_v1:profile(name),
  hero_farm_setup_v1:setup(name,program),
  aura_farm_prefs_v1:encode({theme:'system',motion:true})
});

const existingLog=[
  session('fixture-strength-01',-8),
  session('fixture-strength-02',-4,{letter:'B',items:[item({sid:'B1',vid:'pullup_neutral_w',name:'Tractions prise neutre lestées',unit:'lest (kg)',load:5,setReps:[7,7,6,6],repsTot:26})]}),
  session('fixture-strength-03',0,{letter:'C',items:[item({sid:'C3',vid:'lat_neutral',name:'Tirage vertical prise neutre',load:48,setReps:[12,11,10],sets:3,repsTot:33})]})
];

const hybridDraft={version:2,sessionId:'fixture-draft-hybrid',letter:'B',programMode:'hybrid',items:[
  item({sid:'HB1',vid:'row_bar',name:'Rowing barre',sets:4,setReps:[10,9,null,null],repsTot:19,load:55}),
  item({sid:'HB2',vid:'pullup_neutral_w',name:'Tractions prise neutre lestées',unit:'lest (kg)',sets:4,setReps:[],repsTot:null,load:null})
],navigation:{view:'guided',sid:'HB1'}};

const edgeLog=[
  session('fixture-assistance-zero',-5,{items:[item({vid:'pullup_assist',name:'Tractions assistées',unit:'kg (assistance)',load:0,setReps:[8,8,7,7],repsTot:30})]}),
  session('fixture-missing-old-load',-4,{items:[item({load:null,setReps:[8,8,8,8],repsTot:32})]}),
  session('fixture-legacy-total',-3,{items:[item({setReps:[],legacyAggregate:true,performedSets:4,repsTot:30})]}),
  session('fixture-empty-middle-slot',-2,{partial:true,items:[item({setReps:[8,null,7,6],repsTot:21})]}),
  session('fixture-same-day-a',-1),
  session('fixture-same-day-b',-1,{ts:BASE_TS-86400000+3600000,items:[item({load:62,setReps:[8,8,7,7],repsTot:30})]})
];

const longLog=Array.from({length:15},(_,index)=>session(
  `fixture-page-${String(index+1).padStart(2,'0')}`,
  -index,
  {letter:['A','B','C','D'][index%4],partial:index%5===0,items:[item({load:50+index,setReps:index%5===0?[8,8,null,null]:[8,8,8,8],repsTot:index%5===0?16:32})]}
));

const scenarios={
  newUser:backup({}, {empty:true}),
  existingStrength:backup({...common('Camille','strength'),paogramme_log_v2:encode(existingLog)}),
  hybridDraft:backup({...common('Noa','hybrid'),paogramme_log_v2:encode([session('fixture-hybrid-partial',-1,{programMode:'hybrid',partial:true,items:[item({sid:'HA1',setReps:[8,8,null,null],repsTot:16})]})]),paogramme_active_session_v1:'B',paogramme_session_draft_v1:encode(hybridDraft)}),
  legacyEdges:backup({...common('Alix','strength'),paogramme_log_v2:encode(edgeLog)}),
  pagination:backup({...common('Sacha','strength'),paogramme_log_v2:encode(longLog)})
};

module.exports={BASE_TS,item,session,scenarios};

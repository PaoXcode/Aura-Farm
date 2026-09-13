#!/usr/bin/env node
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {extname,join,normalize} from 'node:path';
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';

const require=createRequire(import.meta.url);
const {scenarios}=require('../fixtures/hero-farm-scenarios.js');
let chromium;
try{({chromium}=await import('playwright'));}
catch{
  console.error('Navigateur non exécuté : le module « playwright » est absent.');
  console.error('Prérequis, lorsque le registre et le téléchargement sont autorisés : npm install -D playwright && npx playwright install chromium');
  process.exit(2);
}

const root=new URL('..',import.meta.url).pathname;
const types={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8'};
const server=createServer(async(req,res)=>{
  const pathname=req.url==='/'?'/index.html':decodeURIComponent(req.url.split('?')[0]);
  const file=normalize(join(root,pathname));
  if(!file.startsWith(root)){res.writeHead(403).end();return;}
  try{res.setHeader('content-type',types[extname(file)]||'application/octet-stream');res.end(await readFile(file));}
  catch{res.writeHead(404).end('Not found');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const url=`http://127.0.0.1:${server.address().port}`;
const out=join(root,'docs/captures/etape-7');
const browser=await chromium.launch({headless:true});
const version=browser.version(),commit=execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim();
const manifest={commit,engine:`Chromium ${version}`,mode:'headless viewport emulation',generatedAt:new Date().toISOString(),screenshots:[]};

async function pageFor(fixture,viewport,theme){
  const context=await browser.newContext({viewportSize:viewport,colorScheme:theme});
  await context.addInitScript(storage=>{if(!localStorage.getItem('__hf_fixture_loaded')){for(const [key,value] of Object.entries(storage))localStorage.setItem(key,value);localStorage.setItem('__hf_fixture_loaded','1');}},fixture.storage);
  const page=await context.newPage();await page.goto(url,{waitUntil:'networkidle'});
  const applied=await page.evaluate(()=>({width:innerWidth,height:innerHeight}));
  if(applied.width!==viewport.width||applied.height!==viewport.height)throw Error(`Viewport incorrect: ${applied.width}x${applied.height}`);
  return {page,context};
}
async function shot(page,name,theme,viewport){
  await page.evaluate(selected=>setThemePreference(selected),theme);
  await page.waitForTimeout(80);
  const file=`${name}-${theme}-${viewport.width}x${viewport.height}.png`;
  await page.screenshot({path:join(out,file),fullPage:true});manifest.screenshots.push(file);
}

try{
  // La séance s'ouvre sur les repères habituels ; la vue guidée reste volontaire.
  {
    const run=await pageFor({storage:{}},{width:390,height:844},'light');
    await run.page.click('.onbProgram:has-text("Musculation")');
    await run.page.click('#onbN');
    await run.page.waitForSelector('#sess.on');
    if(await run.page.locator('#focus').evaluate(el=>el.classList.contains('on')))throw Error('Mode focus ouvert automatiquement');
    await run.page.click('#focusBtn');
    await run.page.waitForSelector('#focus.on');
    if(await run.page.evaluate(()=>localStorage.getItem('aurafarm_program_mode_v1'))!=='strength')throw Error('Programme non persisté');
    await run.context.close();
  }
  for(const viewport of [{width:360,height:800},{width:390,height:844},{width:1280,height:900}]){
    for(const theme of ['light','dark']){
      let run=await pageFor(scenarios.existingStrength,viewport,theme);
      await shot(run.page,'accueil',theme,viewport);
      await run.page.click('.programTrigger');await shot(run.page,'choix-programme',theme,viewport);await run.context.close();

      run=await pageFor(scenarios.existingStrength,viewport,theme);
      await run.page.evaluate(()=>openSession('A'));if(!await run.page.locator('#focus').evaluate(el=>el.classList.contains('on')))await run.page.click('#focusBtn');
      await run.page.fill('#f_load_A1','60');
      const first='#f_setreps_A1_1',second='#f_setreps_A1_2',third='#f_setreps_A1_3';
      await run.page.click(first);await run.page.type(first,'11');
      if(!await run.page.locator(`${first} >> xpath=..`).evaluate(el=>el.classList.contains('active')))throw Error('Série 1 non active pendant édition');
      await run.page.press(first,'Tab');
      if(!await run.page.locator(`${second} >> xpath=..`).evaluate(el=>el.classList.contains('active')))throw Error('Série 2 non suggérée');
      await run.page.fill(second,'11');await run.page.click('button:has-text("Lancer le repos")');
      if(!await run.page.locator(`${third} >> xpath=..`).evaluate(el=>el.classList.contains('active')))throw Error('Série 3 non suggérée après repos');
      if(viewport.width===390){
        for(const [name,selector] of [['serie-1',first],['serie-2',second],['serie-3',third],['correction-serie-1',first]]){await run.page.click(selector);await shot(run.page,name,theme,viewport);}
      }
      await run.page.fill(third,'11');await run.page.fill('#f_setreps_A1_4','11');
      await shot(run.page,'seance-guidee-valeurs',theme,viewport);
      await run.page.fill('#f_load_A1','-1');await run.page.click('button:has-text("Valider l’exercice")');await run.page.evaluate(()=>startRestForSid('A1'));
      await shot(run.page,'chronometre-erreur',theme,viewport);await run.context.close();

      run=await pageFor(scenarios.pagination,viewport,theme);
      await run.page.evaluate(()=>openStats());await run.page.click('#progressHistoryTab');
      await run.page.selectOption('#historyStatus','partial');await shot(run.page,'historique-filtre',theme,viewport);await run.context.close();

      run=await pageFor(scenarios.legacyEdges,viewport,theme);
      await run.page.evaluate(()=>openStats());await run.page.selectOption('#exercisePicker',{index:1});
      await shot(run.page,'progres-plusieurs-points',theme,viewport);await run.context.close();
    }
  }
  await import('node:fs/promises').then(fs=>fs.writeFile(join(out,'manifest.json'),JSON.stringify(manifest,null,2)+'\n'));
  console.log(`Recette terminée avec ${manifest.screenshots.length} captures — ${manifest.engine} — ${commit}`);
}finally{await browser.close();server.close();}

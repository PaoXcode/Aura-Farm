import {mkdir,writeFile} from 'node:fs/promises';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const {scenarios}=require('../fixtures/hero-farm-scenarios.js');
const target=new URL('../tmp/recette-fixtures/',import.meta.url);
await mkdir(target,{recursive:true});
for(const [name,payload] of Object.entries(scenarios)) await writeFile(new URL(`${name}.json`,target),JSON.stringify(payload,null,2)+'\n');
console.log(`5 sauvegardes fictives écrites dans ${target.pathname}`);

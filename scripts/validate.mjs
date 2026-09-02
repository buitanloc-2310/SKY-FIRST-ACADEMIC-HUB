import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';

const root=path.resolve(new URL('..',import.meta.url).pathname);
const must=[
  'wrangler.jsonc',
  'public/index.html',
  'public/app.js',
  'public/styles.css',
  'public/assets/skyfirst-logo.png',
  'src/index.js',
  'src/auth.js',
  'src/public.js',
  'src/admin.js',
  'migrations/0001_schema.sql',
  'migrations/0002_academic_hub_1_1.sql'
];

let ok=true;
for(const f of must){
  if(!fs.existsSync(path.join(root,f))){
    console.error('MISSING',f);
    ok=false;
  }
}

const id='bc5bc5f5-b089-4102-a812-3b2666a802af';
for(const f of ['wrangler.jsonc','migrations/0001_schema.sql']){
  if(fs.existsSync(path.join(root,f))&&!fs.readFileSync(path.join(root,f),'utf8').includes(id)){
    console.error('INSTANCE_ID_MISSING',f);
    ok=false;
  }
}

for(const f of ['src/index.js','src/auth.js','src/public.js','src/admin.js','public/app.js']){
  try{
    execFileSync(process.execPath,['--check',path.join(root,f)],{stdio:'pipe'});
  }catch{
    console.error('SYNTAX',f);
    ok=false;
  }
}

const seedManifest=path.join(root,'seed-library/manifest.json');
if(fs.existsSync(seedManifest)){
  try{
    const manifest=JSON.parse(fs.readFileSync(seedManifest,'utf8'));
    if(manifest.instance_id && manifest.instance_id!==id){
      console.error('SEED_INSTANCE_ID_MISMATCH',manifest.instance_id);
      ok=false;
    }
    if(!Array.isArray(manifest.documents)){
      console.error('SEED_DOCUMENTS_INVALID');
      ok=false;
    }else{
      if(Number(manifest.count)!==manifest.documents.length){
        console.error('SEED_COUNT_MISMATCH',manifest.count,manifest.documents.length);
        ok=false;
      }
      for(const d of manifest.documents){
        if(d.relative_path&&!fs.existsSync(path.join(root,'seed-library',d.relative_path))){
          console.error('MISSING_PDF',d.filename||d.relative_path);
          ok=false;
          break;
        }
      }
    }
  }catch(e){
    console.error('SEED_MANIFEST_INVALID',e.message);
    ok=false;
  }
}else{
  console.log('SEED_LIBRARY_SKIPPED (không nằm trong source repository)');
}

console.log(ok?'VALIDATION_OK':'VALIDATION_FAILED');
if(!ok)process.exit(1);

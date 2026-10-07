/* One immutable UI revision, many configured static bundles. Never deploys. */
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const digest=data=>crypto.createHash('sha256').update(data).digest('hex');
function validate(config,root){
  const sandbox={window:{SIKOYEK_CONFIG:config},URL,atob:value=>Buffer.from(value,'base64').toString('utf8')};
  vm.runInNewContext(fs.readFileSync(path.join(root,'foundation/config.js'),'utf8'),sandbox);
  return sandbox.window.SiKoyekConfig;
}
function buildRelease({sourceRoot,outRoot,tenants,preview=false}){
  sourceRoot=path.resolve(sourceRoot);outRoot=path.resolve(outRoot);
  if(outRoot===sourceRoot||outRoot.startsWith(sourceRoot+path.sep))throw new Error('Output harus berada di luar sumber');
  if(fs.existsSync(outRoot)&&fs.readdirSync(outRoot).length)throw new Error('Direktori output harus kosong');
  const ids=new Set(),directories=new Set();for(const config of tenants){validate(config,sourceRoot);const directory=config.directory||config.id;if(!/^[A-Za-z][A-Za-z0-9-]{0,63}$/.test(directory))throw new Error('Direktori lingkungan tidak valid');if(ids.has(config.id)||directories.has(directory))throw new Error('ID/direktori lingkungan duplikat');ids.add(config.id);directories.add(directory);if(preview&&config.backend!=='preview'||!preview&&config.backend!=='cloud')throw new Error('Mode paket dan backend berbeda')}
  const files=[];
  for(const entry of fs.readdirSync(sourceRoot,{withFileTypes:true}))if(entry.isFile()&&/\.(html|js|css)$/.test(entry.name)&&entry.name!=='environment.js')files.push(entry.name);
  for(const entry of fs.readdirSync(path.join(sourceRoot,'foundation')))if(/\.(js|css|json)$/.test(entry))files.push('foundation/'+entry);
  files.sort();const hashes=Object.fromEntries(files.map(file=>[file,digest(fs.readFileSync(path.join(sourceRoot,file)))]));
  const applicationRevision=digest(JSON.stringify(hashes));
  fs.mkdirSync(outRoot,{recursive:true});
  const manifest={applicationRevision,mode:preview?'preview':'cloud',tenants:[],sourceFiles:hashes};
  const policy="default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; font-src 'self' data:; connect-src 'none'; frame-src 'none'; worker-src 'none'; object-src 'none'; form-action 'none'; base-uri 'self'";
  for(const config of tenants){
    const directory=config.directory||config.id,destination=path.join(outRoot,directory);fs.mkdirSync(destination,{recursive:true});
    for(const file of files){const out=path.join(destination,file);fs.mkdirSync(path.dirname(out),{recursive:true});let bytes=fs.readFileSync(path.join(sourceRoot,file));
      if(preview&&file.endsWith('.html')){let html=bytes.toString();html=html.replace(/<script src="https:\/\/cdn\.jsdelivr\.net\/npm\/@supabase\/supabase-js@2"><\/script>/g,'<script src="./preview/seed.js"></script><script src="./preview/backend.js"></script>');html=html.replace(/<head(?:\s[^>]*)?>/i,match=>match+'<meta http-equiv="Content-Security-Policy" content="'+policy+'">');bytes=Buffer.from(html)}
      fs.writeFileSync(out,bytes);
    }
    fs.writeFileSync(path.join(destination,'environment.js'),'window.SIKOYEK_CONFIG = '+JSON.stringify(config,null,2)+';\n');
    if(preview){fs.cpSync(path.join(sourceRoot,'preview'),path.join(destination,'preview'),{recursive:true});}
    manifest.tenants.push({id:config.id,name:config.name,applicationRevision,entry:directory+'/index.html'});
  }
  fs.writeFileSync(path.join(outRoot,'release-manifest.json'),JSON.stringify(manifest,null,2)+'\n');
  if(preview){for(const name of ['index.html','portal.css','portal.js'])fs.copyFileSync(path.join(sourceRoot,'preview',name),path.join(outRoot,name));}
  else{const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));const links=tenants.map(config=>'<a href="./'+(config.directory||config.id)+'/">SiKoyek '+escape(config.name)+'</a>').join('');fs.writeFileSync(path.join(outRoot,'index.html'),fs.readFileSync(path.join(sourceRoot,'deployment/selector.html'),'utf8').replace('{{ENVIRONMENT_LINKS}}',links));}
  return manifest;
}
module.exports={buildRelease,validate};
if(require.main===module){
  const args=process.argv.slice(2);const preview=args[0]==='--preview';if(preview)args.shift();
  if(args.length<1)throw new Error('node deployment/build-release.cjs [--preview] /absolute/output [config.json ...]');
  const root=path.resolve(__dirname,'..');
  const tenants=preview?['master','konstruva','klien-baru'].map(id=>({id,name:id==='master'?'MASTER':id==='konstruva'?'KONSTRUVA':'KLIEN BARU',backend:'preview',url:'https://'+id+'.invalid',key:'preview-only'})):(args.slice(1).length?args.slice(1):['deployment/environments/master.json','deployment/environments/konstruva.json']).map(file=>JSON.parse(fs.readFileSync(file,'utf8')));
  const result=buildRelease({sourceRoot:root,outRoot:args[0],tenants,preview});console.log(JSON.stringify({applicationRevision:result.applicationRevision,mode:result.mode,tenants:result.tenants},null,2));
}

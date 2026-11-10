/* global __dirname, process */
const http = require('node:http'), fs = require('node:fs'), path = require('node:path');
const root = path.resolve(__dirname, '../dist');
const base = JSON.parse(fs.readFileSync(path.join(root,'manifest.webmanifest'),'utf8')).scope;
const types = {'.html':'text/html; charset=utf-8','.js':'application/javascript','.webmanifest':'application/manifest+json','.png':'image/png','.ttf':'font/ttf'};
http.createServer((req,res)=>{
 let file;
 try {const pathname=decodeURIComponent(new URL(req.url,'http://localhost').pathname); if(base!=='/' && pathname==='/'){res.writeHead(302,{Location:base});res.end();return;} if(!pathname.startsWith(base)){res.writeHead(404);res.end();return;} file=path.resolve(root,pathname.slice(base.length));} catch {res.writeHead(400);res.end();return;}
 if(file!==root&&!file.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
 if(fs.existsSync(file)&&fs.statSync(file).isDirectory()) file=path.join(file,'index.html');
 if(!fs.existsSync(file)){res.writeHead(404);res.end();return;}
 res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'});fs.createReadStream(file).pipe(res);
}).listen(Number(process.env.PORT)||4173,'127.0.0.1',()=>console.log('Pulso: http://localhost:4173'));

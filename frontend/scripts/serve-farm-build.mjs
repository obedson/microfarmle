import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=path.resolve('build');
const mime={'.js':'application/javascript','.css':'text/css','.json':'application/json','.png':'image/png','.ico':'image/x-icon','.svg':'image/svg+xml','.html':'text/html'};
http.createServer(async(req,res)=>{
 try{
  const pathname=new URL(req.url,'http://127.0.0.1').pathname;
  const asset=path.resolve(root,'.'+decodeURIComponent(pathname));
  if(asset!==root&&!asset.startsWith(root+path.sep)){res.writeHead(403);res.end();return;}
  const file=path.extname(asset)?asset:path.join(root,'index.html');
  const bytes=await readFile(file);
  res.setHeader('Content-Type',mime[path.extname(file)]??'application/octet-stream');res.end(bytes);
 }catch{res.writeHead(404);res.end();}
}).listen(4174,'127.0.0.1',()=>console.log('Farm production build ready'));

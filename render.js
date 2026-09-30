// Preview and PNG export share this renderer. New fields default to the v1 appearance.
export const DEFAULTS=Object.freeze({font:'sans',size:64,spacing:0,lineHeight:1.45,width:640,align:'center',color:'#181c19',background:false,bgColor:'#d8ef9a',bgOpacity:1,radius:28,padding:28,bgStyle:'label',bgThickness:12,bgInnerColor:'#ffffff',bgInnerWidth:3,markerHeight:.45,markerOffset:.18,layout:'plain',waveHeight:20,wavePeriod:6,stepHeight:8,stepDirection:'up',outline:false,outlineColor:'#ffffff',outlineWidth:3,shadow:false,shadowColor:'#000000',shadowOpacity:.25,shadowBlur:14,shadowX:0,shadowY:8});
export const BUILTINS=[
 {id:'sans',name:'清爽黑體',family:'NoteSans',file:'notosanstc.woff2',category:'簡約',chinese:true,core:true},
 {id:'serif',name:'經典宋體',family:'NoteSerif',file:'notoseriftc.woff2',category:'復古',chinese:true,core:true},
 {id:'kai',name:'手寫文楷',family:'NoteKai',file:'lxgwwenkaitc.woff2',category:'手寫',chinese:true,core:true},
 {id:'huninn',name:'粉圓・圓潤日常',category:'圓潤',chinese:true},
 {id:'iansui',name:'芫荽・自然手寫',category:'手寫',chinese:true},
 {id:'chenyuluoyan',name:'辰宇落雁・輕盈手寫',category:'手寫',chinese:true},
 {id:'chirongoroundtc',name:'昭源環方・厚實圓體',category:'圓潤',chinese:true},
 {id:'chironheihk',name:'昭源黑體・醒目標題',category:'粗黑',chinese:true,note:'部分字形採香港慣用寫法'},
 {id:'fredoka',name:'Fredoka・軟糖圓體',category:'圓潤',chinese:false},
 {id:'caveat',name:'Caveat・隨手筆記',category:'手寫',chinese:false},
 {id:'anton',name:'Anton・俐落粗黑',category:'粗黑',chinese:false},
 {id:'bungee',name:'Bungee・街頭招牌',category:'粗黑',chinese:false}
].map(f=>({...f,family:f.family||'Public_'+f.id,file:f.file||f.id+'.woff2'}));
const limits={size:[20,140],spacing:[0,16],lineHeight:[1,2.5],width:[160,1200],bgOpacity:[0,1],radius:[0,100],padding:[0,100],bgThickness:[1,40],bgInnerWidth:[1,12],markerHeight:[.1,1.2],markerOffset:[-.5,.5],waveHeight:[0,80],wavePeriod:[2,16],stepHeight:[0,30],outlineWidth:[1,12],shadowOpacity:[0,1],shadowBlur:[0,40],shadowX:[-40,40],shadowY:[-40,40]};
const enums={align:['left','center','right'],bgStyle:['label','contour','sticker','lines','connected','marker'],layout:['plain','wave','step','vertical'],stepDirection:['up','down']};
export function cleanStyle(v={}){v=v&&typeof v==='object'?v:{};const r={...DEFAULTS};for(const k of Object.keys(r)){if(!(k in v))continue;if(k in limits){const n=Number(v[k]);if(Number.isFinite(n))r[k]=Math.min(limits[k][1],Math.max(limits[k][0],n));}else if(typeof r[k]==='boolean'){if(typeof v[k]==='boolean')r[k]=v[k];}else if(k.toLowerCase().includes('color')){if(/^#[\da-f]{6}$/i.test(v[k]))r[k]=v[k];}else if(enums[k]){if(enums[k].includes(v[k]))r[k]=v[k];}else if(k==='font'&&typeof v[k]==='string'&&/^[a-zA-Z0-9_-]{1,90}$/.test(v[k]))r[k]=v[k];}return r;}
const segmenter=new Intl.Segmenter('zh-Hant',{granularity:'grapheme'});
export const graphemes=text=>Array.from(segmenter.segment(text),x=>x.segment);
const isEmoji=g=>/\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(g);
export function fontString(style,fonts){const item=fonts.find(f=>f.id===style.font)||BUILTINS[0];return `${style.size}px "${item.family}", "NoteSans", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;}
const makeCanvas=(w,h)=>{const c=document.createElement('canvas');c.width=Math.ceil(w);c.height=Math.ceil(h);return c;};
// Round alpha expansion using a squared Euclidean distance transform. This also
// outlines complete color-emoji silhouettes instead of outlining an emoji box.
function expandMask(source,radius,color){
 const w=source.width,h=source.height,ctx=source.getContext('2d'),pixels=ctx.getImageData(0,0,w,h).data;
 const distance=new Float32Array(w*h),max=1e12;
 for(let y=0;y<h;y++){let last=-1e6;for(let x=0;x<w;x++){if(pixels[(y*w+x)*4+3]>24)last=x;distance[y*w+x]=(x-last)**2;}last=1e6;for(let x=w-1;x>=0;x--){if(pixels[(y*w+x)*4+3]>24)last=x;distance[y*w+x]=Math.min(distance[y*w+x],(last-x)**2,max);}}
 const out=makeCanvas(w,h),p=out.getContext('2d'),data=p.createImageData(w,h),rgb=[1,3,5].map(i=>parseInt(color.slice(i,i+2),16));
 const v=new Int32Array(h),z=new Float64Array(h+1),f=new Float32Array(h);
 for(let x=0;x<w;x++){for(let y=0;y<h;y++)f[y]=distance[y*w+x];let k=0;v[0]=0;z[0]=-Infinity;z[1]=Infinity;
  for(let q=1;q<h;q++){let s;do{s=((f[q]+q*q)-(f[v[k]]+v[k]*v[k]))/(2*q-2*v[k]);if(s<=z[k])k--;else break;}while(k>=0);k++;v[k]=q;z[k]=s;z[k+1]=Infinity;}
  k=0;for(let q=0;q<h;q++){while(z[k+1]<q)k++;const d=Math.sqrt((q-v[k])**2+f[v[k]]),a=Math.max(0,Math.min(1,radius+.5-d));if(a){const i=(q*w+x)*4;data.data[i]=rgb[0];data.data[i+1]=rgb[1];data.data[i+2]=rgb[2];data.data[i+3]=Math.round(a*255);}}
 }
 p.putImageData(data,0,0);return out;
}
const verticalForms={'（':'︵','）':'︶','[':'﹇',']':'﹈','【':'︻','】':'︼','「':'﹁','」':'﹂','『':'﹃','』':'﹄','《':'︽','》':'︾','—':'︱','…':'︙'};
export function renderSticker(text,rawStyle,fonts){
 if(!text.trim())return null;const style=cleanStyle(rawStyle),vertical=style.layout==='vertical';
 const ctx=makeCanvas(1,1).getContext('2d'),textFont=fontString(style,fonts),emojiFont=`${style.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
 const measure=g=>{ctx.font=isEmoji(g)?emojiFont:textFont;return ctx.measureText(g);};
 const gw=g=>measure(g).width;const lw=gs=>gs.reduce((a,g)=>a+(vertical?style.size:gw(g)),0)+Math.max(0,gs.length-1)*style.spacing;
 const lines=[];
 for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')){let line=[];const words=vertical?graphemes(paragraph):Array.from(new Intl.Segmenter('zh-Hant',{granularity:'word'}).segment(paragraph.replace(/\t/g,'    ')),x=>x.segment);
 for(const word of words){const units=graphemes(word);if(line.length&&lw([...line,...units])>style.width&&!/^[，。！？、：；,.!?;:)）」』]+$/.test(word)){lines.push(line);line=[];if(/^\s+$/.test(word))continue;}for(const g of units){if(line.length&&lw([...line,g])>style.width&&!/^[，。！？、：；,.!?;:)）」』]$/.test(g)){lines.push(line);line=[];}line.push(g);}}lines.push(line);}
 if(lines.length>100)throw new Error('文字太長，請分成兩張貼紙。');
 let ascent=style.size*.9,descent=style.size*.28,overhang=style.size*.2;for(const g of graphemes(text)){const m=measure(g);ascent=Math.max(ascent,m.actualBoundingBoxAscent||0);descent=Math.max(descent,m.actualBoundingBoxDescent||0);overhang=Math.max(overhang,m.actualBoundingBoxLeft||0,(m.actualBoundingBoxRight||0)-m.width);}
 const inkWidth=Math.max(...lines.map(lw),1),baseAdvance=Math.max(style.size*style.lineHeight,ascent+descent),glyphs=[],groups=[];
 let cursor=0;
 lines.forEach((line,index)=>{const align=style.align==='center'?(inkWidth-lw(line))/2:style.align==='right'?inkWidth-lw(line):0,group=[];let pos=align;
 const offsets=line.map((_,i)=>style.layout==='wave'?Math.sin(i*2*Math.PI/style.wavePeriod)*style.waveHeight:style.layout==='step'?i*style.stepHeight*(style.stepDirection==='up'?-1:1):0);
 const low=Math.min(0,...offsets),high=Math.max(0,...offsets);
 line.forEach((g,i)=>{const advance=vertical?style.size:gw(g),x=vertical?(lines.length-1-index)*baseAdvance:pos,y=vertical?pos+ascent:cursor+ascent+offsets[i]-low;
 const display=vertical?(verticalForms[g]||g):g,displayWidth=gw(display);let gx=vertical?x+(style.size-displayWidth)/2:x,gy=y;if(vertical&&/^[，。、．,.]$/.test(g)){const m=measure(display);gx=x+style.size*.88-(m.actualBoundingBoxRight||displayWidth);gy=y-ascent+style.size*.12+(m.actualBoundingBoxAscent||style.size*.2);}
 const item={g:display,x:gx,y:gy,w:vertical?style.size:advance,cellX:x,cellY:y-ascent,vertical};glyphs.push(item);group.push(item);pos+=advance+style.spacing;});
 groups.push(group);cursor+=baseAdvance+high-low;
 });
 const contentW=vertical?(lines.length-1)*baseAdvance+style.size:inkWidth;
 const contentH=vertical?inkWidth:Math.max(cursor-baseAdvance+ascent+descent,ascent+descent,...glyphs.map(g=>g.y+descent));
 const stroke=style.outline?style.outlineWidth:0,outer=style.background&&['contour','sticker'].includes(style.bgStyle)?style.bgThickness+(style.bgStyle==='sticker'?style.bgInnerWidth:0):0;
 const effect=style.shadow?Math.ceil(style.shadowBlur*3+Math.max(Math.abs(style.shadowX),Math.abs(style.shadowY))):0;
 const markerSafe=style.background&&style.bgStyle==='marker'?style.size*(style.markerHeight/2+Math.abs(style.markerOffset)):0;
 const safe=Math.ceil(overhang+stroke+outer+effect+markerSafe+6),pad=safe+style.padding,w=Math.ceil(contentW+pad*2),h=Math.ceil(contentH+pad*2);
 const scale=Math.min(2,8192/w,8192/h,Math.sqrt(8000000/(w*h)));
 if(scale<.5||w*h>16000000)throw new Error('文字太長或起伏太大，請分成兩張貼紙，或調小字級與起伏。');
 const canvas=makeCanvas(w*scale,h*scale),out=canvas.getContext('2d');out.scale(scale,scale);
 const layer=makeCanvas(canvas.width,canvas.height),pen=layer.getContext('2d');pen.scale(scale,scale);pen.textBaseline='alphabetic';pen.lineJoin='round';pen.fillStyle=style.color;
 const drawGlyphs=(p,outline)=>{p.textBaseline='alphabetic';p.lineJoin='round';for(const item of glyphs){p.font=isEmoji(item.g)?emojiFont:textFont;if(outline&&style.outline&&!isEmoji(item.g)){p.strokeStyle=style.outlineColor;p.lineWidth=style.outlineWidth*2;p.strokeText(item.g,item.x+pad,item.y+pad);}p.fillText(item.g,item.x+pad,item.y+pad);}};
 drawGlyphs(pen,true);
 // Build the background at full output resolution; apply opacity once after
 // compositing all regions so overlaps never create dark seams.
 const bg=makeCanvas(canvas.width,canvas.height),b=bg.getContext('2d');b.scale(scale,scale);b.fillStyle=style.bgColor;b.strokeStyle=style.bgColor;b.lineJoin='round';b.lineCap='round';
 const rect=(x,y,rw,rh,r)=>{b.beginPath();b.roundRect(x,y,Math.max(1,rw),Math.max(1,rh),Math.min(r,rw/2,rh/2));b.fill();};
 if(style.background){
 if(['contour','sticker'].includes(style.bgStyle)){
  const mask=makeCanvas(w,h),m=mask.getContext('2d');m.fillStyle='#ffffff';drawGlyphs(m,true);
  b.drawImage(expandMask(mask,outer,style.bgColor),0,0,w,h);
  if(style.bgStyle==='sticker')b.drawImage(expandMask(mask,style.bgInnerWidth,style.bgInnerColor),0,0,w,h);
 }else if(style.bgStyle==='label')rect(safe,safe,w-safe*2,h-safe*2,style.radius);
 else{
  const groupBounds=[];
  for(const group of groups){if(!group.length)continue;const marker=style.bgStyle==='marker',horizontal=!vertical;
   const half=marker?style.size*style.markerHeight/2:(horizontal?(ascent+descent)/2:style.size/2)+style.padding;
   const points=group.map(g=>({x:pad+g.cellX+(horizontal?g.w/2:style.size/2)+(vertical&&marker?style.size*style.markerOffset:0),y:pad+(horizontal?g.y+(descent-ascent)/2+(marker?style.size*style.markerOffset:0):g.cellY+style.size/2)}));
   // A ribbon made from joined quads; caps use the requested corner radius.
   const first=points[0],last=points.at(-1),a=group[0],z=group.at(-1),before=(horizontal?a.w:style.size)/2+(marker?4:style.padding),after=(horizontal?z.w:style.size)/2+(marker?4:style.padding);
   const start={x:first.x-(horizontal?before:0),y:first.y-(vertical?before:0)},end={x:last.x+(horizontal?after:0),y:last.y+(vertical?after:0)},path=[start,...points,end];
   const r=Math.min(style.radius,half,before,after);
   const smooth=points=>{for(let i=0;i<points.length-1;i++)b.quadraticCurveTo(points[i].x,points[i].y,(points[i].x+points[i+1].x)/2,(points[i].y+points[i+1].y)/2);if(points.length)b.lineTo(points.at(-1).x,points.at(-1).y);};
   b.beginPath();if(horizontal){b.moveTo(start.x+r,start.y-half);smooth(path.slice(1,-1).map(p=>({x:p.x,y:p.y-half})));b.lineTo(end.x-r,end.y-half);b.quadraticCurveTo(end.x,end.y-half,end.x,end.y-half+r);b.lineTo(end.x,end.y+half-r);b.quadraticCurveTo(end.x,end.y+half,end.x-r,end.y+half);smooth(path.slice(1,-1).reverse().map(p=>({x:p.x,y:p.y+half})));b.lineTo(start.x+r,start.y+half);b.quadraticCurveTo(start.x,start.y+half,start.x,start.y+half-r);b.lineTo(start.x,start.y-half+r);b.quadraticCurveTo(start.x,start.y-half,start.x+r,start.y-half);}else{b.moveTo(start.x-half+r,start.y);b.lineTo(start.x+half-r,start.y);b.quadraticCurveTo(start.x+half,start.y,start.x+half,start.y+r);b.lineTo(end.x+half,end.y-r);b.quadraticCurveTo(end.x+half,end.y,end.x+half-r,end.y);b.lineTo(end.x-half+r,end.y);b.quadraticCurveTo(end.x-half,end.y,end.x-half,end.y-r);b.lineTo(start.x-half,start.y+r);b.quadraticCurveTo(start.x-half,start.y,start.x-half+r,start.y);}b.closePath();b.fill();
   const bounds={minX:Math.min(...path.map(p=>p.x))-(vertical?half:0),maxX:Math.max(...path.map(p=>p.x))+(vertical?half:0),minY:Math.min(...path.map(p=>p.y))-(horizontal?half:0),maxY:Math.max(...path.map(p=>p.y))+(horizontal?half:0)};groupBounds.push(bounds);
  }
  // Union of overlapping ribbons gives stepped connected backgrounds. Close
  // tiny gaps at the joining edge, but keep deliberately separated rows apart.
  if(style.bgStyle==='connected'&&style.layout==='plain'){for(let i=1;i<groupBounds.length;i++){const a=groupBounds[i-1],c=groupBounds[i],left=Math.max(a.minX,c.minX),right=Math.min(a.maxX,c.maxX),gap=c.minY-a.maxY;if(gap<=style.radius&&right>left)rect(left,c.minY-style.radius,right-left,Math.max(1,gap+2*style.radius),style.radius/2);}}
 }
 }
 // Round inward corners of the union as well as outward corners. Padding the
 // mask keeps the closing operation independent of the output canvas border.
 if(style.background&&style.bgStyle==='connected'&&style.radius>0){
  const r=Math.min(style.radius,Math.max(1,style.padding),style.size*.3),margin=Math.ceil(r*2+2),mask=makeCanvas(w+margin*2,h+margin*2),m=mask.getContext('2d');m.drawImage(bg,margin,margin,w,h);
  const grown=expandMask(mask,r,'#ffffff'),negative=makeCanvas(mask.width,mask.height),n=negative.getContext('2d');n.fillStyle='#ffffff';n.fillRect(0,0,negative.width,negative.height);n.globalCompositeOperation='destination-out';n.drawImage(grown,0,0);
  const hole=expandMask(negative,r,'#ffffff'),rounded=makeCanvas(mask.width,mask.height),q=rounded.getContext('2d');q.fillStyle=style.bgColor;q.fillRect(0,0,rounded.width,rounded.height);q.globalCompositeOperation='destination-out';q.drawImage(hole,0,0);b.clearRect(0,0,w,h);b.drawImage(rounded,margin,margin,w,h,0,0,w,h);
 }
 const composed=makeCanvas(canvas.width,canvas.height),cp=composed.getContext('2d');cp.globalAlpha=style.bgOpacity;if(style.background)cp.drawImage(bg,0,0);cp.globalAlpha=1;cp.drawImage(layer,0,0);
 if(style.background&&style.bgStyle==='label'){out.globalAlpha=style.bgOpacity;out.drawImage(bg,0,0,w,h);out.globalAlpha=1;}
 if(style.shadow){out.shadowColor=style.shadowColor+Math.round(style.shadowOpacity*255).toString(16).padStart(2,'0');out.shadowBlur=style.shadowBlur*scale;out.shadowOffsetX=style.shadowX*scale;out.shadowOffsetY=style.shadowY*scale;}
 out.drawImage(style.background&&style.bgStyle==='label'?layer:composed,0,0,w,h);return{canvas,width:canvas.width,height:canvas.height,lines:lines.length,scaled:scale<1.5};
}
export function canvasBlob(canvas){return new Promise((resolve,reject)=>canvas.toBlob(b=>b?resolve(b):reject(new Error('圖片產生失敗，請稍後再試。')),'image/png'));}
// Read the standard font character map to detect missing glyphs without uploading the file.
export function fontCoverage(buffer){
 const v=new DataView(buffer);const u16=p=>v.getUint16(p),u32=p=>v.getUint32(p);if(buffer.byteLength<12)throw new Error('字體檔案不完整。');const sig=u32(0);if(sig!==0x00010000&&sig!==0x4f54544f)throw new Error('請選擇有效的 TTF 或 OTF 字體。');
 let cmap=0;for(let i=0;i<u16(4);i++){const p=12+i*16;if(u32(p)===0x636d6170)cmap=u32(p+8);}if(!cmap)throw new Error('字體缺少文字對照資料。');
 let offset=0,format=0;for(let i=0;i<u16(cmap+2);i++){const p=cmap+4+i*8,platform=u16(p),encoding=u16(p+2),o=cmap+u32(p+4),f=u16(o);if(platform!==0&&!(platform===3&&[1,10].includes(encoding)))continue;if(f===12){offset=o;format=12;break;}if(f===4){offset=o;format=4;}}
 if(!offset)throw new Error('目前無法讀取這個字體的文字範圍。');
 if(format===12){const n=u32(offset+12);if(n>100000||offset+16+n*12>buffer.byteLength)throw new Error('字體資料損壞。');const groups=Array.from({length:n},(_,i)=>{const p=offset+16+i*12;return[u32(p),u32(p+4),u32(p+8)];});return cp=>{let a=0,b=groups.length-1;while(a<=b){const m=(a+b)>>1,g=groups[m];if(cp<g[0])b=m-1;else if(cp>g[1])a=m+1;else return g[2]+cp-g[0]!==0;}return false;};}
 const n=u16(offset+6)/2,end=offset+14,start=end+2*n+2,delta=start+2*n,range=delta+2*n;
 if(range+2*n>buffer.byteLength)throw new Error('字體資料損壞。');
 return cp=>{if(cp>65535)return false;for(let i=0;i<n;i++){if(cp>u16(end+2*i))continue;if(cp<u16(start+2*i))return false;const d=v.getInt16(delta+2*i),r=u16(range+2*i);if(!r)return ((cp+d)&65535)!==0;const p=range+2*i+r+2*(cp-u16(start+2*i));if(p+2>buffer.byteLength)return false;const glyph=u16(p);return glyph!==0&&((glyph+d)&65535)!==0;}return false;};
}

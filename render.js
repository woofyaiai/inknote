// Shared canvas renderer: the preview and exported PNG use the same pixels.
export const DEFAULTS = Object.freeze({font:'sans',size:64,spacing:0,lineHeight:1.45,width:640,align:'center',color:'#181c19',background:false,bgColor:'#d8ef9a',bgOpacity:1,radius:28,padding:28,outline:false,outlineColor:'#ffffff',outlineWidth:3,shadow:false,shadowColor:'#000000',shadowOpacity:.25,shadowBlur:14,shadowX:0,shadowY:8});
export const BUILTINS=[{id:'sans',name:'清爽黑體',family:'NoteSans',file:'notosanstc.woff2'},{id:'serif',name:'經典宋體',family:'NoteSerif',file:'notoseriftc.woff2'},{id:'kai',name:'手寫文楷',family:'NoteKai',file:'lxgwwenkaitc.woff2'}];
const limits={size:[20,140],spacing:[0,16],lineHeight:[1,2.5],width:[160,1200],bgOpacity:[0,1],radius:[0,100],padding:[0,100],outlineWidth:[1,12],shadowOpacity:[0,1],shadowBlur:[0,40],shadowX:[-40,40],shadowY:[-40,40]};
export function cleanStyle(v={}){const r={...DEFAULTS};for(const k of Object.keys(r)){if(k in limits){const n=Number(v[k]);if(Number.isFinite(n))r[k]=Math.min(limits[k][1],Math.max(limits[k][0],n));}else if(typeof r[k]==='boolean'){if(typeof v[k]==='boolean')r[k]=v[k];}else if(k.toLowerCase().includes('color')){if(/^#[\da-f]{6}$/i.test(v[k]))r[k]=v[k];}else if(k==='align'){if(['left','center','right'].includes(v[k]))r[k]=v[k];}else if(k==='font'&&typeof v[k]==='string'&&/^[a-zA-Z0-9_-]{1,90}$/.test(v[k]))r[k]=v[k];}return r;}
const segmenter=new Intl.Segmenter('zh-Hant',{granularity:'grapheme'});
export const graphemes=text=>Array.from(segmenter.segment(text),x=>x.segment);
const isEmoji=g=>/\p{Extended_Pictographic}|\p{Regional_Indicator}|\u20e3/u.test(g);
export function fontString(style,fonts){const item=fonts.find(f=>f.id===style.font)||BUILTINS[0];return `${style.size}px "${item.family}", "NoteSans", "Apple Color Emoji", "Segoe UI Emoji", sans-serif`;}
export function renderSticker(text,style,fonts){
 if(!text.trim())return null;
 const probe=document.createElement('canvas'),ctx=probe.getContext('2d');ctx.font=fontString(style,fonts);ctx.textBaseline='alphabetic';
 const textFont=fontString(style,fonts),emojiFont=`${style.size}px "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif`;
 const glyphWidth=g=>{ctx.font=isEmoji(g)?emojiFont:textFont;return ctx.measureText(g).width;};
 const lineWidth=gs=>gs.reduce((w,g)=>w+glyphWidth(g),0)+Math.max(0,gs.length-1)*style.spacing;
 const lines=[];
 for(const paragraph of text.replace(/\r\n?/g,'\n').split('\n')){
  let line=[];
  const words=Array.from(new Intl.Segmenter('zh-Hant',{granularity:'word'}).segment(paragraph.replace(/\t/g,'    ')),x=>x.segment);
  for(const word of words){const units=graphemes(word);if(line.length&&lineWidth([...line,...units])>style.width&&!/^[，。！？、：；,.!?;:)）」』]+$/.test(word)){lines.push(line);line=[];if(/^\s+$/.test(word))continue;}for(const g of units){if(line.length&&lineWidth([...line,g])>style.width&&!/^[，。！？、：；,.!?;:)）」』]$/.test(g)){lines.push(line);line=[];}line.push(g);}}
  lines.push(line);
 }
 let ascent=style.size*.9,descent=style.size*.28,overhang=style.size*.2;
 for(const g of graphemes(text)){ctx.font=isEmoji(g)?emojiFont:textFont;const m=ctx.measureText(g);ascent=Math.max(ascent,m.actualBoundingBoxAscent||0);descent=Math.max(descent,m.actualBoundingBoxDescent||0);overhang=Math.max(overhang,m.actualBoundingBoxLeft||0,(m.actualBoundingBoxRight||0)-m.width);}
 const stroke=style.outline?style.outlineWidth:0;
 const effect=style.shadow?Math.ceil(style.shadowBlur*3+Math.max(Math.abs(style.shadowX),Math.abs(style.shadowY))):0;
 const safe=Math.ceil(overhang+stroke+effect+4),pad=style.padding+safe;
 const inkWidth=Math.max(...lines.map(lineWidth),1),advance=Math.max(style.size*style.lineHeight,ascent+descent);
 const w=Math.ceil(inkWidth+pad*2),h=Math.ceil(ascent+descent+(lines.length-1)*advance+pad*2);
 // Safari has tighter canvas memory budgets. Keep output bounded and fail visibly.
 const scale=Math.min(2,8192/w,8192/h,Math.sqrt(16000000/(w*h)));
 if(scale<.5||lines.length>100)throw new Error('文字太長或字距太大，請分成兩張貼紙，或調小字級。');
 const canvas=document.createElement('canvas');canvas.width=Math.ceil(w*scale);canvas.height=Math.ceil(h*scale);const out=canvas.getContext('2d');out.scale(scale,scale);
 if(style.background){out.fillStyle=style.bgColor;out.globalAlpha=style.bgOpacity;out.beginPath();out.roundRect(safe,safe,w-safe*2,h-safe*2,Math.min(style.radius,(w-safe*2)/2,(h-safe*2)/2));out.fill();out.globalAlpha=1;}
 const layer=document.createElement('canvas');layer.width=canvas.width;layer.height=canvas.height;const pen=layer.getContext('2d');pen.scale(scale,scale);pen.font=fontString(style,fonts);pen.textBaseline='alphabetic';pen.lineJoin='round';pen.fillStyle=style.color;
 lines.forEach((line,index)=>{let x=pad+(style.align==='center'?(inkWidth-lineWidth(line))/2:style.align==='right'?inkWidth-lineWidth(line):0);const y=pad+ascent+index*advance;for(const g of line){pen.font=isEmoji(g)?emojiFont:textFont;if(style.outline&&!isEmoji(g)){pen.strokeStyle=style.outlineColor;pen.lineWidth=style.outlineWidth*2;pen.strokeText(g,x,y);}pen.fillText(g,x,y);x+=glyphWidth(g)+style.spacing;}});
 if(style.shadow){out.shadowColor=style.shadowColor+Math.round(style.shadowOpacity*255).toString(16).padStart(2,'0');out.shadowBlur=style.shadowBlur*scale;out.shadowOffsetX=style.shadowX*scale;out.shadowOffsetY=style.shadowY*scale;}
 out.drawImage(layer,0,0,w,h);
 return {canvas,width:canvas.width,height:canvas.height,lines:lines.length,scaled:scale<1.5};
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

const request=r=>new Promise((resolve,reject)=>{r.onsuccess=()=>resolve(r.result);r.onerror=()=>reject(r.error);});
let db;
export async function openStore(){const r=indexedDB.open('inknote-local-v1',1);r.onupgradeneeded=()=>r.result.createObjectStore('data');db=await request(r);return db;}
export async function get(key){return request(db.transaction('data').objectStore('data').get(key));}
export function putMany(items){return new Promise((resolve,reject)=>{const tx=db.transaction('data','readwrite');for(const [k,v]of items)tx.objectStore('data').put(v,k);tx.oncomplete=resolve;tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error||new Error('保存失敗'));});}
export function toBase64(buffer){let s='';const b=new Uint8Array(buffer);for(let i=0;i<b.length;i+=32768)s+=String.fromCharCode(...b.subarray(i,i+32768));return btoa(s);}
export function fromBase64(s){if(typeof s!=='string'||s.length>28000000||!/^[A-Za-z0-9+/]*={0,2}$/.test(s))throw new Error('備份的字體資料不完整。');return Uint8Array.from(atob(s),c=>c.charCodeAt(0)).buffer;}

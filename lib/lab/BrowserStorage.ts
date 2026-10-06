import type { Simulation } from "../simulation/types";
type Backup={timestamp:number;currentId:string;universes:Record<string,Simulation>};
let connection:Promise<IDBDatabase>|undefined;
function database(){return connection??=new Promise<IDBDatabase>((resolve,reject)=>{const request=indexedDB.open("investlab-worlds",1);request.onupgradeneeded=()=>request.result.createObjectStore("backup");request.onsuccess=()=>resolve(request.result);request.onerror=()=>reject(request.error);});}
export async function readBackup(){const db=await database();return new Promise<Backup|null>((resolve,reject)=>{const tx=db.transaction("backup","readonly"),request=tx.objectStore("backup").get("latest");request.onsuccess=()=>resolve(request.result??null);request.onerror=()=>reject(request.error);});}
let queue=Promise.resolve();
export function saveBackup(value:Backup){const copy=structuredClone(value);const write=async()=>{const db=await database();await new Promise<void>((resolve,reject)=>{const tx=db.transaction("backup","readwrite");tx.objectStore("backup").put(copy,"latest");tx.oncomplete=()=>resolve();tx.onerror=()=>reject(tx.error);tx.onabort=()=>reject(tx.error);});};const result=queue.then(write,write);queue=result.catch(()=>{});return result;}

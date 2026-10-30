/* Copyright © 2026 Muhammad Hashir (https://github.com/mateir0). All rights reserved. See COPYRIGHT.md. */
'use strict';
function interrupted(message,code='request_interrupted'){const error=new Error(message);error.code=code;error.retryable=true;return error;}
async function serviceRequest(path,body,options={},image=false){
 const method=options.method||(body===undefined?'GET':'POST'),controller=new AbortController();
 const timeout=setTimeout(()=>controller.abort(),options.timeoutMs??(method==='GET'?20000:90000));
 const abort=()=>controller.abort();options.signal?.addEventListener('abort',abort,{once:true});if(options.signal?.aborted)abort();
 const headers={};if(body!==undefined)headers['Content-Type']='application/json';if(options.token)headers.Authorization='Bearer '+options.token;if(options.key)headers['Idempotency-Key']=options.key;
 if(path!=='/api/account'&&window.ShowOncePublic?.accountId)headers['X-ShowOnce-Account']=window.ShowOncePublic.accountId;
 try{
  let response;try{response=await fetch(path,{method,headers,body:body===undefined?undefined:JSON.stringify(body),signal:controller.signal});}catch{throw interrupted(method==='GET'?'Could not load the saved record. Check your connection and try again.':'Could not confirm whether the request finished. Check saved progress or retry the same submission.');}
  if(response.status===204)return null;
  if(image&&response.ok){try{return await response.blob();}catch{throw interrupted('The photo download was interrupted. Try viewing it again.');}}
  let value;try{value=await response.json();}catch{throw interrupted('The learning service returned an unreadable response. Refresh saved progress before starting another request.','invalid_response');}
  if(!response.ok){const detail=value?.error;if(!detail?.code||!detail?.message)throw interrupted('The service could not confirm this request. Refresh saved progress before retrying.','invalid_response');const error=new Error(detail.message);error.code=detail.code;error.status=response.status;error.retryable=detail.retryable;if(error.code==='account_changed')window.dispatchEvent?.(new Event('showonce-account-changed'));throw error;}
  return value;
 }finally{clearTimeout(timeout);options.signal?.removeEventListener('abort',abort);}
}
window.ShowOncePublic={
 async config(){return serviceRequest('/api/config',undefined,{method:'GET'});},
 async request(path,body,options={}){return serviceRequest(path,body,options);},
 async image(path,token){return serviceRequest(path,undefined,{method:'GET',token},true);}
};

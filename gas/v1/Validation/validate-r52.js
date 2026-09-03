'use strict';
const fs=require('fs');
const path=require('path');
const root=path.resolve(__dirname,'..');
const gs=path.join(root,'Patch','PSS_Workflow_R52.gs');
const html=path.join(root,'Patch','PSS_Workflow_R52.html');
const requiredBackend=['getProjectQuickIndexR52','getMyWorkInboxR52','getTaskWorkspaceR52','saveTaskWorkspaceR52','completeTaskR52','saveTaskReportR52','getReportWorkspaceR52','saveReportWorkspaceR52','createRelatedTaskR52','setupPssWorkFlowR52','runPssWorkFlowSelfTestR52'];
const requiredFrontend=['pmoR52Front','reportTask=async function','openTaskWorkspaceR52','openReportWorkspaceR52','loadMyWorkInboxR52','searchProjectFor=function'];
let failed=false;
function checkSource(file,chunks){
  chunks.forEach((source,index)=>{try{new Function(source);console.log('OK syntax',path.basename(file),'#'+(index+1))}catch(error){failed=true;console.error('FAIL syntax',file,error.message)}});
}
const gsText=fs.readFileSync(gs,'utf8');
const htmlText=fs.readFileSync(html,'utf8');
checkSource(gs,[gsText]);
checkSource(html,[...htmlText.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/gi)].map(match=>match[1]));
requiredBackend.forEach(name=>{if(!new RegExp('function\\s+'+name+'\\s*\\(').test(gsText)){failed=true;console.error('MISSING backend',name)}});
requiredFrontend.forEach(text=>{if(!htmlText.includes(text)){failed=true;console.error('MISSING frontend',text)}});
if(!htmlText.includes("q('batchStatus_"))console.log('OK removed-field guard: no batchStatus write');else{failed=true;console.error('FAIL batchStatus write still exists')}
console.log(failed?'R5.2 validation FAILED':'R5.2 validation PASSED');
process.exitCode=failed?1:0;

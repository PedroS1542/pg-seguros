const $=id=>document.getElementById(id);
const KEY="seguros_v2"; const MONTHS=["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
let data=JSON.parse(localStorage.getItem(KEY)||"[]");
let editReturnState=null;
data=data.map(x=>({...x,phone:x.phone||"",insurer:x.insurer||"",branch:x.branch||"",startDate:x.startDate||"",endDate:x.endDate||"",claim:x.claim||"Não",endorsement:x.endorsement||"Não",endorsementValue:Number(x.endorsementValue||0),endorsementType:x.endorsementType||"Pagar"}));
const money=n=>Number(n||0).toLocaleString("pt-BR",{style:"currency",currency:"BRL"});
const totalPremium=x=>Number(x.value||0)+(x.endorsement==="Sim"?(x.endorsementType==="Restituir"?-1:1)*Number(x.endorsementValue||0):0);
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
const dateParts=x=>{const d=String(x.endDate||x.startDate||""); const [y,m,day]=d.split("-").map(Number); return {y:y||0,m:m||0,d:day||0};};
const renewalDate=x=>dateParts(x);
function save(){localStorage.setItem(KEY,JSON.stringify(data));renderAll()}
function state(x){
  if(x.status==="Cancelado") return ["status-cancelado","Cancelado"];
  const now=new Date(), y=now.getFullYear(), m=now.getMonth()+1;
  const due=renewalDate(x);
  if(!due.y||!due.m) return ["status-ativo","Ativo"];
  // A renovação é definida automaticamente pelo FINAL DA VIGÊNCIA.
  // Se a data já é de um ano passado (como em planilhas antigas), usamos
  // o próximo aniversário anual no ano atual. Se acabou de ser renovado,
  // a próxima renovação será no mesmo mês do ano seguinte.
  const dueYear=Number(x.lastRenewalYear)?Number(x.lastRenewalYear)+1:Math.max(due.y,y);
  return (y===dueYear && m===due.m) ? ["status-renovar","A renovar"] : ["status-ativo","Ativo"];
}
function showPage(p){
  document.querySelectorAll(".page").forEach(x=>x.classList.add("hidden")); if($(p))$(p).classList.remove("hidden");
  const t={dashboard:["Dashboard","Visão geral da sua carteira"],seguros:["Seguros","Consulte, filtre e gerencie sua carteira"],novo:["Novo seguro","Cadastre os dados do seguro e da vigência"]}[p];
  if(t){$("pageTitle").textContent=t[0];$("pageSubtitle").textContent=t[1]}
  document.querySelectorAll(".nav").forEach(x=>x.classList.toggle("active",x.dataset.page===p));
  if(p==="dashboard")renderDashboard(); if(p==="seguros")renderTable();
}
function newForm(){if($("insuranceForm"))$("insuranceForm").reset();$("editId").value="";$("manualStatus").value="Ativo";$("formTitle").textContent="Cadastrar seguro"}
$("loginForm").addEventListener("submit",e=>{e.preventDefault();if($("username").value==="pgseguros"&&$("password").value==="PgBc@2027"){$("login").classList.add("hidden");$("app").classList.remove("hidden");showPage("dashboard")}else $("loginError").textContent="Usuário ou senha incorretos."});
$("logout").onclick=()=>{$("app").classList.add("hidden");$("login").classList.remove("hidden");$("password").value=""};
document.querySelectorAll(".nav").forEach(b=>b.onclick=()=>b.dataset.page==="novo"?(newForm(),showPage("novo")):showPage(b.dataset.page));
if($("quickNew"))$("quickNew").onclick=()=>{newForm();showPage("novo")};
if($("cancelEdit"))$("cancelEdit").onclick=()=>{newForm();showPage("seguros")};
$("insuranceForm").addEventListener("submit",e=>{
 e.preventDefault(); const id=$("editId").value,old=id?data.find(x=>x.id===id):null;
 const item={id:id||crypto.randomUUID(),client:$("client").value.trim(),phone:$("phone").value.trim(),insurer:$("insurer").value,branch:$("branch").value,value:Number($("value").value),startDate:$("startDate").value,endDate:$("endDate").value,claim:$("claim").value,endorsement:$("endorsement").value,endorsementValue:Number($("endorsementValue").value||0),endorsementType:$("endorsementType").value,status:$("manualStatus").value,note:$("note").value.trim(),lastRenewalYear:id?(old?.lastRenewalYear||null):null,createdAt:old?.createdAt||Date.now()};
 if(id)data=data.map(x=>x.id===id?item:x);else data.push(item);save();showPage("seguros");
 if(id && editReturnState){const ret=editReturnState;editReturnState=null; $("search").value=ret.search||""; $("filterInsurer").value=ret.insurer||""; $("filterBranch").value=ret.branch||""; $("filterRenewal").value=ret.renewal||""; $("filterStatus").value=ret.status||""; renderTable(); const row=document.querySelector(`tr[data-insurance-id="${CSS.escape(id)}"]`); if(row){row.scrollIntoView({behavior:"smooth",block:"center"});row.classList.add("edit-return-highlight");setTimeout(()=>row.classList.remove("edit-return-highlight"),1800)} else window.scrollTo(0,ret.scrollY||0); }
});
function renderDashboard(){
 const now=new Date(), y=now.getFullYear(), m=now.getMonth()+1, today=new Date(y,m-1,now.getDate());
 const active=data.filter(x=>state(x)[1]==="Ativo").length;
 const renewing=data.filter(x=>state(x)[1]==="A renovar");
 $("activeCount").textContent=active; $("renewalCount").textContent=renewing.length;
 const next30=data.filter(x=>{if(state(x)[1]==="Cancelado")return false;const q=renewalDate(x);if(!q.y)return false;let target=new Date(q.y,q.m-1,q.d);while(target<today)target.setFullYear(target.getFullYear()+1);const diff=(target-today)/86400000;return diff>=0&&diff<=30}).length;
 $("next30Count").textContent=next30;
 const recent=[...data].sort((a,b)=>b.createdAt-a.createdAt).slice(0,5); $("lastClient").textContent=recent[0]?.client?recent[0].client.split(" ")[0]:"—";
 const up=[...data].filter(x=>state(x)[1]!=="Cancelado").sort((a,b)=>{const da=renewalDate(a),db=renewalDate(b);let ta=da.y?new Date(da.y,da.m-1,da.d):new Date(9999,0,1),tb=db.y?new Date(db.y,db.m-1,db.d):new Date(9999,0,1);while(ta<today)ta.setFullYear(ta.getFullYear()+1);while(tb<today)tb.setFullYear(tb.getFullYear()+1);return ta-tb}).slice(0,6);
 $("upcomingRenewals").innerHTML=up.length?up.map(x=>{let st=state(x),q=renewalDate(x);return `<div class="renew-item"><span><span class="renew-month">${q.d&&q.m?String(q.d).padStart(2,"0")+"/"+String(q.m).padStart(2,"0"):"—"}</span><br><span class="renew-name">${esc(x.client)}</span><small class="renew-detail">${esc(x.insurer||"—")} · ${esc(x.branch||"—")}</small></span><span class="status ${st[0]}">${st[1]}</span></div>`}).join(""):"<div class='empty'>Nenhuma renovação cadastrada.</div>";
 const counts=Array(12).fill(0); data.forEach(x=>{if(state(x)[1]!=="Cancelado"){const rm=renewalDate(x).m;if(rm>=1&&rm<=12)counts[rm-1]++}}); const max=Math.max(...counts,1),labels=["Jan","Fev","Mar","Abr","Mai","Jun","Jul","Ago","Set","Out","Nov","Dez"];
 $("renewalBars").innerHTML=labels.map((lab,i)=>`<div class="bar-row"><span>${lab}</span><div class="bar-track"><i style="width:${Math.max(counts[i]/max*100,counts[i]?10:0)}%"></i></div><b>${counts[i]}</b></div>`).join("");
 $("recent").innerHTML=recent.map(x=>{let st=state(x);return `<div class="recent-item"><span class="activity-client"><span class="activity-dot ${st[0]}"></span><span><b>${esc(x.client)}</b><br><span class="muted">${esc(x.insurer||"—")} · ${esc(x.branch||"—")}</span></span></span><span><span class="status ${st[0]}">${st[1]}</span><br><b class="activity-value">${money(totalPremium(x))}</b></span></div>`}).join("")||"<div class='empty'>Nenhum seguro cadastrado.</div>";
}
function renderTable(){
 const q=$("search").value.toLowerCase(),ins=$("filterInsurer")?.value||"",br=$("filterBranch")?.value||"",rm=$("filterRenewal")?.value||"",fs=$("filterStatus")?.value||"";
 const rows=data.filter(x=>{const qd=renewalDate(x);return [x.client,x.phone,x.insurer,x.branch].join(" ").toLowerCase().includes(q)&&(!ins||x.insurer===ins)&&(!br||x.branch===br)&&(!rm||String(qd.m)===rm)&&(!fs||state(x)[1]===fs)});
 $("resultCount").textContent=`${rows.length} ${rows.length===1?"registro":"registros"}`;$("empty").classList.toggle("hidden",rows.length>0);
 $("tableBody").innerHTML=rows.map(x=>{let s=state(x),q=renewalDate(x);let renew=s[1]==="A renovar"?`<button class="action renew" onclick="renewItem('${x.id}')">Marcar renovado</button>`:"";let cancel=s[1]!=="Cancelado"?`<button class="action cancel" onclick="cancelItem('${x.id}')">Cancelar</button>`:"";const date=q.d&&q.m?String(q.d).padStart(2,"0")+"/"+String(q.m).padStart(2,"0")+"/"+(q.y||""):"—";return `<tr data-insurance-id="${x.id}"><td><b>${esc(x.client)}</b></td><td>${esc(x.phone||"—")}</td><td>${esc(x.insurer||"—")}</td><td>${esc(x.branch||"—")}</td><td><b>${money(totalPremium(x))}</b></td><td>${date}</td><td><span class="status ${s[0]}">${s[1]}</span>${x.claim==="Sim"?'<span class="tag">Sinistro</span>':""}${x.endorsement==="Sim"?'<span class="tag">Endosso</span>':""}</td><td><button class="action whatsapp" onclick="whatsappItem('${x.id}')" ${x.phone?"":"disabled"}>WhatsApp</button><button class="action edit" onclick="editItem('${x.id}')">Editar</button>${renew}${cancel}<button class="action delete" onclick="deleteItem('${x.id}')">Excluir</button></td></tr>`}).join("");
}
["search","filterInsurer","filterBranch","filterRenewal","filterStatus"].forEach(id=>$(id)?.addEventListener("input",renderTable));
window.editItem=id=>{let x=data.find(v=>v.id===id);if(!x)return;editReturnState={id:x.id,scrollY:window.scrollY,search:$("search").value,insurer:$("filterInsurer").value,branch:$("filterBranch").value,renewal:$("filterRenewal").value,status:$("filterStatus").value};$("editId").value=x.id;$("client").value=x.client||"";$("phone").value=x.phone||"";$("insurer").value=x.insurer||"";$("branch").value=x.branch||"";$("value").value=x.value||"";$("startDate").value=x.startDate||"";$("endDate").value=x.endDate||"";$("claim").value=x.claim||"Não";$("endorsement").value=x.endorsement||"Não";$("endorsementValue").value=x.endorsementValue||"";$("endorsementType").value=x.endorsementType||"Pagar";$("manualStatus").value=x.status==="Cancelado"?"Cancelado":"Ativo";$("note").value=x.note||"";$("formTitle").textContent="Editar seguro";showPage("novo")};
window.whatsappItem=id=>{const x=data.find(v=>v.id===id);if(!x||!x.phone)return;let digits=String(x.phone).replace(/\\D/g,"");if(digits.startsWith("55"))digits=digits.slice(2);if(digits.length===10||digits.length===11){const msg=encodeURIComponent(`Olá, ${x.client}. Aqui é da PG Seguros. Estou entrando em contato sobre o seu seguro.`);window.open(`https://wa.me/55${digits}?text=${msg}`,"_blank")}else alert("O telefone deste cliente não está em um formato válido para WhatsApp.")};
window.renewItem=id=>{let x=data.find(v=>v.id===id);if(x){x.lastRenewalYear=new Date().getFullYear();x.status="Ativo";save()}};
window.cancelItem=id=>{let x=data.find(v=>v.id===id);if(x&&confirm("Marcar este seguro como cancelado?")){x.status="Cancelado";save()}};
window.deleteItem=id=>{if(confirm("Excluir este seguro?")){data=data.filter(x=>x.id!==id);save();showPage("seguros")}};

const norm=s=>String(s??"").normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase().replace(/[^a-z0-9]/g,"");
const cleanCell=v=>{if(v==null)return "";if(typeof v==="number"&&Number.isFinite(v))return String(v).replace(/\.0$/,"");return String(v).trim()};
const pick=(row,names)=>{for(const n of names){const k=Object.keys(row).find(h=>norm(h)===norm(n));if(k!=null&&cleanCell(row[k])!=="")return row[k]}return ""};
function parseMoney(v){if(typeof v==="number")return v;let s=String(v??"").trim();if(!s)return 0;s=s.replace(/R\$|\s/g,"");if(s.includes(","))s=s.replace(/\./g,"").replace(",", ".");return Number(s.replace(/[^0-9.-]/g,""))||0}
function excelDate(v){
 if(v instanceof Date&&!isNaN(v))return `${v.getFullYear()}-${String(v.getMonth()+1).padStart(2,"0")}-${String(v.getDate()).padStart(2,"0")}`;
 if(typeof v==="number"&&Number.isFinite(v)){const d=new Date(Date.UTC(1899,11,30)+v*86400000);return isNaN(d)?"":d.toISOString().slice(0,10)}
 let s=String(v??"").trim();if(!s)return "";
 if(/^\d{4}-\d{1,2}-\d{1,2}$/.test(s)){const [y,m,d]=s.split("-");return `${y}-${String(m).padStart(2,"0")}-${String(d).padStart(2,"0")}`}
 let m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);if(m)return `${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
 m=s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{2})$/);if(m)return `20${m[3]}-${String(m[2]).padStart(2,"0")}-${String(m[1]).padStart(2,"0")}`;
 return "";
}
function importRow(row){
 const client=cleanCell(pick(row,["Cliente","Nome","Nome Segurado","Segurado","Segurado Nome","Cliente Segurado"]));
 const phone=cleanCell(pick(row,["Telefone","Celular","Fone","WhatsApp","Telefone Cliente"]));
 const insurer=cleanCell(pick(row,["Seguradora","Cia","Companhia","Cia Seguradora"]));
 const branch=cleanCell(pick(row,["Ramo","Modalidade","Produto","Tipo de Seguro"]));
 const value=parseMoney(pick(row,["Valor do seguro","Valor","Premio","Prêmio","Premio Anterior","Prêmio Anterior","Premio Total","Prêmio Total","Valor Total","Premio Liquido","Prêmio Líquido"]));
 const startDate=excelDate(pick(row,["Inicio da vigencia","Início da vigência","Inicio Vigencia","Data Inicial","Data Inicio","Vigencia Inicial"]));
 const endDate=excelDate(pick(row,["Final da vigencia","Final da vigência","Fim da vigencia","Fim da vigência","Data Final","Data Fim","Vigencia Final","Vencimento","Final Vigência"]));
 const claim=cleanCell(pick(row,["Teve sinistro","Sinistro","Teve Sinistro?"]))||"Não";
 const endorsement=cleanCell(pick(row,["Teve endosso","Endosso","Teve Endosso?"]))||"Não";
 const endorsementValue=parseMoney(pick(row,["Valor do endosso","Valor Endosso","Endosso Valor"]));
 const endorsementType=cleanCell(pick(row,["Tipo do endosso","Tipo Endosso"]))||"Pagar";
 const note=cleanCell(pick(row,["Observações","Observacao","Observações Gerais","Notas","Observação"]));
 return {client,phone,insurer,branch,value,startDate,endDate,claim:/^sim$/i.test(claim)?"Sim":"Não",endorsement:/^sim$/i.test(endorsement)?"Sim":"Não",endorsementValue,endorsementType:/restit/i.test(endorsementType)?"Restituir":"Pagar",note};
}

// Reconhece a estrutura real das planilhas de renovações: várias abas,
// título nas primeiras linhas e cabeçalho geralmente na linha 3.
function rowsFromSheet(sheet){
 const matrix=XLSX.utils.sheet_to_json(sheet,{header:1,defval:"",raw:true});
 let headerIndex=-1;
 for(let i=0;i<Math.min(matrix.length,20);i++){
   const vals=matrix[i].map(cleanCell).map(norm);
   const hasClient=vals.some(v=>["cliente","segurado","nomesegurado","clientesegurado"].includes(v));
   const hasFinal=vals.some(v=>["finalvigencia","fimdavigencia","datfinal","datafinal","vencimento"].includes(v)||v.includes("finalvigencia"));
   if(hasClient&&hasFinal){headerIndex=i;break;}
 }
 if(headerIndex<0)return [];
 const headers=matrix[headerIndex].map((v,i)=>cleanCell(v)||`COLUNA_${i+1}`);
 return matrix.slice(headerIndex+1).map(row=>{const obj={};headers.forEach((h,i)=>{obj[h]=row[i]??""});return obj;});
}

let importRows=[];
function openImport(){$("importModal").classList.remove("hidden");$("excelFile").value="";$("importPreview").classList.add("hidden");$("importPreview").innerHTML="";$('confirmImport').disabled=true;importRows=[]}
function closeImport(){$("importModal").classList.add("hidden")}
$("importExcel")?.addEventListener("click",openImport);$("closeImport")?.addEventListener("click",closeImport);$("closeImportBtn")?.addEventListener("click",closeImport);$("cancelImport")?.addEventListener("click",closeImport);
$("excelFile")?.addEventListener("change",async e=>{
 const file=e.target.files?.[0];if(!file)return;
 if(typeof XLSX==="undefined"){alert("Não foi possível carregar o leitor de Excel. Verifique sua conexão com a internet e tente novamente.");return}
 try{
  const buf=await file.arrayBuffer();
  const wb=XLSX.read(buf,{type:"array",cellDates:true});
  const all=[];let sheetsUsed=0;let rawRows=0;
  wb.SheetNames.forEach(name=>{const rows=rowsFromSheet(wb.Sheets[name]);if(rows.length){sheetsUsed++;rawRows+=rows.length;rows.forEach(row=>{const item=importRow(row);if(item.client)all.push(item)})}});
  importRows=all;
  const noClient=rawRows-importRows.length;
  const missingEnd=importRows.filter(x=>!x.endDate).length;
  const missingStart=importRows.filter(x=>!x.startDate).length;
  $("importPreview").classList.remove("hidden");
  $("importPreview").innerHTML=`<b>Planilha lida com sucesso.</b><br><strong>${importRows.length}</strong> cliente(s) encontrado(s) em <strong>${sheetsUsed}</strong> aba(s).${noClient?` <span class="warn">${noClient} linha(s) sem nome foram ignoradas.</span>`:""}${missingStart?`<br><span class="warn">${missingStart} cliente(s) estão sem início da vigência. Tudo bem: a renovação continuará funcionando pela Final da vigência.</span>`:""}${missingEnd?`<br><span class="warn">${missingEnd} cliente(s) estão sem Final da vigência e não terão renovação automática até essa data ser informada.</span>`:""}<ul>${importRows.slice(0,5).map(x=>`<li>${esc(x.client)} — ${esc(x.insurer||"sem seguradora")} — ${x.endDate?x.endDate.split("-").reverse().join("/"):"sem final"}</li>`).join("")}</ul>`;
  $("confirmImport").disabled=importRows.length===0;
 }catch(err){console.error(err);alert("Não consegui ler essa planilha. Tente novamente com um arquivo Excel (.xlsx/.xls) ou CSV.");importRows=[];$("confirmImport").disabled=true}
});
$("confirmImport")?.addEventListener("click",()=>{
 if(!importRows.length)return;const now=Date.now();const items=importRows.map((x,i)=>({...x,id:crypto.randomUUID(),status:"Ativo",lastRenewalYear:null,createdAt:now+i}));data=[...data,...items];save();closeImport();showPage("seguros");alert(`${items.length} cliente(s) importado(s) com sucesso!`);
});

function renderAll(){renderDashboard();renderTable()} renderAll();

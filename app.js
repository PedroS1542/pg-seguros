const $=id=>document.getElementById(id);
const KEY="seguros_v2"; const MONTHS=["","Janeiro","Fevereiro","Março","Abril","Maio","Junho","Julho","Agosto","Setembro","Outubro","Novembro","Dezembro"];
let data=JSON.parse(localStorage.getItem(KEY)||"[]");
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
  // No ano do vencimento, durante todo o mês da data final, fica A renovar.
  const dueYear=Number(x.lastRenewalYear)?Number(x.lastRenewalYear)+1:due.y;
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
 $("tableBody").innerHTML=rows.map(x=>{let s=state(x),q=renewalDate(x);let renew=s[1]==="A renovar"?`<button class="action renew" onclick="renewItem('${x.id}')">Marcar renovado</button>`:"";let cancel=s[1]!=="Cancelado"?`<button class="action cancel" onclick="cancelItem('${x.id}')">Cancelar</button>`:"";const date=q.d&&q.m?String(q.d).padStart(2,"0")+"/"+String(q.m).padStart(2,"0")+"/"+(q.y||""):"—";return `<tr><td><b>${esc(x.client)}</b></td><td>${esc(x.phone||"—")}</td><td>${esc(x.insurer||"—")}</td><td>${esc(x.branch||"—")}</td><td><b>${money(totalPremium(x))}</b></td><td>${date}</td><td><span class="status ${s[0]}">${s[1]}</span>${x.claim==="Sim"?'<span class="tag">Sinistro</span>':""}${x.endorsement==="Sim"?'<span class="tag">Endosso</span>':""}</td><td><button class="action edit" onclick="editItem('${x.id}')">Editar</button>${renew}${cancel}<button class="action delete" onclick="deleteItem('${x.id}')">Excluir</button></td></tr>`}).join("");
}
["search","filterInsurer","filterBranch","filterRenewal","filterStatus"].forEach(id=>$(id)?.addEventListener("input",renderTable));
window.editItem=id=>{let x=data.find(v=>v.id===id);if(!x)return;$("editId").value=x.id;$("client").value=x.client||"";$("phone").value=x.phone||"";$("insurer").value=x.insurer||"";$("branch").value=x.branch||"";$("value").value=x.value||"";$("startDate").value=x.startDate||"";$("endDate").value=x.endDate||"";$("claim").value=x.claim||"Não";$("endorsement").value=x.endorsement||"Não";$("endorsementValue").value=x.endorsementValue||"";$("endorsementType").value=x.endorsementType||"Pagar";$("manualStatus").value=x.status==="Cancelado"?"Cancelado":"Ativo";$("note").value=x.note||"";$("formTitle").textContent="Editar seguro";showPage("novo")};
window.renewItem=id=>{let x=data.find(v=>v.id===id);if(x){x.lastRenewalYear=new Date().getFullYear();x.status="Ativo";save()}};
window.cancelItem=id=>{let x=data.find(v=>v.id===id);if(x&&confirm("Marcar este seguro como cancelado?")){x.status="Cancelado";save()}};
window.deleteItem=id=>{if(confirm("Excluir este seguro?")){data=data.filter(x=>x.id!==id);save();showPage("seguros")}};
function renderAll(){renderDashboard();renderTable()} renderAll();

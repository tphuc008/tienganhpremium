
(function(){
"use strict";
const DATA_URL="./data/lessons.json";
const PREVIEW_KEY="tienganhpremium_structure_preview_v1";
const esc=v=>String(v==null?"":v).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]));
const br=v=>esc(v).replace(/\r?\n/g,"<br>");

const richInline=value=>esc(value)
 .replace(/&lt;u&gt;([\s\S]*?)&lt;\/u&gt;/gi,"<u>$1</u>")
 .replace(/\*\*([^*\n]+)\*\*/g,"<strong>$1</strong>")
 .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g,"<em>$1</em>");
function richText(content){
 return String(content||"").replace(/\r/g,"").split("\n").map(line=>{
  const v=line.trim();
  if(!v)return '<div class="lesson-spacer"></div>';
  if(/^#{2,5}\s+/.test(v))return '<h4 class="lesson-subheading">'+richInline(v.replace(/^#{2,5}\s+/,""))+'</h4>';
  if(/^[-*]\s+/.test(v))return '<p class="lesson-bullet">'+richInline(v.replace(/^[-*]\s+/,""))+'</p>';
  if(/^>\s+/.test(v))return '<blockquote class="lesson-quote">'+richInline(v.replace(/^>\s+/,""))+'</blockquote>';
  if(/^---+$/.test(v))return '<hr class="lesson-rule">';
  return '<p class="lesson-paragraph">'+richInline(v)+'</p>';
 }).join("");
}

const blanks=()=>'<div class="placeholder" aria-label="Chưa có nội dung"><div class="bar lg"></div><div class="bar"></div><div class="bar md"></div><div class="bar sm"></div></div>';
const fallback=()=>({version:1,units:[{id:"unit-01",title:"Unit 01",topic:"Vocabulary",published:false,lesson:{overview:"",sections:[],notes:[]},practice:{mcq:[],reading:{title:"",passage:"",questions:[]}}},{id:"unit-02",title:"Unit 02",topic:"Vocabulary",published:false,lesson:{overview:"",sections:[],notes:[]},practice:{mcq:[],reading:{title:"",passage:"",questions:[]}}}]});
let db=fallback();
const state={view:"home",unitId:"unit-01",lessonTab:"lecture",practicePart:"mcq",qIndex:0,answers:{},submitted:false,printType:"lesson",printNotes:true,printAnswers:true,personalDraft:false,printOriginal:false,printText:"",adminJSON:"",adminMessage:"",adminError:false};
const current=()=>db.units.find(u=>u.id===state.unitId)||db.units[0];
const isPublished=u=>u.published===true;
const newQ=u=>u.practice?.mcq||[];
const readQ=u=>u.practice?.reading?.questions||[];
const normalizeQ=q=>{
  if(!q||typeof q!=="object")return {question:"",options:["","","",""],answer:"",explanation:""};
  let options=Array.isArray(q.options)?q.options:(q.options&&typeof q.options==="object"?["A","B","C","D"].map(k=>q.options[k]||""):[q.A||"",q.B||"",q.C||"",q.D||""]);
  options=options.slice(0,4);while(options.length<4)options.push("");
  const raw=String(q.answer||q.correct_answer||q.correctAnswer||"").trim().toUpperCase();
  const answer=/^[ABCD]$/.test(raw)?raw:/^[0-3]$/.test(raw)?"ABCD"[Number(raw)]:"";
  return {question:String(q.question||q.text||q.prompt||""),options:options.map(x=>String(x??"")),answer,explanation:typeof q.explanation==="string"?q.explanation:JSON.stringify(q.explanation||""),part:String(q.part||"")};
};
function normalizeUnit(u,index){
 const lesson=u.lesson||{};
 const p=u.practice||{};
 const r=p.reading||{};
 const notes=Array.isArray(lesson.notes)?lesson.notes.map(n=>typeof n==="string"?n:String(n?.content||n?.text||n?.note||"")):[];
 const sections=Array.isArray(lesson.sections)?lesson.sections.map(s=>typeof s==="string"?{title:"",content:s}:{title:String(s?.title||s?.heading||""),content:String(s?.content||s?.body||"")}):[];
 return {
   id:String(u.id||"unit-"+String(index+1).padStart(2,"0")),
   title:String(u.title||"Unit "+String(index+1).padStart(2,"0")),
   topic:String(u.topic||"Vocabulary"),
   published:u.published===true,
   sourceUrl:String(u.sourceUrl||""),sourceCommentsCount:Number(u.sourceCommentsCount||0),
   lesson:{overview:String(lesson.overview||lesson.content||""),sections,notes,originalSolutions:Array.isArray(lesson.originalSolutions)?lesson.originalSolutions.map(v=>({title:String(v.title||""),content:String(v.content||"")})):[]},
   practice:{mcq:Array.isArray(p.mcq)?p.mcq.map(normalizeQ):[],reading:{title:String(r.title||""),passage:String(r.passage||""),questions:Array.isArray(r.questions)?r.questions.map(normalizeQ):[]}}
 };
}
function normalizeDB(data){if(Array.isArray(data))data={units:data};if(!data||typeof data!=="object")throw Error("JSON không hợp lệ");if(!Array.isArray(data.units))throw Error('Thiếu trường "units"');if(!data.units.length)throw Error("Danh sách Unit đang trống");return {version:1,units:data.units.map(normalizeUnit)};}
async function initialize(){
 try{const response=await fetch(DATA_URL,{cache:"no-store"});if(response.ok)db=normalizeDB(await response.json());}catch(e){console.warn("Load lessons failed",e);}
 try{const draft=localStorage.getItem(PREVIEW_KEY);if(draft){const local=normalizeDB(JSON.parse(draft));db=local;}}catch(e){console.warn("Preview data invalid",e);}
 const id=window.location.hash.slice(1);state.view=["home","unit","lesson","practice","print","admin"].includes(id)?id:"home";state.unitId=db.units[0]?.id;render();
}

function navigation(){
 const unit=current();
 return '<header class="site-header"><div class="brand"><span class="logo">✦</span><span>English Practice Hub</span></div>'+
 '<nav class="nav" aria-label="Điều hướng chính"><button type="button" data-go="home" class="'+(state.view==="home"?"active":"")+'">Thư viện Unit</button>'+
 (state.view!=="home"&&state.view!=="admin"?'<span class="current-unit-pill">'+esc(unit.title)+'</span>':"")+'</nav></header>';
}
function sidebar(){
 const active=state.view;
 return '<aside class="study-sidebar" aria-label="Điều hướng bài học">'+
 '<div class="side-section-label">THƯ VIỆN</div><button type="button" class="side-link '+(active==="home"?"active":"")+'" data-go="home"><span class="side-icon">▦</span> Tất cả Unit</button>'+
 '<div class="side-divider"></div><div class="side-section-label">DANH SÁCH UNIT</div>'+
 db.units.map((u,i)=>'<button type="button" class="side-link side-unit '+(u.id===state.unitId&&active!=="home"?"active-unit":"")+'" data-select-unit="'+esc(u.id)+'"><span class="side-number">'+String(i+1).padStart(2,"0")+'</span><span class="side-unit-title">'+esc(u.title)+'</span></button>').join("")+
 (active!=="home"?'<div class="side-divider"></div><div class="side-section-label">'+esc(current().title).toUpperCase()+'</div>'+
 '<button type="button" class="side-link '+(active==="unit"?"active":"")+'" data-go="unit"><span class="side-icon">◈</span> Tổng quan</button>'+
 '<button type="button" class="side-link '+((active==="lesson"||(active==="print"&&state.printType==="lesson"))?"active":"")+'" data-go="lesson"><span class="side-icon">▤</span> Bài giảng chi tiết</button>'+
 '<button type="button" class="side-link '+((active==="practice"||(active==="print"&&state.printType==="practice"))?"active":"")+'" data-go="practice"><span class="side-icon">✎</span> Bài tập mới</button>':"")+
 '</aside>';
}
function mobileContext(){
 if(state.view==="admin")return "";
 return '<div class="mobile-context"><button class="'+(state.view==="home"?"selected":"")+'" data-go="home">Thư viện</button>'+
 (state.view!=="home"?'<button class="'+(state.view==="unit"?"selected":"")+'" data-go="unit">'+esc(current().title)+'</button><button class="'+(state.view==="lesson"?"selected":"")+'" data-go="lesson">Bài giảng</button><button class="'+(state.view==="practice"?"selected":"")+'" data-go="practice">Bài tập</button>':"")+
 '</div>';
}
function frame(content){
 return navigation()+'<main class="panel workspace-shell '+(state.view==="admin"?"workspace-admin":"")+'">'+
 (state.view==="admin"?"":sidebar())+
 '<section class="page study-main">'+mobileContext()+content+'</section></main>'+
 '<div class="foot">English Practice Hub · Vocabulary</div>';
}

function titleRow(title,suffix){return '<div class="section-title"><h2>'+esc(title)+'</h2><span class="subtle">'+esc(suffix||"")+'</span></div>';}

function home(){
 return '<div class="library-hero"><div><span class="eyebrow">VOCABULARY</span><h1>Thư viện <span class="gradient">Unit.</span></h1><p class="subtle">Bài giảng · Bài tập mới</p></div><div class="library-decoration">Aa</div></div>'+
 titleRow("Danh sách bài học",db.units.length+" Unit")+
 '<div class="cards library-cards">'+db.units.map((u,i)=>'<button type="button" class="unit-card" data-select-unit="'+esc(u.id)+'"><div class="row between"><span class="unitnum">UNIT '+String(i+1).padStart(2,"0")+'</span><span class="badge '+(isPublished(u)?"good":"")+'">'+(isPublished(u)?"Đã xuất bản":"Chưa có bài")+'</span></div><h3>'+esc(u.title)+'</h3><div class="row between"><p>'+esc(u.topic)+'</p><span class="unit-arrow">↗</span></div></button>').join("")+'</div>';
}


function banner(u){
 return '<div class="crumb"><button data-go="home">Thư viện</button> › '+esc(u.title)+'</div>'+
 '<div class="unit-banner unit-banner-compact"><div><span class="eyebrow">VOCABULARY</span><h1>'+esc(u.title)+'</h1><p class="subtle">'+esc(u.topic)+'</p></div><span class="badge '+(isPublished(u)?"good":"")+'">'+(isPublished(u)?"Đã xuất bản":"Bản cấu trúc")+'</span></div>';
}
function sectionHeader(u,section){
 return '<div class="crumb"><button data-go="home">Thư viện</button> › <button data-go="unit">'+esc(u.title)+'</button> › '+esc(section)+'</div>';
}
function choice(icon,title,subtitle,action){
 return '<article class="choice-card study-choice"><span class="choice-icon">'+icon+'</span>'+
 '<div class="choice-copy"><h3>'+title+'</h3><p>'+subtitle+'</p></div>'+
 '<button class="btn primary choice-button" data-go="'+action+'">'+(action==="lesson"?"Đọc bài":"Làm bài")+' →</button></article>';
}
function unitPage(){
 const u=current();
 return banner(u)+'<div class="section-title"><h2>Nội dung học</h2><span class="subtle">02 lựa chọn</span></div>'+
 '<div class="choice-grid study-choice-grid">'+
 choice("▤","Bài giảng chi tiết","Nội dung đã học · Teacher Notes","lesson")+
 choice("✎","Bài tập mới",(newQ(u).length||"10–20")+" câu A–D · Passage / 5 câu","practice")+'</div>';
}

function notes(u){const arr=u.lesson.notes;return arr.length?arr.map((n,i)=>'<div class="note"><strong style="display:block;color:#d6bcfa;font-size:11px;margin-bottom:7px">NOTE '+String(i+1).padStart(2,"0")+'</strong>'+br(n)+'</div>').join(""):blanks();}

function lessonPage(){
 const u=current(),l=u.lesson;
 const tabs=[["lecture","Bài giảng"],["notes","Notes"]].map(([key,label])=>
  '<button class="tab '+(state.lessonTab===key?"active":"")+'" data-lesson-tab="'+key+'">'+label+'</button>').join("");
 const body=state.lessonTab==="notes"?
 '<div class="content-card"><div class="row between"><h3>Teacher Notes</h3><span class="badge">'+l.notes.length+' notes</span></div>'+notes(u)+'</div>':
 '<div class="content-card"><h3>Nội dung bài học</h3>'+(l.overview?'<div class="lecture-text">'+esc(l.overview)+'</div>':blanks())+'</div>'+
 '<div class="content-card"><h3>Kiến thức Vocabulary</h3>'+(l.sections.length?l.sections.map(s=>'<div class="note"><strong>'+esc(s.title)+'</strong><div style="margin-top:8px">'+br(s.content)+'</div></div>').join(""):blanks())+'</div>';
 return sectionHeader(u,"Bài giảng chi tiết")+
 '<div class="row between top workspace-heading"><div><span class="eyebrow">OPTION 01</span><h2>Bài giảng chi tiết</h2></div>'+
 '<button class="btn secondary small" data-print-open="lesson">▣ In bài giảng</button></div>'+
 '<div class="content-grid study-content-grid"><div><div class="tabs">'+tabs+'</div>'+body+'</div>'+
 '<aside class="content-aside"><div class="side-card"><h3>Nội dung</h3><p class="subtle">01 &nbsp; Bài giảng<br>02 &nbsp; Kiến thức<br>03 &nbsp; Notes</p></div>'+
 '<div class="side-card"><h3>'+esc(u.title)+'</h3><p class="subtle">'+l.notes.length+' notes · '+l.sections.length+' mục</p></div></aside></div>';
}

function quizList(){return state.practicePart==="mcq"?newQ(current()):readQ(current());}
function selectedKey(){return current().id+":"+state.practicePart+":"+state.qIndex;}
function questionCard(q,i,total){
 const item=normalizeQ(q);
 const choice=state.answers[selectedKey()]||"";
 let answers=item.options.map((value,j)=>{
  const letter="ABCD"[j],cls=(choice===letter?" selected":"")+(state.submitted&&item.answer===letter?" correct":"")+(state.submitted&&choice===letter&&item.answer!==letter?" wrong":"");
  return '<button class="answer'+cls+'" data-answer="'+letter+'" '+(state.submitted?'disabled':"")+'><span class="letter">'+letter+'</span><span>'+esc(value)+'</span></button>';
 }).join("");
 return '<div class="content-card"><div class="quiz-head"><span class="badge">QUESTION '+String(i+1).padStart(2,"0")+' / '+total+'</span><span class="quiz-count">A · B · C · D</span></div><div class="track"><div class="track-fill" style="width:'+((i+1)/total*100)+'%"></div></div><div class="question">'+richInline(item.question)+'</div><div class="answers">'+answers+'</div>'+
 (state.submitted?'<div class="notice" style="margin-top:15px"><strong class="'+(choice===item.answer?"result-good":"result-bad")+'">Đáp án: '+esc(item.answer||"—")+'</strong>'+(item.explanation?'<div class="explanation-panel">'+richText(item.explanation)+'</div>':"")+'</div>':"")+
 '<div class="row between" style="margin-top:22px"><button class="btn secondary" data-q-prev '+(i===0?"disabled":"")+'>← Trước</button><div class="row"><button class="btn secondary" data-submit>'+(!state.submitted?"Nộp bài":"Xem lại")+'</button><button class="btn primary" data-q-next '+(i>=total-1?"disabled":"")+'>Tiếp →</button></div></div></div>';
}
function quizPlaceholder(){return '<div class="content-card"><div class="quiz-head"><span class="badge">QUESTION 01</span><span class="quiz-count">A · B · C · D</span></div><div class="question" style="color:#b9c5d7">[Nội dung câu hỏi]</div><div class="answers">'+["A","B","C","D"].map(letter=>'<div class="answer"><span class="letter">'+letter+'</span><span class="muted">[Lựa chọn '+letter+']</span></div>').join("")+'</div></div>';}

function practicePage(){
 const u=current(),part=state.practicePart,q=quizList(),reading=u.practice.reading;
 const tabs=[["mcq","10 câu A–D"],["reading","Passage · 5 câu"]].map(([key,label])=>
  '<button class="tab '+(key===part?"active":"")+'" data-practice-tab="'+key+'">'+label+'</button>').join("");
 const passage=part==="reading"?'<div class="content-card"><h3>'+esc(reading.title||"Reading Passage")+'</h3>'+(reading.passage?'<div class="passage">'+esc(reading.passage)+'</div>':blanks())+'</div>':"";
 const question=q.length?questionCard(q,Math.min(state.qIndex,q.length-1),q.length):quizPlaceholder();
 return sectionHeader(u,"Bài tập mới")+
 '<div class="row between top workspace-heading"><div><span class="eyebrow">OPTION 02</span><h2>Bài tập mới</h2><p class="subtle">10 câu trắc nghiệm · Passage 5 câu</p></div>'+
 '<button class="btn secondary small" data-print-open="practice">▣ In bài tập</button></div>'+
 '<div class="tabs">'+tabs+'</div>'+
 '<div class="content-grid study-content-grid"><div>'+passage+question+'</div>'+
 '<aside class="content-aside"><div class="side-card"><h3>Tiến độ</h3><p class="subtle">Trắc nghiệm · '+newQ(u).length+'/10<br>Passage · '+readQ(u).length+'/5</p></div></aside></div>';
}

function printQuestions(questions,start=0){
 return questions.map((q,i)=>{const item=normalizeQ(q);return '<div class="print-question"><strong>'+(start+i+1)+'. '+richInline(item.question||"[Nội dung câu hỏi]")+'</strong>'+item.options.map((x,j)=>'<span class="option">'+["A","B","C","D"][j]+'. '+esc(x||"[Lựa chọn]")+'</span>').join("")+'</div>';}).join("");
}
function printAnswers(questions,start=0){
 return questions.map((q,i)=>{const item=normalizeQ(q);return '<div class="print-question"><strong>'+(start+i+1)+'. '+esc(item.answer||"—")+'</strong>'+(item.explanation?'<div class="explanation">'+esc(item.explanation)+'</div>':"")+'</div>';}).join("");
}
function printBase(){
 const u=current(),l=u.lesson,p=u.practice;
 if(state.printType==="lesson")return '<div class="paper"><span class="masthead">✦ ENGLISH PRACTICE HUB</span><h2>'+esc(u.title)+'</h2><p>'+esc(u.topic)+'</p><div class="rule"></div><h3>Bài giảng chi tiết</h3>'+(l.overview?'<p>'+esc(l.overview)+'</p>':'<div class="empty-slot">Nội dung bài giảng</div>')+l.sections.map(s=>'<h3>'+esc(s.title)+'</h3><p>'+esc(s.content)+'</p>').join("")+(state.printNotes?'<h3>Teacher Notes</h3>'+(l.notes.length?l.notes.map(n=>'<div class="print-note">'+esc(n)+'</div>').join(""):'<div class="empty-slot">Notes</div>'):"")+'</div>';
 const questions=p.mcq,read=p.reading;
 return '<div class="paper"><span class="masthead">✦ ENGLISH PRACTICE HUB</span><h2>'+esc(u.title)+'</h2><p>'+esc(u.topic)+'</p><div class="rule"></div><h3>Phần I · 10 câu trắc nghiệm</h3>'+(questions.length?printQuestions(questions):'<div class="empty-slot">10 câu trắc nghiệm A–D</div>')+
 '<h3>Phần II · Reading Passage</h3>'+(read.passage?'<p>'+esc(read.passage)+'</p>':'<div class="empty-slot">Passage ngắn</div>')+(read.questions.length?printQuestions(read.questions,questions.length):'<div class="empty-slot">5 câu hỏi theo passage</div>')+
 (state.printAnswers?'<div class="answer-key"><h3>Đáp án & Giải thích</h3>'+((questions.length+read.questions.length)?printAnswers(questions)+printAnswers(read.questions,questions.length):'<div class="empty-slot">Đáp án ở cuối tài liệu</div>')+'</div>':"")+'</div>';
}
function paperFromText(text){const u=current();return '<div class="paper"><span class="masthead">✦ ENGLISH PRACTICE HUB</span><h2>'+esc(u.title)+'</h2><p>'+esc(u.topic)+'</p><div class="rule"></div><p>'+esc(text)+'</p></div>';}
function draftText(){
 const u=current(),l=u.lesson,p=u.practice;
 if(state.printType==="lesson")return [u.title,u.topic,"","BÀI GIẢNG CHI TIẾT",l.overview,...l.sections.map(s=>"\n"+s.title+"\n"+s.content),...(state.printNotes?["","TEACHER NOTES",...l.notes.map((n,i)=>(i+1)+". "+n)]:[])].join("\n");
 const all=[...p.mcq,...p.reading.questions];const lines=[u.title,u.topic,"","PHẦN I — "+p.mcq.length+" CÂU VOCABULARY"];
 p.mcq.forEach((q,i)=>{q=normalizeQ(q);lines.push("\n"+(i+1)+". "+q.question);q.options.forEach((v,k)=>lines.push("   "+"ABCD"[k]+". "+v));});
 lines.push("","PHẦN II — READING PASSAGE",p.reading.passage);
 p.reading.questions.forEach((q,i)=>{q=normalizeQ(q);lines.push("\n"+(i+p.mcq.length+1)+". "+q.question);q.options.forEach((v,k)=>lines.push("   "+"ABCD"[k]+". "+v));});
 if(state.printAnswers){lines.push("","ĐÁP ÁN & GIẢI THÍCH");all.forEach((q,i)=>{q=normalizeQ(q);lines.push((i+1)+". "+q.answer+(q.explanation?" — "+q.explanation:""));});}
 return lines.join("\n");
}
function printPage(){
 const u=current(),draft=state.personalDraft;
 return sectionHeader(u,"In tài liệu")+'<div class="row between" style="margin-bottom:20px"><div><span class="eyebrow">PRINT STUDIO</span><h2 style="margin:12px 0 4px">In & Xuất PDF</h2></div><span class="badge">'+esc(u.title)+'</span></div><div class="print-grid"><div class="control"><h3>Tùy chọn bản in</h3><div class="form-row"><label class="form-label" for="print-type">Loại tài liệu</label><select id="print-type" class="field"><option value="lesson" '+(state.printType==="lesson"?"selected":"")+'>Bài giảng chi tiết</option><option value="practice" '+(state.printType==="practice"?"selected":"")+'>Bài tập mới · 10 + 5</option></select></div>'+
 (state.printType==="lesson"?'<label class="checkline">Kèm Teacher Notes<input id="print-notes" type="checkbox" '+(state.printNotes?"checked":"")+'></label>':'<label class="checkline">Đáp án ở cuối file<input id="print-answers" type="checkbox" '+(state.printAnswers?"checked":"")+'></label>')+
 '<div style="height:19px"></div><button class="btn secondary block" data-edit-print>'+(draft?"Hoàn tất chỉnh sửa":"✎ Chỉnh sửa bản in")+'</button>'+
 (draft?'<div class="form-row"><label class="form-label" for="print-editor">Bản cá nhân</label><textarea class="field" id="print-editor" style="min-height:270px">'+esc(state.printText)+'</textarea><button class="btn secondary small" style="margin-top:10px" data-reset-print>Khôi phục</button></div>':"")+
 '<button class="btn primary block" style="margin-top:10px" data-print>↓ In / Lưu PDF</button></div>'+
 '<div class="paper-wrap"><div class="preview-toolbar"><strong>Xem trước</strong><span>A4</span></div><div id="paper-on-screen">'+(draft?paperFromText(state.printText):printBase())+'</div></div></div>';
}
function adminPage(){
 const u=current();
 const status=state.adminMessage?'<div class="validation '+(state.adminError?"error":"")+'">'+br(state.adminMessage)+'</div>':"";
 return '<div class="import-panel"><div class="crumb"><button data-go="home">Trang chủ</button> › Quản lý</div><span class="eyebrow">TEACHER WORKSPACE</span><h2 style="margin:13px 0 5px">Nhập Lesson Pack</h2><p class="subtle">ChatGPT → Copy → Paste</p><div class="admin-grid" style="margin-top:22px"><div class="content-card"><div class="form-row"><label class="form-label" for="import-json">Gói dữ liệu JSON</label><textarea class="field" id="import-json" style="min-height:315px" placeholder="Dán kết quả từ ChatGPT...">'+esc(state.adminJSON)+'</textarea></div><div class="row"><button class="btn primary" data-preview-import>Xem thử</button><button class="btn secondary" data-download-json>Tải lessons.json</button></div>'+status+'</div><aside><div class="side-card"><h3>Dữ liệu hiện tại</h3><p class="subtle">Units · '+db.units.length+'<br>Notes · '+(u.lesson?.notes?.length||0)+'<br>Trắc nghiệm · '+newQ(u).length+'<br>Passage · '+readQ(u).length+' câu</p></div><div class="notice">Nội dung dán ở đây chỉ được lưu thử trên trình duyệt. Để mọi học sinh xem cùng bản, xuất <strong>lessons.json</strong> và cập nhật file đó trên GitHub.</div><button class="btn secondary block" style="margin-top:14px" data-reset-import>Khôi phục dữ liệu GitHub</button></aside></div></div>';
}
function render(){
 const view=state.view;const content=view==="home"?home():view==="unit"?unitPage():view==="lesson"?lessonPage():view==="practice"?practicePage():view==="print"?printPage():adminPage();
 document.getElementById("app").innerHTML=frame(content);
 document.getElementById("print-root").innerHTML=view==="print"?'<div class="paper-wrap">'+(state.personalDraft?paperFromText(state.printText):printBase())+'</div>':"";
 document.title=(view==="home"?"English Practice Hub":current().title)+" · Vocabulary";
}
function go(page){if(!["home","unit","lesson","practice","print","admin"].includes(page))return;state.view=page;window.location.hash=page;window.scrollTo(0,0);render();}
function resetPractice(part){state.practicePart=part;state.qIndex=0;state.answers={};state.submitted=false;render();}
function openPrint(type){state.printType=type;state.personalDraft=false;state.printText="";go("print");}
function previewImport(){
 const raw=document.getElementById("import-json")?.value.trim()||"";state.adminJSON=raw;
 try{const data=normalizeDB(JSON.parse(raw));db=data;state.unitId=db.units[0].id;localStorage.setItem(PREVIEW_KEY,JSON.stringify(db));
 const u=current();const n=newQ(u).length,k=readQ(u).length;state.adminError=false;
 state.adminMessage="Đã lưu bản xem thử.\n"+db.units.length+" Unit · "+n+" câu A–D · "+k+" câu passage"+((n<10||n>20||k!==5)?"\nGợi ý: bộ chuẩn gồm 10–20 câu A–D và 5 câu passage.":"");
 }catch(e){state.adminError=true;state.adminMessage=e.message||"Không đọc được JSON.";}render();
}
function downloadData(){
 const payload=JSON.stringify(db,null,2);const blob=new Blob([payload],{type:"application/json"});const url=URL.createObjectURL(blob);
 const a=document.createElement("a");a.href=url;a.download="lessons.json";document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),500);
 state.adminError=false;state.adminMessage="Đã xuất file lessons.json.";render();
}
function resetData(){localStorage.removeItem(PREVIEW_KEY);state.adminMessage="Đang tải dữ liệu GitHub…";fetch(DATA_URL,{cache:"no-store"}).then(r=>{if(!r.ok)throw Error("Lỗi tải dữ liệu");return r.json();}).then(data=>{db=normalizeDB(data);state.unitId=db.units[0].id;state.adminJSON="";state.adminError=false;state.adminMessage="Đã khôi phục.";render();}).catch(e=>{state.adminError=true;state.adminMessage=String(e.message);render();});}
document.addEventListener("click",e=>{
 const button=e.target.closest("button");if(!button)return;
 if(button.dataset.go){go(button.dataset.go);return;}
 if(button.dataset.selectUnit){state.unitId=button.dataset.selectUnit;state.lessonTab="lecture";resetPractice("mcq");go("unit");return;}
 if(button.dataset.lessonTab){state.lessonTab=button.dataset.lessonTab;render();return;}
 if(button.dataset.practiceTab){resetPractice(button.dataset.practiceTab);return;}
 if(button.dataset.printOpen){openPrint(button.dataset.printOpen);return;}
 if(button.dataset.answer){state.answers[selectedKey()]=button.dataset.answer;render();return;}
 if(button.hasAttribute("data-q-prev")){state.qIndex=Math.max(0,state.qIndex-1);render();return;}
 if(button.hasAttribute("data-q-next")){state.qIndex=Math.min(quizList().length-1,state.qIndex+1);render();return;}
 if(button.hasAttribute("data-submit")){state.submitted=!state.submitted;render();return;}
 if(button.hasAttribute("data-edit-print")){
 if(!state.personalDraft){state.personalDraft=true;state.printText=draftText();}else{state.personalDraft=false;state.printText="";}render();return;}
 if(button.hasAttribute("data-reset-print")){state.printText=draftText();render();return;}
 if(button.hasAttribute("data-print")){window.print();return;}
 if(button.hasAttribute("data-preview-import")){previewImport();return;}
 if(button.hasAttribute("data-download-json")){downloadData();return;}
 if(button.hasAttribute("data-reset-import")){resetData();return;}
});
document.addEventListener("change",e=>{
 if(e.target.id==="print-type"){state.printType=e.target.value;state.personalDraft=false;render();}
 if(e.target.id==="print-notes"){state.printNotes=e.target.checked;state.personalDraft=false;render();}
 if(e.target.id==="print-answers"){state.printAnswers=e.target.checked;state.personalDraft=false;render();}
});
document.addEventListener("input",e=>{
 if(e.target.id==="print-editor"){state.printText=e.target.value;document.getElementById("paper-on-screen").innerHTML=paperFromText(state.printText);document.getElementById("print-root").innerHTML='<div class="paper-wrap">'+paperFromText(state.printText)+'</div>';}
 if(e.target.id==="import-json")state.adminJSON=e.target.value;
});
window.addEventListener("hashchange",()=>{const view=window.location.hash.slice(1);if(["home","unit","lesson","practice","print","admin"].includes(view)&&view!==state.view){state.view=view;render();}});
initialize();
})();
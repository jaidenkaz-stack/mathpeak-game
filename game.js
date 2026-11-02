(() => {
const W=24,H=14, $=id=>document.getElementById(id);
const colors=['#347ba5','#b35c4d','#527955','#9a752b'];
const names=['МЕК-231','МЕК-232','МЕК-233','МЕК-234'];
const icons=['🟦','🟥','🟩','🟨'];
let grid=[],rooms=[],teams=[],mapItems=[],eliminationOrder=[],active=0,rolled=false,moves=0,gameOver=false,modalOpen=false;
const dirs=[[1,0],[-1,0],[0,1],[0,-1]];
function log(msg){const el=$('log');const p=document.createElement('div');p.className='log-entry';p.textContent=msg;el.prepend(p);}
function makeMap(teamCount=4){
 grid=Array.from({length:H},()=>Array(W).fill('wall'));rooms=[];mapItems=[];eliminationOrder=[];
 const carve=(x,y,w,h,type='room',name='Кабинет')=>{for(let yy=y;yy<y+h;yy++)for(let xx=x;xx<x+w;xx++)grid[yy][xx]=type;rooms.push({x,y,w,h,type,name,used:false,content:null});};
 // Main corridor network
 for(let x=1;x<23;x++)grid[6][x]='corridor';
 for(let y=1;y<13;y++) {grid[y][4]='corridor';grid[y][12]='corridor';grid[y][19]='corridor';}
 for(let x=1;x<23;x++){grid[3][x]='corridor';grid[10][x]='corridor';}
 carve(1,1,3,2,'room','Математика');carve(6,1,5,2,'room','Ағылшын');carve(14,1,4,2,'room','География');carve(20,1,3,2,'room','Тарих');
 carve(1,7,3,2,'room','Аудитория 101');carve(6,7,5,2,'room','Кітапхана');carve(14,7,4,2,'room','Зертхана');carve(20,7,3,2,'cafeteria','Асхана');
 carve(1,11,3,2,'room','Аудитория 202');carve(6,11,5,2,'room','Аудитория 203');carve(14,11,4,2,'room','Аудитория 204');carve(20,11,3,2,'room','Аудитория 205');
 // Connect rooms to corridors through doorway cells
 for(const r of rooms){const cx=Math.floor(r.x+r.w/2); if(r.y<=3)grid[Math.min(H-1,r.y+r.h)][cx]='corridor';else grid[Math.max(0,r.y-1)][cx]='corridor';}
 // Every room contains a question. The cafeteria keeps its special food reward.
 for(const r of rooms){r.content=r.type==='cafeteria'?'cafeteria':'question';r.loot=Math.random()<0.67?'pen':'eraser';}
 // Corridor loot: randomly scattered at a rate of about 4 pens and 2 erasers per team.
 const occupied=new Set([[2,6],[21,6],[12,2],[12,10]].map(([x,y])=>`${x},${y}`));
 const spots=[];for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]==='corridor'&&!roomAt(x,y)&&!occupied.has(`${x},${y}`))spots.push({x,y});
 for(let i=spots.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[spots[i],spots[j]]=[spots[j],spots[i]];}
 const penCount=4*teamCount,eraserCount=2*teamCount;for(let i=0;i<Math.min(penCount+eraserCount,spots.length);i++)mapItems.push({...spots[i],type:i<penCount?'pen':'eraser'});
}
function roomAt(x,y){return rooms.find(r=>x>=r.x&&x<r.x+r.w&&y>=r.y&&y<r.y+r.h);}
function initTeams(n){teams=[];const starts=[[2,6],[21,6],[12,2],[12,10]];for(let i=0;i<n;i++)teams.push({id:i,name:names[i],x:starts[i][0],y:starts[i][1],hp:300,students:30,pens:4,erasers:2,food:0,damage:20,defense:0,alive:true,placement:null});active=0;}


// Pixel scene uses Kenney CC0 sprites. Rendering only; collision grid is unchanged.
function floorplan(preview=false){
 let out='<svg class="floorplan" viewBox="0 0 768 448" xmlns="http://www.w3.org/2000/svg" shape-rendering="crispEdges" aria-hidden="true">';
 const rect=(x,y,w,h,c)=>out+='<rect x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" fill="'+c+'"/>';
 const sprite=(cx,cy,x,y,w=16,h=16,city=false)=>{const step=city?16:17;out+='<svg x="'+x+'" y="'+y+'" width="'+w+'" height="'+h+'" viewBox="'+cx*step+' '+cy*step+' 16 16"><image href="assets/'+(city?'campus':'interiors')+'.png" width="'+(city?592:458)+'" height="'+(city?448:305)+'" style="image-rendering:pixelated"/></svg>';};
 rect(0,0,768,448,'#283c35');
 for(let y=0;y<448;y+=8)for(let x=0;x<768;x+=8){if((x*7+y*13)%19<5)rect(x,y,2,2,'#354c3d');}
 // Connected walking surfaces; warm checkerboard corridor stone.
 for(let y=0;y<H;y++)for(let x=0;x<W;x++)if(grid[y][x]!=='wall'){
  rect(x*32,y*32,32,32,'#a38a62');
  for(let yy=0;yy<2;yy++)for(let xx=0;xx<2;xx++){rect(x*32+xx*16,y*32+yy*16,15,15,(xx+yy)%2?'#c8b28b':'#d6c5a0');rect(x*32+xx*16+1,y*32+yy*16+1,13,1,'#e0cfaa');}
 }
 // Garden islands are outside the movement grid.
 [[5,4,6,2],[13,4,6,2],[20,4,3,2],[5,9,6,1],[13,9,6,1]].forEach(([gx,gy,gw,gh])=>{
 const x=gx*32+4,y=gy*32+5,w=gw*32-8,h=gh*32-10;
 rect(x,y,w,h,'#182d2a');rect(x+3,y+3,w-6,h-6,'#618450');rect(x+5,y+5,w-10,2,'#8ba861');
 for(let k=0;k<gw-1;k++){if(gh===1){sprite(33,13,x+8+k*31,y+3,14,14,true);continue;}sprite(33,10,x+8+k*31,y-3,26,26,true);sprite(33,11,x+8+k*31,y+23,26,26,true);}
 if(gh>1){sprite(31,8,x+w-43,y+h-18,18,18,true);sprite(32,8,x+w-25,y+h-18,18,18,true);}
 });
 rooms.forEach((r,i)=>{
 const x=r.x*32,y=r.y*32,w=r.w*32,h=r.h*32;
 // Raised north wall, oak floorboards, skirting and cast shadow.
 rect(x-3,y-12,w+6,h+16,'#342d30');rect(x-1,y-10,w+2,16,'#725140');rect(x,y-9,w,4,'#ba8a5a');rect(x,y-4,w,9,'#c2a477');
 rect(x,y+5,w,h-5,'#9c6846');
 for(let yy=7;yy<h;yy+=8){rect(x+1,y+yy,w-2,7,(yy%3)?'#bd8c5a':'#c59562');for(let xx=(yy%2)*12;xx<w;xx+=24){rect(x+xx,y+yy,1,7,'#9f704b');rect(x+xx+3,y+yy+2,Math.max(0,Math.min(12,w-xx-4)),1,'#cfa16b');}}
 rect(x,y+h-2,w,3,'#624435');rect(x-2,y,3,h,'#74513e');rect(x+w-1,y,3,h,'#74513e');
 // Every room receives a distinct arrangement and subject-specific props.
 if(i===5){ // Library: stacked books, reading tables, runner, lamps.
  for(let k=0;k<r.w-1;k++){sprite(19+k%3,17,x+4+k*28,y+3,26,26);}
  rect(x+15,y+34,w-30,21,'#704655');rect(x+17,y+36,w-34,17,'#a46069');
  for(let k=0;k<3;k++){sprite(7,4,x+22+k*42,y+32,22,22);sprite(18,0,x+25+k*42,y+34,14,14);sprite(1,2,x+26+k*42,y+49,14,14);}
 }else if(i===7){ // Cafeteria kitchen and dining.
  [4,5,8,15].forEach((c,k)=>sprite(c,14,x+2+k*22,y+3,22,22));
  for(let k=0;k<2;k++){sprite(7,4,x+13+k*42,y+34,23,23);sprite(22,8,x+19+k*42,y+37,12,12);sprite(0,2,x+4+k*42,y+39,14,14);sprite(3,2,x+34+k*42,y+39,14,14);}
 }else if(i===6){ // Laboratory: stone benches, sink, cabinets, coloured flasks.
  for(let k=0;k<5;k++)sprite(k===4?8:3,12,x+4+k*23,y+4,23,23);
  for(let k=0;k<4;k++){sprite(28+k%2,7,x+10+k*24,y+5,10,15,true);sprite(22,4,x+15+k*25,y+43,12,12);}
  sprite(0,0,x+14,y+32,26,20);sprite(1,0,x+40,y+32,26,20);sprite(2,0,x+66,y+32,26,20);
 }else if(i===10){ // Music seminar.
  sprite(23,8,x+8,y+6,28,28);sprite(24,8,x+36,y+6,28,28);sprite(1,2,x+27,y+32,18,18);
  sprite(19,17,x+w-30,y+4,26,26);sprite(7,4,x+w-37,y+34,22,22);sprite(18,0,x+w-33,y+35,12,12);
 }else if(i===9){ // Computer classroom.
  for(let k=0;k<4;k++){sprite(7,4,x+9+k*36,y+27,25,25);sprite(24+k%2,8,x+13+k*36,y+22,18,18,true);sprite(1,2,x+15+k*36,y+48,14,14);}
 }else{
  // Blackboard, wall windows and individual desks with books.
  rect(x+8,y+4,Math.min(w-42,55),16,'#594332');rect(x+10,y+6,Math.min(w-46,51),12,'#355549');
  for(let k=0;k<3;k++){rect(x+14+k*12,y+9,7,1,'#b6c8a1');rect(x+14+k*12,y+12,4,1,'#89a78b');}
  sprite(25,16,x+w-27,y+1,22,22,true);
  for(let k=0;k<r.w-1;k++){sprite(7,4,x+9+k*30,y+30,22,22);sprite(1,2,x+13+k*30,y+48,15,15);sprite(18,0,x+12+k*30,y+30,11,11);}
  if(i===2){rect(x+9,y+5,54,16,'#e0c483');rect(x+13,y+7,13,6,'#74a47a');rect(x+28,y+11,11,7,'#7d9f63');rect(x+43,y+8,14,5,'#7caa88');sprite(17,4,x+w-24,y+33,18,18);sprite(18,0,x+w-24,y+7,15,15);}
  if(i===3){rect(x+10,y+6,45,13,'#debd82');for(let k=0;k<4;k++){rect(x+15+k*10,y+9,5,7,'#b48d58');}sprite(19,17,x+w-25,y+27,22,25);}if(i===11){sprite(19,17,x+w-25,y+27,22,25);sprite(17,4,x+12,y+30,17,17);}
 }
 sprite(16,0,x+w-18,y+h-20,16,20);
 const dx=Math.floor(r.x+r.w/2)*32;
 // Thresholds align with the original room entry cells.
 rect(dx+5,r.y<=3?y+h-3:y-3,22,5,'#dfb879');
 // Nameplates sit above furnishings, not across the walking squares.
 const label=r.name.replace('Аудитория ','Ауд. ');const lw=Math.min(w-6,label.length*5.1+10);
 rect(x+3,y-12,lw,11,r.used?'#476344':'#4d3832');
 out+='<text x="'+(x+7)+'" y="'+(y-4)+'" fill="#f9df9e" font-family="Consolas,monospace" font-size="7.5">'+(r.used?'✓ ':'')+label+'</text>';
 });
 return out+'</svg>';
}
function render(){
 const map=$('map');map.innerHTML=floorplan();
 const reachable=rolled&&moves>0&&!gameOver&&!modalOpen&&teams[active].alive?validMoves(teams[active]):[];
 for(let y=0;y<H;y++)for(let x=0;x<W;x++){
  const canMove=reachable.some(p=>p.x===x&&p.y===y),t=document.createElement(canMove?'button':'div');
  t.className='tile '+grid[y][x];const r=roomAt(x,y);const team=teams.find(z=>z.alive&&z.x===x&&z.y===y);
  if(canMove){t.classList.add('reachable');t.setAttribute('aria-label',(r?r.name:'Дәліз')+' '+String.fromCharCode(65+x)+(y+1)+' — жүру');t.addEventListener('click',()=>moveTo(x,y));}
  if(team){t.classList.add(team.id===active?'player':'enemy');t.innerHTML='<span class="token" style="--team:'+colors[team.id]+'"><img src="assets/student-'+team.id+'.png" alt=""><b>0'+(team.id+1)+'</b></span>';t.title=team.name+' · '+team.hp+' HP';}
  else if(r)t.title=r.name+(r.used?' · Зерттелген':' · Зерттелмеген');
  const item=mapItems.find(it=>it.x===x&&it.y===y);if(item&&!team){t.classList.add('resource-item');t.innerHTML=item.type==='pen'?'🖊️':'🧽';t.title=item.type==='pen'?'Ручка':'Өшіргіш';}
  map.appendChild(t);
 }
 renderStats();
}
function renderStats(){
 const me=teams[active];document.querySelector('.squad h2').textContent=me.name.replace(' тобы','');document.querySelector('.squad .eyebrow').textContent='ҚАЗІРГІ ТОП / 0'+(active+1);document.querySelector('.legend-token').textContent='0'+(active+1);document.querySelector('.legend-token').style.background=colors[active];$('playerStats').innerHTML='<div class="hp-heading"><b>'+me.students+' <span>/ 30 студент</span></b></div><div class="health-track" role="meter" aria-label="Топ денсаулығы" aria-valuemin="0" aria-valuemax="300" aria-valuenow="'+me.hp+'"><div class="health-fill" style="width:'+me.hp/3+'%"></div></div><div class="hp-label"><span>Топ денсаулығы</span><span>'+me.hp+' / 300 HP</span></div><div class="combat-stats"><div><b>'+me.damage+'</b>Шабуыл</div><div><b>'+me.defense+'</b>Қорғаныс</div></div><div class="inventory"><div><b>'+me.pens+'</b><span>Ручка</span></div><div><b>'+me.erasers+'</b><span>Өшіргіш</span></div><div><b>'+me.food+'</b><span>Тамақ</span></div></div>';
 $('teamTotal').textContent=String(teams.filter(t=>t.alive).length).padStart(2,'0');
 $('teamList').innerHTML=teams.map(t=>'<div class="team-row '+(t.id===active?'active ':'')+(!t.alive?'defeated':'')+'" style="--team:'+colors[t.id]+'"><span class="team-number"><img src="assets/student-'+t.id+'.png" alt=""><small>0'+(t.id+1)+'</small></span><div><strong>'+t.name.replace(' тобы','')+'</strong><small>'+(t.alive?(t.id===active?'Қазіргі кезек':'Ойыншы '+(t.id+1)):'Ойыннан шықты')+'</small><div class="mini-health"><i style="width:'+t.hp/3+'%"></i></div></div><b>'+t.hp+'<small> HP</small></b></div>').join('');

 $('turnName').textContent=me.name;$('turnType').textContent=gameOver?'Ойын аяқталды':me.name+' · кезек '+turnNumber;
 $('rollBtn').disabled=rolled||gameOver||modalOpen||!me.alive;$('endTurnBtn').disabled=!rolled||gameOver||modalOpen||!me.alive;
 $('moveHint').textContent=gameOver?'Жеңімпаз анықталды.':modalOpen?'Алдымен ашылған оқиғаны аяқтаңыз.':rolled?(moves>0?'Қалған қадам: '+moves+'. Белгіленген торды таңда.':'Қадамдар аяқталды. Кезекті аяқтаңыз.'):'Кубикті лақтырып, қозғалысты бастаңыз.';
 const old=$('extraActions');if(old)old.remove();const extra=document.createElement('div');extra.id='extraActions';extra.className='extra-actions';
 extra.innerHTML='<button id="eatBtn" class="secondary" '+(!playable()||me.food<1||me.hp>=300?'disabled':'')+'>Тамақ · +30 HP ('+me.food+')</button><button id="attackBtn" class="secondary" '+(!playable()||!rolled||turnCombat||!enemiesNear(me).length?'disabled':'')+'>Шайқасу</button>';
 $('playerStats').appendChild(extra);$('eatBtn').onclick=eat;$('attackBtn').onclick=attack;

}
// Local hot-seat rules. All state transitions are synchronous; there are no AI timers.
let modalLocked=false, modalVersion=0, turnNumber=1, turnCombat=false;
function once(fn){let done=false;return (...args)=>{if(done)return;done=true;fn(...args);};}
function bind(id,fn){$(id).onclick=once(fn);}
function playable(){return teams.length&&!gameOver&&!modalOpen&&teams[active].alive;}
function openModal(title,eyebrow,html,locked=true){
 modalVersion++;modalLocked=locked;modalOpen=true;
 $('modalTitle').textContent=title;$('modalEyebrow').textContent=eyebrow;$('modalBody').innerHTML=html;
 $('closeModal').hidden=locked;$('modal').classList.remove('hidden');
 $('game').inert=true;$('setup').inert=true;$('helpBtn').disabled=true;
 if(teams.length)renderStats();
 $('modal').querySelector('button:not([hidden]):not(:disabled)')?.focus();
}
function closeModal(force=false){
 if(modalLocked&&!force)return;
 modalVersion++;modalOpen=false;modalLocked=false;$('modal').classList.add('hidden');
 $('game').inert=false;$('setup').inert=false;$('helpBtn').disabled=false;
 if(teams.length){render();(document.querySelector('.reachable')||(!rolled?$('rollBtn'):$('endTurnBtn')))?.focus();}else $('helpBtn').focus();
}
function notice(title,body,after=()=>{}){openModal(title,'ОҚИҒА',body+'<button id="eventDone" class="primary">Жалғастыру</button>');bind('eventDone',()=>{closeModal(true);after();});}
function handoff(){
 const t=teams[active];openModal(t.name,'КЕЗЕК '+turnNumber,`<p>Құрылғыны <b>${t.name}</b> ойыншысына беріңіз.</p><p>Әр топты адам басқарады. Дайын болғанда кезекті бастаңыз.</p><button id="readyBtn" class="primary">Дайынмын · кезекті бастау</button>`);
 bind('readyBtn',()=>closeModal(true));
}
function advanceTurn(){
 if(gameOver)return;
 if(teams.filter(t=>t.alive).length<=1){finish();return;}
 do{active=(active+1)%teams.length;}while(!teams[active].alive);
 rolled=false;moves=0;turnCombat=false;turnNumber++;$('rollResult').textContent='—';$('rollResult').removeAttribute('aria-label');render();handoff();
}
function passTurn(){if(!playable()||!rolled)return;advanceTurn();}
function roll(){if(!playable()||rolled)return;moves=1+Math.floor(Math.random()*6);rolled=true;$('rollResult').textContent=['','⚀','⚁','⚂','⚃','⚄','⚅'][moves];$('rollResult').setAttribute('aria-label','Кубик: '+moves);log(`${teams[active].name}: ${moves} қадам.`);render();}
function canStep(from,to){
 if(to.x<0||to.x>=W||to.y<0||to.y>=H||grid[to.y][to.x]==='wall')return false;
 // Rooms can be entered/exited only through their visible door.
 const a=roomAt(from.x,from.y),b=roomAt(to.x,to.y);if(a===b)return true;
 const r=a||b;if(!r)return true;
 const inside=a?from:to,outside=a?to:from,cx=Math.floor(r.x+r.w/2);
 return inside.x===cx&&outside.x===cx&&(r.y<=3?inside.y===r.y+r.h-1&&outside.y===r.y+r.h:inside.y===r.y&&outside.y===r.y-1);
}
function validMoves(team){return dirs.map(([dx,dy])=>({x:team.x+dx,y:team.y+dy})).filter(p=>canStep(team,p)&&!teams.some(t=>t.alive&&t.id!==team.id&&t.x===p.x&&t.y===p.y));}
function enemiesNear(t){return teams.filter(z=>z.alive&&z.id!==t.id&&Math.abs(z.x-t.x)+Math.abs(z.y-t.y)===1&&canStep(t,z));}
function resolveLanding(t){
 if(gameOver)return;
 if(!t.alive){advanceTurn();return;}
 const itemIndex=mapItems.findIndex(it=>it.x===t.x&&it.y===t.y);if(itemIndex>=0){const item=mapItems.splice(itemIndex,1)[0];t[item.type==='pen'?'pens':'erasers']++;log(`${t.name} ${item.type==='pen'?'ручка':'өшіргіш'} жинады.`);}
 const r=roomAt(t.x,t.y);if(r&&!r.used)enterRoom(t,r);else render();
}
function moveTo(x,y){
 if(!playable()||!rolled||moves<=0)return;const t=teams[active];if(!validMoves(t).some(p=>p.x===x&&p.y===y))return;
 t.x=x;t.y=y;moves--;render();const enemy=enemiesNear(t)[0];if(enemy){battle(t,enemy,()=>resolveLanding(t));return;}resolveLanding(t);
}
function attack(){if(!playable()||!rolled||turnCombat)return;const t=teams[active],enemies=enemiesNear(t);if(!enemies.length)return;
 if(enemies.length===1){battle(t,enemies[0]);return;}
 openModal('Қарсыласты таңда','ШАЙҚАС',enemies.map(e=>`<button class="answer" data-enemy="${e.id}">${e.name} · ${e.hp} HP</button>`).join(''));
 document.querySelectorAll('[data-enemy]').forEach(b=>b.onclick=once(()=>{const e=teams[Number(b.dataset.enemy)];closeModal(true);battle(t,e);}));
}
function syncStudents(t){const wasAlive=t.alive;t.hp=Math.max(0,Math.min(300,t.hp));t.students=Math.ceil(t.hp/10);t.alive=t.hp>0;if(wasAlive&&!t.alive){if(!eliminationOrder.includes(t.id))eliminationOrder.push(t.id);log(`${t.name} ойыннан шығарылды.`);}}
function heal(t,n){if(!t.alive)return;t.hp=Math.min(300,t.hp+n);syncStudents(t);}
function eat(){if(!playable())return;const t=teams[active];if(t.food<1||t.hp>=300)return;t.food--;heal(t,30);log(`${t.name}: тамақ қолданылды, +30 HP (ең көбі 300).`);render();}
function checkElimination(){if(teams.filter(t=>t.alive).length<=1){finish();return true;}return false;}
function finish(){if(gameOver)return;gameOver=true;moves=0;const winner=teams.find(t=>t.alive);const ranking=[...(winner?[winner]:[]),...eliminationOrder.slice().reverse().map(id=>teams.find(t=>t.id===id)).filter(Boolean)];for(const t of teams)if(!ranking.includes(t))ranking.push(t);const percentages=teams.length===2?[100,45]:teams.length===3?[100,50,25]:[100,50,25,0];const rows=ranking.map((t,i)=>{t.placement=i+1;t.resultPercent=percentages[i]??0;return `<div class="result-row"><b>${i+1}. ${t.name}</b><strong>${t.resultPercent}%</strong></div>`;}).join('');render();log(`${winner?.name||'Ешкім'} жеңді.`);openModal('Ойын аяқталды','ҚОРЫТЫНДЫ НӘТИЖЕ',`<div class="winner">${winner?.name||'Тең ойын'}</div><p>Ойынның соңғы рейтингі:</p>${rows}<button id="restart" class="primary">Қайта бастау</button>`);bind('restart',()=>location.reload());}
function questionTime(difficulty){return difficulty==='Easy'?5:difficulty==='Medium'?10:20;}
function startQuestionTimer(seconds,onExpire){
 let left=seconds;const node=$('questionTimer');if(node)node.textContent=`Уақыт: ${left} сек.`;
 const interval=setInterval(()=>{left--;const el=$('questionTimer');if(el)el.textContent=`Уақыт: ${left} сек.`;if(left<=0){clearInterval(interval);onExpire();}},1000);
 return ()=>clearInterval(interval);
}
function chooseQuestion(subject='any',difficulty=null,onDone){
 const t=teams[active];const bank=window.QUESTION_BANK.filter(q=>(subject==='any'||q.s===subject)&&(!difficulty||q.d===difficulty));
 if(!bank.length){notice('Сұрақ жоқ','<p>Бұл деңгейде сұрақ жоқ.</p>');return;}
 const q=bank[Math.floor(Math.random()*bank.length)],seconds=questionTime(q.d);let retryUsed=false,answered=false,settled=false,stopTimer=()=>{};const excluded=new Set();
 const settle=once(ok=>{settled=true;stopTimer();onDone?.(ok,q);closeModal(true);if(!checkElimination()&&!t.alive)advanceTurn();});
 function show(){
  answered=false;openModal(`${q.s} · ${q.d}`,'СҰРАҚ',`<p>${q.q}</p><p id="questionTimer" class="question-timer">Уақыт: ${seconds} сек.</p><div class="answers">${q.a.map((a,i)=>`<button class="answer" data-answer="${i}" ${excluded.has(i)?'disabled':''}>${String.fromCharCode(65+i)}. ${a}</button>`).join('')}</div><div id="feedback"></div>`);
  const version=modalVersion;stopTimer=startQuestionTimer(seconds,()=>{if(answered||settled||version!==modalVersion)return;answered=true;document.querySelectorAll('[data-answer]').forEach(x=>x.disabled=true);$('feedback').innerHTML='<div class="feedback">Уақыт аяқталды!</div><button id="timeContinue" class="secondary">Жалғастыру</button>';bind('timeContinue',()=>settle(false));});
  document.querySelectorAll('[data-answer]').forEach(b=>b.onclick=()=>{
   if(answered||settled||version!==modalVersion||excluded.has(Number(b.dataset.answer)))return;answered=true;stopTimer();
   document.querySelectorAll('[data-answer]').forEach(x=>x.disabled=true);const i=Number(b.dataset.answer);
   if(i===q.c){$('feedback').innerHTML='<div class="feedback">Дұрыс жауап! Бір жақсартуды таңдаңыз.</div><div class="answers"><button class="answer" data-up="damage">Шабуыл +5</button><button class="answer" data-up="hp">HP +5</button><button class="answer" data-up="defense">Қорғаныс +5</button></div>';
    let awarded=false;document.querySelectorAll('[data-up]').forEach(btn=>btn.onclick=()=>{if(awarded||settled)return;awarded=true;if(btn.dataset.up==='hp')heal(t,5);else t[btn.dataset.up]+=5;settle(true);});
   }else{
    excluded.add(i);$('feedback').innerHTML='<div class="feedback">Қате жауап.</div>'+(t.erasers>0&&!retryUsed?'<button id="eraserBtn" class="secondary">Өшіргіш: сол сұраққа тағы бір мүмкіндік</button>':'')+'<button id="continueBtn" class="secondary">Жалғастыру</button>';
    if($('eraserBtn'))bind('eraserBtn',()=>{if(settled||retryUsed||t.erasers<1)return;t.erasers--;retryUsed=true;show();});
    bind('continueBtn',()=>settle(false));
   }
  });
 }
 show();
}
function enterRoom(t,r){
 if(r.used||!t.alive||gameOver)return;
 if(t.pens<1){notice('Ручка жоқ','<p>Кемінде 1 ручка керек. Ресурс тауып, кейін қайта келуге болады.</p>');return;}
 const subject=({'Математика':'Математика','Ағылшын':'English','География':'Geography','Тарих':'History'})[r.name]||'any';
 const levels=['Easy','Medium','Hard','Expert'].filter(d=>window.QUESTION_BANK.some(q=>(subject==='any'||q.s===subject)&&q.d===d));
 openModal(r.name,r.type==='cafeteria'?'АСХАНА · 1 РУЧКА':'СҰРАҚ · 1 РУЧКА','<p>Қиындық деңгейін таңдаңыз. Уақыт: Easy — 5 сек., Medium — 10 сек., Hard/Expert — 20 сек.</p><div class="answers">'+levels.map(l=>`<button class="answer" data-level="${l}">${l}</button>`).join('')+'</div>');
 let started=false;document.querySelectorAll('[data-level]').forEach(b=>b.onclick=()=>{if(started)return;started=true;r.used=true;t.pens--;chooseQuestion(subject,b.dataset.level,ok=>{const loot=r.loot|| (Math.random()<0.67?'pen':'eraser');t[loot==='pen'?'pens':'erasers']++;r.loot=null;if(ok&&r.type==='cafeteria')t.food++;log(`${t.name}: ${r.name} — ${ok?'дұрыс жауап':'қате жауап'}. ${loot==='pen'?'1 ручка':'1 өшіргіш'} алынды.`);render();});});
}
function battle(a,b,after=()=>render()){
 if(gameOver||turnCombat||!a.alive||!b.alive)return;turnCombat=true;moves=0;
 const subjects=['Математика','English','Geography','History'];
 const availableSubjects=subjects.filter(subject=>window.QUESTION_BANK.some(q=>q.s===subject));
 const subject=availableSubjects[Math.floor(Math.random()*availableSubjects.length)];
 const subjectQuestions=window.QUESTION_BANK.filter(q=>q.s===subject);
 const availableDifficulties=['Easy','Medium','Hard','Expert'].filter(d=>subjectQuestions.some(q=>q.d===d));
 const difficulty=availableDifficulties[Math.floor(Math.random()*availableDifficulties.length)];
 const pool=subjectQuestions.filter(q=>q.d===difficulty);
 const chosen={subject,difficulty};
 const qA=pool[Math.floor(Math.random()*pool.length)];let qB=pool.length>1?pool.filter(q=>q!==qA)[Math.floor(Math.random()*(pool.length-1))]:qA;
 const questions=[qA,qB],seconds=questionTime(chosen.difficulty),answers=[null,null],times=[Infinity,Infinity];
 function take(index){const t=index===0?a:b,q=questions[index];
  openModal(t.name,'ШАЙҚАС · ҚҰРЫЛҒЫНЫ БЕРІҢІЗ',`<p>Пән: <b>${chosen.subject}</b> · Деңгей: <b>${chosen.difficulty}</b></p><p>Құрылғыны <b>${t.name}</b> ойыншысына беріңіз. Екінші ойыншы жауапты көрмеуі керек.</p><button id="battleReady" class="primary">Дайынмын</button>`);
  bind('battleReady',()=>{
   openModal(t.name,'ШАЙҚАС · ЖАУАП',`<p>${q.q}</p><p id="questionTimer" class="question-timer">Уақыт: ${seconds} сек.</p><div class="answers">${q.a.map((v,i)=>`<button class="answer" data-battle="${i}">${String.fromCharCode(65+i)}. ${v}</button>`).join('')}</div>`);
   let submitted=false;const version=modalVersion,startedAt=performance.now();const stopTimer=startQuestionTimer(seconds,()=>{if(submitted||version!==modalVersion)return;submitted=true;answers[index]=-1;times[index]=Infinity;if(index===0)take(1);else result();});
   document.querySelectorAll('[data-battle]').forEach(btn=>btn.onclick=()=>{if(submitted||version!==modalVersion)return;submitted=true;stopTimer();answers[index]=Number(btn.dataset.battle);times[index]=performance.now()-startedAt;if(index===0)take(1);else result();});
  });
 }
 function result(){
  const ac=answers[0]===qA.c,bc=answers[1]===qB.c;let winner=null,loser=null,dmg=0;
  if(ac&&bc){if(times[0]<times[1]){winner=a;loser=b;}else if(times[1]<times[0]){winner=b;loser=a;}}
  else if(ac!==bc){winner=ac?a:b;loser=ac?b:a;}
  if(winner&&loser){const pct={Easy:.2,Medium:.3,Hard:.4,Expert:.5}[chosen.difficulty];dmg=Math.max(10,Math.round(loser.hp*pct)+winner.damage-loser.defense);loser.hp-=dmg;syncStudents(loser);
   if(!loser.alive){for(const key of ['pens','erasers','food']){winner[key]+=loser[key];loser[key]=0;}}
   else {if(loser.pens>0)loser.pens--;winner.pens++;log(`${winner.name} жеңгені үшін 1 ручка алды.`);}
  }
  const message=winner?`${winner.name} жеңді. ${loser.name}: −${dmg} HP.`:'Жеңімпаз жоқ: екі жауап та дұрыс емес немесе уақыт аяқталды.';
  log(message);openModal('Шайқас нәтижесі','ШАЙҚАС',`<p><b>${chosen.subject} · ${chosen.difficulty}</b></p><p>${a.name}: ${ac?'дұрыс':'қате/уақыт бітті'}${ac?' · '+(times[0]/1000).toFixed(2)+' сек.':''}<br>${b.name}: ${bc?'дұрыс':'қате/уақыт бітті'}${bc?' · '+(times[1]/1000).toFixed(2)+' сек.':''}</p><p>${a.name}: ${qA.q}<br>Дұрыс жауап: ${qA.a[qA.c]}</p><p>${b.name}: ${qB.q}<br>Дұрыс жауап: ${qB.a[qB.c]}</p><div class="feedback">${message}</div><p>Екі топқа пән мен қиындық деңгейі бірдей, бірақ сұрақтары бөлек берілді.</p><button id="battleDone" class="primary">Жалғастыру</button>`);
  bind('battleDone',()=>{closeModal(true);if(checkElimination())return;if(!teams[active].alive){advanceTurn();return;}after();});
 }
 take(0);
}
$('startBtn').onclick=()=>{
 if(teams.length)return;const teamCount=Number($('teamCount').value);makeMap(teamCount);initTeams(teamCount);$('setup').classList.add('hidden');$('game').classList.remove('hidden');log('Ойын басталды. Барлық топты адамдар басқарады.');render();handoff();
};
$('rollBtn').onclick=roll;$('endTurnBtn').onclick=passTurn;$('closeModal').onclick=()=>closeModal();
$('helpBtn').onclick=()=>{if(modalOpen)return;openModal('Ойын ережесі','2–4 ОЙЫНШЫ · БІР ҚҰРЫЛҒЫ','<ul><li>Барлық топтарды адамдар кезекпен басқарады. Кезек алдында құрылғыны келесі ойыншыға беріңіз.</li><li>Кубик 1–6 қадам береді. Кабинеттерге тек есік арқылы кіруге болады.</li><li>Ойын басында әр топта 4 ручка және 2 өшіргіш болады.</li><li>Дәліздерде әр топқа шаққанда шамамен 4 ручка және 2 өшіргіш кездейсоқ шашылады: үстіне тоқтағанда автоматты түрде жиналады. Әр кабинетте сұрақтан кейін тек 1 зат — ручка немесе өшіргіш беріледі. Сұраққа кіру үшін 1 ручка керек.</li><li>Кабинетте сұрақ деңгейін таңдауға болады. Easy — 5 сек., Medium — 10 сек., Hard/Expert — 20 сек.</li><li>Дұрыс жауап бір рет +5 шабуыл, HP немесе қорғаныс береді. Бір өшіргіш сол сұраққа бір қосымша мүмкіндік береді.</li><li>Тамақ 30 HP қалпына келтіреді, ең көбі 300 HP.</li><li>Шайқаста пән мен қиындық деңгейі кездейсоқ таңдалады; деңгей таңдау мүмкін емес. Екі топқа бір пәннен және бірдей қиындық деңгейінен екі түрлі сұрақ беріледі. Дұрыс жауап бергендердің жылдамы жеңеді.</li><li>Тірі қалған қарсыласты жеңсең, одан 1 ручка аласың. Қарсылас толық жеңіліп ойыннан шықса, барлық ресурсы саған өтеді.</li><li>Соңғы нәтиже: 4 топта 1-орын — 100%, 2-орын — 50%, 3-орын — 25%, 4-орын — 0%; 3 топта — 100%, 50%, 25%; 2 топта — 100% және 45%.</li></ul>',false);};
let zoom=1;function setZoom(delta){zoom=Math.min(1.6,Math.max(1,Math.round((zoom+delta)*10)/10));$('map').style.width=zoom*100+'%';$('zoomLabel').textContent=Math.round(zoom*100)+'%';$('zoomOut').disabled=zoom<=1;$('zoomIn').disabled=zoom>=1.6;}setZoom(0);$('zoomIn').onclick=()=>setZoom(.2);$('zoomOut').onclick=()=>setZoom(-.2);
document.addEventListener('keydown',e=>{if(!modalOpen)return;if(e.key==='Escape'){closeModal();return;}if(e.key==='Tab'){const list=[...$('modal').querySelectorAll('button:not(:disabled):not([hidden])')];const first=list[0],last=list[list.length-1];if(e.shiftKey&&document.activeElement===first){e.preventDefault();last.focus();}else if(!e.shiftKey&&document.activeElement===last){e.preventDefault();first.focus();}}});
makeMap();$('previewMap').innerHTML=floorplan(true);$('previewMap').firstChild.classList.remove('floorplan');
})();

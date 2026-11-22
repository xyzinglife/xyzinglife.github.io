/* ===== v4 additions — Motion Studio 21: Anime.js timelines / GLSL shader pond / Web Audio ===== */
(function(){
'use strict';
var __dbg=/[?&]debug=1/.test(location.search);
window.__axState={};
if(__dbg){
  window.__axErrs=[];
  window.addEventListener('error',function(e){ window.__axErrs.push(String(e.message||e.error||'err')); });
  var dv=document.createElement('div');
  dv.id='axDebug';
  dv.style.cssText='position:fixed;top:0;left:0;right:0;z-index:9999;background:rgba(0,0,0,.82);color:#7dff8a;font:11px/1.5 monospace;padding:6px 8px;white-space:pre-wrap;pointer-events:none';
  document.addEventListener('DOMContentLoaded',function(){ document.body.appendChild(dv); });
  setInterval(function(){ if(dv.parentNode) dv.textContent='STATE '+JSON.stringify(window.__axState)+'\nERRS '+window.__axErrs.slice(-3).join(' | '); },700);
}
var hasAnime = typeof window.anime === 'function';
function revealNow(el){ el.style.opacity=1; el.style.transform='none'; }

/* ---------- scroll-to cards ---------- */
document.querySelectorAll('[data-scrollto]').forEach(function(b){
  b.addEventListener('click',function(){
    var t=document.getElementById(b.dataset.scrollto);
    if(t) t.scrollIntoView({behavior:'smooth',block:'start'});
  });
});

/* ---------- Anime.js scroll reveals + chapter progress ---------- */
var chapTotal=document.querySelectorAll('[data-chap]').length, chapRead=0;
var progFill=document.getElementById('axProgFill');
var progTxt=document.getElementById('axProgTxt');
function updProg(){ if(progFill) progFill.style.width=(chapTotal?Math.round(chapRead/chapTotal*100):0)+'%'; if(progTxt) progTxt.textContent='已 讀 '+chapRead+' / '+chapTotal+' 章'; }
var io2=new IntersectionObserver(function(es){
  es.forEach(function(e){
    if(!e.isIntersecting) return;
    var el=e.target;
    if(hasAnime){ anime({targets:el,opacity:[0,1],translateY:[30,0],duration:950,easing:'easeOutExpo'}); }
    else revealNow(el);
    if(el.hasAttribute('data-chap') && !el.classList.contains('read')){
      el.classList.add('read'); chapRead++; updProg();
    }
    io2.unobserve(el);
  });
},{threshold:.22});
document.querySelectorAll('.ax-reveal').forEach(function(el){ io2.observe(el); });

/* ---------- gallery lightbox ---------- */
var figs=[].slice.call(document.querySelectorAll('[data-lb]')), lbIdx=0;
var lb=document.getElementById('axLightbox'), lbImg=document.getElementById('axLbImg'),
    lbTitle=document.getElementById('axLbTitle'), lbText=document.getElementById('axLbText');
function showLb(i){
  lbIdx=(i+figs.length)%figs.length;
  var f=figs[lbIdx], img=f.querySelector('img');
  lbImg.src=img.src; lbTitle.textContent=f.dataset.title||''; lbText.textContent=f.dataset.cap||'';
  if(hasAnime) anime({targets:lbImg,scale:[.94,1],opacity:[0,1],duration:520,easing:'easeOutBack'});
}
figs.forEach(function(f,i){ f.addEventListener('click',function(){ lb.classList.add('show'); showLb(i); }); });
document.getElementById('axLbClose').addEventListener('click',function(){ lb.classList.remove('show'); });
document.getElementById('axLbPrev').addEventListener('click',function(){ showLb(lbIdx-1); });
document.getElementById('axLbNext').addEventListener('click',function(){ showLb(lbIdx+1); });
lb.addEventListener('click',function(e){ if(e.target===lb) lb.classList.remove('show'); });

/* ---------- calligraphy: brush writes the seven characters ---------- */
(function(){
  var cv=document.getElementById('axCallig'); if(!cv) return;
  var ctx=cv.getContext('2d'), W=cv.width, H=cv.height;
  var chars=['鄧','機','長','的','雞','巴','大'];
  var off=document.createElement('canvas'); off.width=W; off.height=H;
  var octx=off.getContext('2d');
  var state={p:0}, cur=0, playing=false;
  function drawChar(ch,verm){
    octx.clearRect(0,0,W,H);
    octx.font='520px BrushFull, serif';
    octx.textAlign='center'; octx.textBaseline='middle';
    octx.fillStyle=verm?'#e0492f':'#f6f0e1';
    octx.fillText(ch,W/2,H/2+18);
  }
  function render(){
    ctx.clearRect(0,0,W,H);
    /* faint grid */
    ctx.strokeStyle='rgba(217,169,79,.14)'; ctx.lineWidth=2;
    ctx.strokeRect(40,40,W-80,H-80);
    ctx.beginPath(); ctx.moveTo(W/2,40); ctx.lineTo(W/2,H-40); ctx.moveTo(40,H/2); ctx.lineTo(W-40,H/2); ctx.stroke();
    var p=state.p, sweep=p*W;
    ctx.save();
    ctx.beginPath();
    ctx.moveTo(0,0);
    for(var y=0;y<=H;y+=34){ ctx.lineTo(sweep+Math.sin(y*.05+performance.now()*.0002)*7*(p>0&&p<1?1:0), y); }
    ctx.lineTo(0,H); ctx.closePath(); ctx.clip();
    ctx.drawImage(off,0,0);
    ctx.restore();
    if(p>0 && p<1){ /* brush head */
      var bx=sweep, by=H*.68+Math.sin(performance.now()*.01)*8;
      var g=ctx.createRadialGradient(bx,by,4,bx,by,52);
      g.addColorStop(0,'rgba(30,22,10,.95)'); g.addColorStop(.7,'rgba(30,22,10,.55)'); g.addColorStop(1,'rgba(30,22,10,0)');
      ctx.fillStyle=g; ctx.beginPath(); ctx.ellipse(bx,by,26,52,.2,0,6.29); ctx.fill();
    }
    /* progress dots */
    for(var i=0;i<chars.length;i++){
      ctx.beginPath(); ctx.arc(W/2+(i-3)*30,H-24,6,0,6.29);
      ctx.fillStyle=i<cur?'#d9a94f':(i===cur?'#e0492f':'rgba(246,240,225,.25)'); ctx.fill();
    }
  }
  function playChar(){
    if(cur>=chars.length){ playing=false; state.p=1; render(); return; }
    drawChar(chars[cur], chars[cur]==='雞'||chars[cur]==='巴');
    state.p=0;
    if(hasAnime){
      anime({targets:state,p:1,duration:1500,easing:'easeInOutQuad',
        update:render,
        complete:function(){ setTimeout(function(){ cur++; playChar(); },420); }});
    } else { state.p=1; render(); setTimeout(function(){ cur++; playChar(); },500); }
  }
  function playAll(){ if(playing) return; playing=true; cur=0; playChar(); }
  document.getElementById('axCalligReplay').addEventListener('click',function(){ playing=false; setTimeout(playAll,60); });
  var started=false;
  var io3=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting && !started){ started=true;
      if(document.fonts && document.fonts.load){ document.fonts.load('100px BrushFull').then(function(){ setTimeout(playAll,250); }); }
      else setTimeout(playAll,250);
    }});
  },{threshold:.4});
  io3.observe(cv);
  render();
})();

/* ================= POND: GLSL water + koi + sound ================= */
(function(){
  var panel=document.getElementById('panel-pond'); if(!panel) return;
  var glCv=document.getElementById('pondGL'), koiCv=document.getElementById('pondKoi');
  var gl=glCv.getContext('webgl',{preserveDrawingBuffer:true})||glCv.getContext('experimental-webgl',{preserveDrawingBuffer:true});
  var prog=null, uTime=null, uRip=null, uRes=null, startT=Date.now();
  var rips=[]; for(var i=0;i<12;i++) rips.push([9,9,-99]);
  var ripIdx=0;
  if(gl){
    var vs='attribute vec2 p;void main(){gl_Position=vec4(p,0.,1.);}';
    var fs=[
      'precision highp float;',
      'uniform float uT; uniform vec2 uR; uniform vec3 uRip[12]; uniform vec3 uTint;',
      'float n2(vec2 q){return sin(q.x)*cos(q.y);}',
      'void main(){',
      ' vec2 uv=gl_FragCoord.xy/uR;',
      ' float t=uT*.14;',
      ' float w=n2(uv*vec2(6.,9.)+vec2(t*1.3,t))*.5+n2(uv*vec2(11.,15.)-vec2(t,t*1.7))*.3+n2(uv*vec2(23.,29.)+t*2.)*.2;',
      ' vec3 deep=vec3(.012,.05,.13), lite=vec3(.05,.16,.32);',
      ' vec3 col=mix(deep,lite,.5+.5*w);',
      ' float ring=0.;',
      ' for(int i=0;i<12;i++){ vec3 r=uRip[i]; float age=uT-r.z; if(age<0.||age>4.) continue;',
      '   float d=distance(uv*vec2(uR.x/uR.y,1.), r.xy*vec2(uR.x/uR.y,1.));',
      '   ring+=sin(d*46.-age*7.)*exp(-d*4.5)*exp(-age*1.1)*.16; }',
      ' col+=vec3(.45,.6,.85)*ring;',
      ' col+=vec3(.85,.68,.3)*pow(max(0.,w),3.)*.14;',
      ' float vig=smoothstep(1.25,.35,distance(uv,vec2(.5,.45)));',
      ' gl_FragColor=vec4(col*vig*uTint,1.); }'
    ].join('\n');
    function sh(type,src){ var s=gl.createShader(type); gl.shaderSource(s,src); gl.compileShader(s); return s; }
    prog=gl.createProgram();
    gl.attachShader(prog,sh(gl.VERTEX_SHADER,vs));
    gl.attachShader(prog,sh(gl.FRAGMENT_SHADER,fs));
    gl.linkProgram(prog); gl.useProgram(prog);
    var buf=gl.createBuffer(); gl.bindBuffer(gl.ARRAY_BUFFER,buf);
    gl.bufferData(gl.ARRAY_BUFFER,new Float32Array([-1,-1,1,-1,-1,1,1,1]),gl.STATIC_DRAW);
    var loc=gl.getAttribLocation(prog,'p'); gl.enableVertexAttribArray(loc); gl.vertexAttribPointer(loc,2,gl.FLOAT,false,0,0);
    uTime=gl.getUniformLocation(prog,'uT'); uRip=gl.getUniformLocation(prog,'uRip'); uRes=gl.getUniformLocation(prog,'uR');
    var uTint=gl.getUniformLocation(prog,'uTint');
  }
  function addRipple(nx,ny){
    rips[ripIdx]=[nx,ny,(Date.now()-startT)/1000]; ripIdx=(ripIdx+1)%12;
  }

  /* --- koi (2D canvas, spring steering) --- */
  var kx=koiCv.getContext('2d'), KW=0, KH=0, DPR=1;
  var kois=[], pellets=[], fed=0, running=false, rafId=null;
  var COLORS=['#e0492f','#f7cf6b','#f6f0e1','#e0492f','#d9a94f'];
  var sizeTries=0;
  function sizeKoi(){
    DPR=Math.min(devicePixelRatio||1,2);
    KW=koiCv.clientWidth; KH=koiCv.clientHeight;
    if((KW<200||KH<200) && sizeTries<12){ sizeTries++; setTimeout(sizeKoi,120); return; }
    sizeTries=0;
    if(KW<50){ KW=koiCv.parentNode?koiCv.parentNode.clientWidth||360:360; }
    if(KH<50){ KH=koiCv.parentNode?koiCv.parentNode.clientHeight||480:480; }
    koiCv.width=KW*DPR; koiCv.height=KH*DPR; kx.setTransform(DPR,0,0,DPR,0,0);
    glCv.width=KW*DPR; glCv.height=KH*DPR; if(gl) gl.viewport(0,0,glCv.width,glCv.height);
    if(!kois.length){ for(var i=0;i<5;i++) kois.push({
      x:Math.random()*KW, y:Math.random()*KH, vx:0, vy:0,
      tx:Math.random()*KW, ty:Math.random()*KH,
      c:COLORS[i%COLORS.length], ph:Math.random()*6.28, s:.8+Math.random()*.5 }); }
  }
  function drawKoi(k,t){
    var sp=Math.hypot(k.vx,k.vy), ang=Math.atan2(k.vy,k.vx);
    kx.save(); kx.translate(k.x,k.y); kx.rotate(ang);
    var wag=Math.sin(t*.012/k.s + k.ph)* (0.25+ Math.min(sp*.06,.3));
    kx.fillStyle=k.c; kx.globalAlpha=.92;
    kx.beginPath(); /* body */
    kx.moveTo(16*k.s,0);
    kx.bezierCurveTo(8*k.s,-8*k.s,-10*k.s,-7*k.s,-16*k.s,0);
    kx.bezierCurveTo(-10*k.s,7*k.s,8*k.s,8*k.s,16*k.s,0);
    kx.fill();
    kx.save(); kx.translate(-16*k.s,0); kx.rotate(wag); /* tail */
    kx.beginPath(); kx.moveTo(0,0); kx.lineTo(-13*k.s,-7*k.s); kx.lineTo(-11*k.s,0); kx.lineTo(-13*k.s,7*k.s); kx.closePath();
    kx.globalAlpha=.65; kx.fill(); kx.restore();
    kx.fillStyle='rgba(10,10,10,.75)'; /* eye */
    kx.beginPath(); kx.arc(10*k.s,-3*k.s,1.6*k.s,0,6.29); kx.fill();
    kx.restore(); kx.globalAlpha=1;
  }
  function pondLoop(){
    if(!running) return;
    var __st=window.__axState.pond||(window.__axState.pond={frames:0});
    __st.frames++; __st.KW=KW; __st.KH=KH; __st.kois=kois.length; __st.gl=!!gl; __st.prog=!!prog; __st.cw=koiCv.width; __st.ch=koiCv.height; __st.clw=koiCv.clientWidth; __st.clh=koiCv.clientHeight;
    var t=(Date.now()-startT)/1000;
    try{ if(gl && prog){
      gl.useProgram(prog);
      gl.uniform1f(uTime,t);
      if(uTint){ var tt=.5+.5*Math.sin(t*.07), rr=.82, gg=.9, bb=1.06;
        if(window.d3 && d3.interpolateRgb){ try{ var s=d3.interpolateRgb('rgb(209,230,255)','rgb(255,237,209)')(tt), n=s.match(/[\d.]+/g);
          if(n){ rr=+n[0]/255; gg=+n[1]/255; bb=+n[2]/255; } }catch(_e2){} }
        gl.uniform3f(uTint,rr,gg,bb); }
      gl.uniform2f(uRes,glCv.width,glCv.height);
      var flat=[]; rips.forEach(function(r){ flat.push(r[0],r[1],r[2]); });
      gl.uniform3fv(uRip,new Float32Array(flat));
      gl.drawArrays(gl.TRIANGLE_STRIP,0,4);
    } else {
      kx.fillStyle='#071630'; kx.fillRect(0,0,KW,KH);
    } }catch(e){ window.__axErrs && window.__axErrs.push('pondGL: '+e.message); }
    kx.clearRect(0,0,KW,KH);
    /* pellets */
    for(var j=pellets.length-1;j>=0;j--){ var pl=pellets[j];
      pl.r-=.006; if(pl.r<=0){ pellets.splice(j,1); continue; }
      kx.fillStyle='rgba(247,207,107,.9)';
      kx.beginPath(); kx.arc(pl.x,pl.y,3.4*pl.r+1,0,6.29); kx.fill();
    }
    kois.forEach(function(k){
      var tgt=null, best=1e12;
      pellets.forEach(function(pl){ var d=(pl.x-k.x)*(pl.x-k.x)+(pl.y-k.y)*(pl.y-k.y); if(d<best){best=d;tgt=pl;} });
      if(tgt){ k.tx=tgt.x; k.ty=tgt.y; if(best<320){ tgt.r-=.05; pluck(660+Math.random()*220); } }
      else if(Math.hypot(k.tx-k.x,k.ty-k.y)<26){ k.tx=30+Math.random()*(KW-60); k.ty=30+Math.random()*(KH-60); }
      /* spring steering (maath-style damp) */
      k.vx += ((k.tx-k.x)*.9 - k.vx*2.2)*.016*3.2;
      k.vy += ((k.ty-k.y)*.9 - k.vy*2.2)*.016*3.2;
      var sp=Math.hypot(k.vx,k.vy), mx=(pellets.length?3.6:2.4)*k.s;
      if(sp>mx){ k.vx*=mx/sp; k.vy*=mx/sp; }
      k.x+=k.vx; k.y+=k.vy;
      drawKoi(k,performance.now());
    });
    rafId=requestAnimationFrame(pondLoop);
  }
  function dropFood(x,y,n){
    for(var i=0;i<(n||6);i++) pellets.push({x:x+(Math.random()*36-18), y:y+(Math.random()*36-18), r:1});
    addRipple(x/KW, 1-(y/KH));
  }
  koiCv.addEventListener('pointerdown',function(e){
    var r=koiCv.getBoundingClientRect();
    dropFood(e.clientX-r.left, e.clientY-r.top, 3); pluck(520+Math.random()*160);
  });
  document.getElementById('pondFeed').addEventListener('click',function(){
    fed++; document.getElementById('pondFed').textContent=fed;
    dropFood(KW*(.25+Math.random()*.5), KH*(.3+Math.random()*.4), 9);
    pluck(587); setTimeout(function(){pluck(880);},110);
  });

  /* --- ambient sound: Tone.js (lazy) water + pentatonic plucks, WebAudio fallback --- */
  var AC=null, soundOn=false, waterGain=null, ambTimer=null;
  var SCALE=[523.25,587.33,659.25,783.99,880.0];
  var toneState='idle', toneWaiters=[], toneSynth=null, toneNoiseGain=null;
  function loadTone(cb){
    if(window.Tone){ cb(true); return; }
    if(toneState==='failed'){ cb(false); return; }
    toneWaiters.push(cb);
    if(toneState==='loading') return;
    toneState='loading';
    var s=document.createElement('script'); s.src='tone.js';
    s.onload=function(){ toneState='ready'; toneWaiters.forEach(function(f){f(true);}); toneWaiters=[]; };
    s.onerror=function(){ toneState='failed'; toneWaiters.forEach(function(f){f(false);}); toneWaiters=[]; };
    document.head.appendChild(s);
  }
  function pluck(f){
    if(!soundOn) return;
    if(toneSynth){ try{ toneSynth.triggerAttack(f); }catch(e){} return; }
    if(!AC) return;
    var o=AC.createOscillator(), g=AC.createGain();
    o.type='triangle'; o.frequency.value=f;
    g.gain.setValueAtTime(.14,AC.currentTime);
    g.gain.exponentialRampToValueAtTime(.0001,AC.currentTime+1.1);
    o.connect(g); g.connect(AC.destination); o.start(); o.stop(AC.currentTime+1.15);
  }
  function ambienceStart(){
    clearInterval(ambTimer);
    ambTimer=setInterval(function(){ if(soundOn && Math.random()<.75) pluck(SCALE[Math.floor(Math.random()*SCALE.length)]); },3600);
  }
  function initTone(){
    Tone.start();
    if(!toneSynth){
      toneSynth=new Tone.PluckSynth({attackNoise:1.4,dampening:4000,resonance:.97});
      toneSynth.volume.value=-10; toneSynth.toDestination();
      var noise=new Tone.Noise('brown'); noise.start();
      var filt=new Tone.Filter(380,'lowpass');
      toneNoiseGain=new Tone.Gain(0);
      noise.connect(filt); filt.connect(toneNoiseGain); toneNoiseGain.toDestination();
    }
    toneNoiseGain.gain.rampTo(.16,.9);
    ambienceStart();
  }
  function initWA(){
    if(!AC){
      AC=new (window.AudioContext||window.webkitAudioContext)();
      var len=2*AC.sampleRate, buf=AC.createBuffer(1,len,AC.sampleRate), d=buf.getChannelData(0), last=0;
      for(var i=0;i<len;i++){ var w=Math.random()*2-1; last=(last+.02*w)/1.02; d[i]=last*3.2; }
      var src=AC.createBufferSource(); src.buffer=buf; src.loop=true;
      var f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420;
      waterGain=AC.createGain(); waterGain.gain.value=0;
      src.connect(f); f.connect(waterGain); waterGain.connect(AC.destination); src.start();
    }
    AC.resume(); waterGain.gain.linearRampToValueAtTime(.12,AC.currentTime+1.2);
    ambienceStart();
  }
  function setSound(on){
    soundOn=on;
    document.getElementById('pondSound').textContent=on?'聽水 · 關':'聽水 · 開';
    if(on){ loadTone(function(ok){ if(!soundOn) return; if(ok) initTone(); else initWA(); }); }
    else {
      clearInterval(ambTimer);
      if(toneNoiseGain) toneNoiseGain.gain.rampTo(0,.4);
      if(waterGain && AC) waterGain.gain.linearRampToValueAtTime(0,AC.currentTime+.5);
    }
  }
  document.getElementById('pondSound').addEventListener('click',function(){ setSound(!soundOn); });

  var pObs=new MutationObserver(function(){
    var open=panel.classList.contains('open');
    if(open && !running){ running=true; requestAnimationFrame(function(){ requestAnimationFrame(function(){ sizeKoi(); pondLoop(); addRipple(.5,.5); }); }); }
    if(!open && running){ running=false; if(rafId) cancelAnimationFrame(rafId); if(soundOn) setSound(false); }
  });
  pObs.observe(panel,{attributes:true,attributeFilter:['class']});
})();

/* ================= BRUSH: tracing panel (layered canvases, incremental strokes) ================= */
(function(){
  var panel=document.getElementById('panel-brush'); if(!panel) return;
  var guide=document.getElementById('brushGuide'), draw=document.getElementById('brushCanvas');
  var gtx=guide.getContext('2d'), dtx=draw.getContext('2d');
  var W=draw.width, H=draw.height;
  var chars=['鄧','機','長','的','雞','巴','大'], ci=0;
  var GRID=68, cell=W/GRID, targets=null, covered=null, totalT=0, coveredN=0, lastPct=-1;
  var drawing=false, lastPt=null, inited=false;
  var fill=document.getElementById('brushFill'), msg=document.getElementById('brushMsg'), pctEl=document.getElementById('brushPct');
  function verm(){ return chars[ci]==='雞'||chars[ci]==='巴'; }
  function buildGuide(){
    var off=document.createElement('canvas'); off.width=W; off.height=H;
    var o=off.getContext('2d');
    o.font='470px BrushFull, serif'; o.textAlign='center'; o.textBaseline='middle';
    o.fillStyle='#fff'; o.fillText(chars[ci],W/2,H/2+14);
    var data=o.getImageData(0,0,W,H).data;
    targets=new Uint8Array(GRID*GRID); covered=new Uint8Array(GRID*GRID); totalT=0; coveredN=0; lastPct=-1;
    for(var gy=0;gy<GRID;gy++) for(var gx=0;gx<GRID;gx++){
      var px=Math.min(W-1,(gx+.5)*cell|0), py=Math.min(H-1,(gy+.5)*cell|0);
      if(data[(py*W+px)*4+3]>90){ targets[gy*GRID+gx]=1; totalT++; }
    }
    gtx.clearRect(0,0,W,H);
    gtx.strokeStyle='rgba(217,169,79,.16)'; gtx.lineWidth=2;
    gtx.strokeRect(26,26,W-52,H-52);
    gtx.beginPath();
    gtx.moveTo(W/2,26); gtx.lineTo(W/2,H-26); gtx.moveTo(26,H/2); gtx.lineTo(W-26,H/2);
    gtx.moveTo(26,26); gtx.lineTo(W-26,H-26); gtx.moveTo(W-26,26); gtx.lineTo(26,H-26);
    gtx.stroke();
    gtx.font='470px BrushFull, serif'; gtx.textAlign='center'; gtx.textBaseline='middle';
    gtx.fillStyle=verm()?'rgba(224,73,47,.20)':'rgba(246,240,225,.15)';
    gtx.fillText(chars[ci],W/2,H/2+14);
    dtx.clearRect(0,0,W,H);
    updMsg(0,true);
    var __bs2=window.__axState.brush||(window.__axState.brush={downs:0}); __bs2.totalT=totalT; __bs2.ci=ci;
  }
  function updMsg(pct,force){
    if(!force && pct===lastPct) return; lastPct=pct;
    fill.style.width=pct+'%'; if(pctEl) pctEl.textContent='描摹 '+pct+'%';
    if(pct>=85) msg.textContent='形神兼備！這一字，機長點頭。';
    else if(pct>=60) msg.textContent='已得其形——過六成了，這一字成了。';
    else if(pct>=25) msg.textContent='漸入佳境，筆勢再放開些。';
    else if(pct>0) msg.textContent='落筆了。照著淡字，慢慢描滿。';
    else msg.textContent='落筆吧，第一筆最難，也最痛快。';
  }
  function mark(x,y){
    var rad=30, gx0=Math.max(0,(x-rad)/cell|0), gx1=Math.min(GRID-1,(x+rad)/cell|0),
        gy0=Math.max(0,(y-rad)/cell|0), gy1=Math.min(GRID-1,(y+rad)/cell|0), hit=false;
    for(var gy=gy0;gy<=gy1;gy++) for(var gx=gx0;gx<=gx1;gx++){
      var cx=(gx+.5)*cell, cy=(gy+.5)*cell;
      if((cx-x)*(cx-x)+(cy-y)*(cy-y)<rad*rad && targets[gy*GRID+gx] && !covered[gy*GRID+gx]){ covered[gy*GRID+gx]=1; coveredN++; hit=true; }
    }
    if(hit) updMsg(Math.round(coveredN/totalT*100));
  }
  function seg(x,y){
    dtx.strokeStyle=verm()?'rgba(255,120,90,.92)':'rgba(255,233,176,.92)';
    dtx.lineWidth=27; dtx.lineCap='round'; dtx.lineJoin='round';
    dtx.beginPath(); dtx.moveTo(lastPt[0],lastPt[1]); dtx.lineTo(x,y); dtx.stroke();
    lastPt=[x,y]; mark(x,y);
  }
  function pos(e){ var r=draw.getBoundingClientRect(); return [(e.clientX-r.left)*W/r.width,(e.clientY-r.top)*H/r.height]; }
  draw.addEventListener('pointerdown',function(e){ e.preventDefault();
    try{ draw.setPointerCapture(e.pointerId); }catch(err){}
    var __bs=window.__axState.brush||(window.__axState.brush={downs:0}); __bs.downs++;
    drawing=true; lastPt=pos(e);
    dtx.fillStyle=verm()?'rgba(255,120,90,.92)':'rgba(255,233,176,.92)';
    dtx.beginPath(); dtx.arc(lastPt[0],lastPt[1],13,0,6.29); dtx.fill(); mark(lastPt[0],lastPt[1]); });
  draw.addEventListener('pointermove',function(e){ if(!drawing) return;
    var evs=e.getCoalescedEvents?e.getCoalescedEvents():[e];
    for(var i=0;i<evs.length;i++){ var p=pos(evs[i]); seg(p[0],p[1]); } });
  ['pointerup','pointercancel'].forEach(function(ev){ draw.addEventListener(ev,function(){ drawing=false; }); });
  /* mouse fallback: some environments synthesize pointer events poorly */
  draw.addEventListener('mousedown',function(e){ var __bs=window.__axState.brush||(window.__axState.brush={downs:0}); __bs.mdown=1;
    drawing=true; lastPt=pos(e);
    dtx.fillStyle=verm()?'rgba(255,120,90,.92)':'rgba(255,233,176,.92)';
    dtx.beginPath(); dtx.arc(lastPt[0],lastPt[1],13,0,6.29); dtx.fill(); mark(lastPt[0],lastPt[1]); });
  draw.addEventListener('mousemove',function(e){ if(!drawing) return; var p=pos(e); seg(p[0],p[1]); });
  addEventListener('mouseup',function(){ drawing=false; });
  document.getElementById('brushNext').addEventListener('click',function(){ ci=(ci+1)%chars.length; buildGuide(); });
  document.getElementById('brushClear').addEventListener('click',function(){ buildGuide(); });
  window.__axBrushTest=function(){ /* headless self-test: spiral over the guide char */
    var cx=W/2, cy=H/2;
    drawing=true; lastPt=[cx-150,cy];
    for(var a=0;a<12.6;a+=.22){ var r=20+a*11.5, x=cx+Math.cos(a)*r, y=cy+Math.sin(a)*r*.92; seg(x,y); }
    drawing=false;
  };
  var bObs=new MutationObserver(function(){
    if(panel.classList.contains('open') && !inited){
      inited=true;
      if(document.fonts && document.fonts.load){ document.fonts.load('100px BrushFull').then(buildGuide); }
      else buildGuide();
      setTimeout(function(){ var __r=draw.getBoundingClientRect(); var __bs=window.__axState.brush||(window.__axState.brush={downs:0});
        __bs.rect=[Math.round(__r.left),Math.round(__r.top),Math.round(__r.width),Math.round(__r.height)];
        if(/[?&]debug=1/.test(location.search) && window.__axBrushTest) __axBrushTest(); },1500);
    }
  });
  bObs.observe(panel,{attributes:true,attributeFilter:['class']});
})();

/* ---------- deep links: #pond / #brush / #scroll ---------- */
setTimeout(function(){
  var h=location.hash;
  if(h==='#pond' && window.openPanel) openPanel('panel-pond');
  else if(h==='#brush' && window.openPanel){ openPanel('panel-brush');
    if(/[?&]draw=1/.test(location.search)) setTimeout(function(){ if(window.__axBrushTest) __axBrushTest(); },900); }
  else if(h==='#scroll'){ var t=document.getElementById('ax-scroll'); if(t) t.scrollIntoView(); }
  else if(h && h.length>1){ var g=document.getElementById(h.slice(1)); if(g) g.scrollIntoView(); }
},450);
})();

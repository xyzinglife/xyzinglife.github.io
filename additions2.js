/* ===== v4.2 module features: svg.filter 活墨 / Three.js 雲端 / Pixi 金塵 / canvas-record 錄影 ===== */
function loadScript(src){
  return new Promise(function(res,rej){
    var s=document.createElement('script'); s.src=src;
    s.onload=function(){res();}; s.onerror=function(){rej(new Error(src));};
    document.head.appendChild(s);
  });
}
function whenVisible(el,fn){
  if(!el) return;
  var done=false;
  var io=new IntersectionObserver(function(es){
    es.forEach(function(e){ if(e.isIntersecting && !done){ done=true; io.disconnect(); fn(); } });
  },{rootMargin:'320px'});
  io.observe(el);
}
function tipFail(id,txt){ var t=document.getElementById(id); if(t) t.textContent=txt; }

/* ---------- 活墨：svg.filter.js animated turbulence ---------- */
whenVisible(document.getElementById('axInkSvg'), async function(){
  var turb=document.getElementById('axInkTurb');
  try{
    await loadScript('svg.min.js');
    await loadScript('svg.filter.js');
    var draw=window.SVG('#axInkSvg');
    var g=draw.find('g')[0];
    var turbNode=null;
    g.filterWith(function(add){
      turbNode=add.turbulence(0.012,0.02,2).attr({seed:7});
      add.displacementMap(turbNode,14);
    });
    var t0=performance.now();
    (function anim(){
      var t=(performance.now()-t0)/1000;
      var fx=0.012+Math.sin(t*.23)*0.004, fy=0.02+Math.cos(t*.17)*0.006;
      if(turbNode) turbNode.attr({baseFrequency:fx.toFixed(4)+' '+fy.toFixed(4)});
      requestAnimationFrame(anim);
    })();
  }catch(e){
    /* fallback: animate the built-in filter's turbulence directly */
    if(turb){ var t1=performance.now();
      (function anim2(){
        var t=(performance.now()-t1)/1000;
        turb.setAttribute('baseFrequency',(0.012+Math.sin(t*.23)*0.004).toFixed(4)+' '+(0.02+Math.cos(t*.17)*0.006).toFixed(4));
        requestAnimationFrame(anim2);
      })();
    }
  }
});

/* ---------- 雲端：Three.js + three-mesh-bvh + maath + troika text ---------- */
whenVisible(document.getElementById('ax3dBox'), async function(){
  var box=document.getElementById('ax3dBox');
  try{
    var THREE=await import('three');
    var bvh=await import('three-mesh-bvh');
    var maath=null; try{ maath=await import('maath'); }catch(e){}
    var W=box.clientWidth, H=box.clientHeight;
    var renderer=new THREE.WebGLRenderer({antialias:true,alpha:true});
    renderer.setPixelRatio(Math.min(devicePixelRatio||1,2));
    renderer.setSize(W,H);
    box.appendChild(renderer.domElement);
    var scene=new THREE.Scene();
    var camera=new THREE.PerspectiveCamera(55,W/H,.1,100);
    camera.position.set(0,.4,8.4);
    scene.add(new THREE.AmbientLight(0x8899bb,.8));
    var key=new THREE.PointLight(0xf7cf6b,60,30); key.position.set(3,3,4); scene.add(key);
    var rim=new THREE.PointLight(0x4285f4,40,30); rim.position.set(-4,-2,3); scene.add(rim);
    var group=new THREE.Group(); scene.add(group);
    /* star dust */
    var N=2000, pos=new Float32Array(N*3), col=new Float32Array(N*3);
    var cGold=new THREE.Color('#f7cf6b'), cBlue=new THREE.Color('#9db8dd'), cWhite=new THREE.Color('#f6f0e1'), tmp=new THREE.Color();
    for(var i=0;i<N;i++){
      var r=2.6+Math.random()*3.4, th=Math.random()*Math.PI*2, ph=Math.acos(2*Math.random()-1);
      pos[i*3]=r*Math.sin(ph)*Math.cos(th); pos[i*3+1]=r*Math.cos(ph)*.62; pos[i*3+2]=r*Math.sin(ph)*Math.sin(th);
      var pick=Math.random(); tmp.copy(pick<.45?cGold:(pick<.75?cBlue:cWhite));
      if(window.d3 && d3.interpolateRgb){ try{ var s=d3.interpolateRgb('#f7cf6b','#9db8dd')(Math.random()), m=s.match(/[\d.]+/g);
        if(m) tmp.setRGB(+m[0]/255,+m[1]/255,+m[2]/255); }catch(_e){} }
      col[i*3]=tmp.r; col[i*3+1]=tmp.g; col[i*3+2]=tmp.b;
    }
    var pg=new THREE.BufferGeometry();
    pg.setAttribute('position',new THREE.BufferAttribute(pos,3));
    pg.setAttribute('color',new THREE.BufferAttribute(col,3));
    var stars=new THREE.Points(pg,new THREE.PointsMaterial({size:.05,vertexColors:true,transparent:true,opacity:.95,blending:THREE.AdditiveBlending,depthWrite:false}));
    group.add(stars);
    /* 墨玉 jade with BVH-accelerated raycast */
    var jadeGeo=new THREE.IcosahedronGeometry(1.18,0);
    jadeGeo.boundsTree=new bvh.MeshBVH(jadeGeo);
    var jadeMat=new THREE.MeshStandardMaterial({color:'#175c3a',metalness:.35,roughness:.32,flatShading:true,emissive:'#000000'});
    var jade=new THREE.Mesh(jadeGeo,jadeMat);
    jade.raycast=bvh.acceleratedRaycast;
    group.add(jade);
    /* floating brush text: troika, fallback to canvas texture */
    var textObj=null;
    try{
      var troika=await import('troika-three-text');
      var tx=new troika.Text();
      tx.text='鄧機長的雞巴大'; tx.font='brush-full.woff2'; tx.fontSize=.6;
      tx.color='#f6f0e1'; tx.anchorX='center'; tx.anchorY='middle';
      tx.position.set(0,2.35,0); tx.material.depthWrite=false;
      scene.add(tx); tx.sync(); textObj=tx;
      setTimeout(function(){ if(!tx.geometry){ scene.remove(tx); addFallbackText(); } },7000);
    }catch(e){ addFallbackText(); }
    function addFallbackText(){
      if(textObj && textObj._fallback) return;
      var cv=document.createElement('canvas'); cv.width=1024; cv.height=160;
      var c=cv.getContext('2d'); c.font='110px BrushFull, serif'; c.textAlign='center'; c.textBaseline='middle';
      c.fillStyle='#f6f0e1'; c.fillText('鄧機長的雞巴大',512,84);
      var sp=new THREE.Sprite(new THREE.SpriteMaterial({map:new THREE.CanvasTexture(cv),transparent:true,depthWrite:false}));
      sp.scale.set(5.4,.85,1); sp.position.set(0,2.35,0); scene.add(sp);
      textObj={_fallback:true};
    }
    document.getElementById('ax3dTip').style.display='none';
    /* interaction: drag to rotate (maath damp), tap jade via raycast */
    var targetRX=.12, targetRY=.4, downAt=0, lastX=0, lastY=0, dragging=false, pulse=0;
    var ray=new THREE.Raycaster(); ray.params.Points.threshold=.1;
    var el=renderer.domElement;
    el.style.touchAction='none';
    el.addEventListener('pointerdown',function(e){ dragging=true; downAt=performance.now(); lastX=e.clientX; lastY=e.clientY; el.setPointerCapture(e.pointerId); });
    el.addEventListener('pointermove',function(e){ if(!dragging) return;
      targetRY+=(e.clientX-lastX)*.008; targetRX+=(e.clientY-lastY)*.005;
      targetRX=Math.max(-.9,Math.min(.9,targetRX)); lastX=e.clientX; lastY=e.clientY; });
    el.addEventListener('pointerup',function(e){ dragging=false;
      if(performance.now()-downAt<260){
        var r=el.getBoundingClientRect();
        var nd=new THREE.Vector2(((e.clientX-r.left)/r.width)*2-1, -((e.clientY-r.top)/r.height)*2+1);
        ray.setFromCamera(nd,camera);
        var hits=ray.intersectObject(jade);
        if(hits.length){ pulse=1;
          if(window.d3 && d3.interpolateRgb){ try{ var s=d3.interpolateRgb('#175c3a','#f7cf6b')(.55), m=s.match(/[\d.]+/g);
            if(m) jadeMat.emissive.setRGB(+m[0]/255*.6,+m[1]/255*.6,+m[2]/255*.6); }catch(_e){} }
        }
      } });
    var visible=true;
    new IntersectionObserver(function(es){ es.forEach(function(e){ visible=e.isIntersecting; }); },{threshold:.05}).observe(box);
    var clock=new THREE.Clock();
    renderer.setAnimationLoop(function(){
      if(!visible) return;
      var dt=Math.min(clock.getDelta(),.05);
      var dampF=(maath && maath.easing && maath.easing.damp) ? maath.easing.damp : null;
      if(dampF){
        group.rotation.y=dampF(group.rotation.y,targetRY,4,dt);
        group.rotation.x=dampF(group.rotation.x,targetRX,4,dt);
      } else { group.rotation.y+=(targetRY-group.rotation.y)*Math.min(1,dt*5); group.rotation.x+=(targetRX-group.rotation.x)*Math.min(1,dt*5); }
      if(!dragging) targetRY+=dt*.07;
      stars.rotation.y+=dt*.02;
      pulse=Math.max(0,pulse-dt*1.6);
      var sc=1+pulse*.35; jade.scale.set(sc,sc,sc);
      jadeMat.emissiveIntensity=1;
      if(pulse===0) jadeMat.emissive.setRGB(0,0,0);
      jade.rotation.y+=dt*.25; jade.rotation.x+=dt*.11;
      renderer.render(scene,camera);
    });
    addEventListener('resize',function(){
      var w=box.clientWidth, h=box.clientHeight;
      if(w && h){ camera.aspect=w/h; camera.updateProjectionMatrix(); renderer.setSize(w,h); }
    });
  }catch(e){
    window.__axState.d3err=e.message; if(window.__axErrs) window.__axErrs.push('3d: '+e.message);
    tipFail('ax3dTip','星河載入失敗，網路慢時多見——不影響其他部分');
  }
});

/* ---------- 金塵：PixiJS + pixi-viewport + pixi-ease ---------- */
whenVisible(document.getElementById('axPixiBox'), async function(){
  var box=document.getElementById('axPixiBox');
  try{
    var PIXI=await import('pixi.js');
    var vp=await import('pixi-viewport');
    var pe=await import('pixi-ease');
    var W=box.clientWidth, H=240;
    var app=new PIXI.Application();
    await app.init({width:W,height:H,background:'#050f22',antialias:true,resolution:Math.min(devicePixelRatio||1,2),autoDensity:true});
    box.appendChild(app.canvas);
    var worldW=2400;
    var viewport=new vp.Viewport({screenWidth:W,screenHeight:H,worldWidth:worldW,worldHeight:H,events:app.renderer.events});
    app.stage.addChild(viewport);
    var panX=null, panV=0;
    app.canvas.style.touchAction='none';
    var __ps=window.__axState.pixi||(window.__axState.pixi={pdown:0,pmove:0,vx:0});
    app.canvas.addEventListener('pointerdown',function(e){ __ps.pdown++; panX=e.clientX; panV=viewport.x; });
    app.canvas.addEventListener('pointermove',function(e){ if(panX===null) return; __ps.pmove++;
      var nx=panV+(e.clientX-panX), minX=-(worldW-W);
      viewport.x=Math.max(minX,Math.min(0,nx)); __ps.vx=Math.round(viewport.x); });
    ['pointerup','pointercancel','pointerleave'].forEach(function(ev){ app.canvas.addEventListener(ev,function(){ panX=null; }); });
    viewport.clamp({left:0,right:worldW,top:0,bottom:H});
    /* distant lotus silhouettes */
    var bg=new PIXI.Graphics();
    bg.fill({color:0x0d2650,alpha:.55});
    for(var b=0;b<9;b++){ var bx=120+b*270, by=196+((b*53)%30);
      bg.ellipse(bx,by,86,17); }
    bg.fill();
    viewport.addChild(bg);
    /* gold dust */
    var ease=new pe.Ease({ticker:app.ticker});
    var dust=[];
    var texG=new PIXI.Graphics(); texG.circle(0,0,5).fill({color:0xf7cf6b});
    var tex=app.renderer.generateTexture(texG);
    for(var i=0;i<150;i++){
      var sp=new PIXI.Sprite(tex);
      sp.anchor.set(.5); sp.x=Math.random()*worldW; sp.y=20+Math.random()*(H-40);
      var sc=.35+Math.random()*1.1; sp.scale.set(sc);
      sp.alpha=.35+Math.random()*.6; sp._ph=Math.random()*6.28; sp._y0=sp.y;
      viewport.addChild(sp); dust.push(sp);
    }
    document.getElementById('axPixiTip').style.display='none';
    app.ticker.add(function(){
      var t=performance.now()/1000;
      dust.forEach(function(sp){ sp.y=sp._y0+Math.sin(t*.7+sp._ph)*7; });
    });
    viewport.on('pointertap',function(e){
      var p=viewport.toWorld(e.global.x,e.global.y);
      dust.forEach(function(sp){
        var dx=sp.x-p.x, dy=sp.y-p.y, d=Math.hypot(dx,dy);
        if(d<190 && d>1){
          var push=(190-d)*1.1, nx=sp.x+dx/d*push, ny=sp.y+dy/d*push;
          ease.add(sp,{x:nx,y:ny},{duration:420,ease:'easeOutQuad'});
          ease.add(sp,{x:sp.x,y:sp._y0},{duration:1500,ease:'easeOutElastic',wait:430});
        }
      });
    });
  }catch(e){
    window.__axState.pixierr=e.message; if(window.__axErrs) window.__axErrs.push('pixi: '+e.message);
    tipFail('axPixiTip','金塵載入失敗——不影響其他部分');
  }
});

/* ---------- 墨池錄影：canvas-record (MediaCaptureEncoder) ---------- */
(function(){
  var btn=document.getElementById('pondRec'); if(!btn) return;
  var busy=false;
  btn.addEventListener('click', async function(){
    if(busy) return;
    var out=document.getElementById('pondRecOut');
    var glCv=document.getElementById('pondGL'), koiCv=document.getElementById('pondKoi');
    if(!glCv || !koiCv){ return; }
    busy=true; btn.textContent='錄影中…6 秒';
    try{
      var mod=await import('canvas-record');
      var comp=document.createElement('canvas');
      comp.width=koiCv.width||720; comp.height=koiCv.height||960;
      var cx=comp.getContext('2d');
      var stopDraw=false;
      (function draw(){
        if(stopDraw) return;
        cx.fillStyle='#050f22'; cx.fillRect(0,0,comp.width,comp.height);
        try{ cx.drawImage(glCv,0,0,comp.width,comp.height); }catch(e){}
        try{ cx.drawImage(koiCv,0,0,comp.width,comp.height); }catch(e){}
        requestAnimationFrame(draw);
      })();
      var recorder=new mod.Recorder({
        name:'mochi-pond', duration:6, frameRate:30, download:true,
        encoder:new mod.MediaCaptureEncoder({encoderOptions:{mimeType:'video/webm',videoBitsPerSecond:5_000_000}})
      });
      await recorder.start(comp);
      setTimeout(function(){ stopDraw=true; },6500);
      if(out){ out.style.display='block'; out.textContent='錄好了，影片已開始下載——這一池夜色，帶走吧。'; }
    }catch(e){
      /* fallback: native MediaRecorder */
      try{
        var stream=koiCv.captureStream(30);
        var mr=new MediaRecorder(stream,{mimeType:'video/webm'}), chunks=[];
        mr.ondataavailable=function(ev){ if(ev.data.size) chunks.push(ev.data); };
        mr.onstop=function(){
          var url=URL.createObjectURL(new Blob(chunks,{type:'video/webm'}));
          if(out){ out.style.display='block'; out.innerHTML='錄好了：<a href="'+url+'" download="mochi-pond.webm" style="color:var(--gold);border-bottom:1px dotted var(--gold-soft)">點這裡保存影片</a>'; }
        };
        mr.start(); setTimeout(function(){ mr.stop(); },6000);
      }catch(e2){
        if(out){ out.style.display='block'; out.textContent='這台設備的瀏覽器不支援錄影，換個瀏覽器再試。'; }
      }
    }
    setTimeout(function(){ busy=false; btn.textContent='錄下這一池'; },6800);
  });
})();

/* ---------- lightbox: Esc to close ---------- */
document.addEventListener('keydown',function(e){
  if(e.key==='Escape'){ var lb=document.getElementById('axLightbox'); if(lb) lb.classList.remove('open'); }
});

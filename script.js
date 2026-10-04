(() => {
  const cursor = document.querySelector('.cursor');
  const finePointer = matchMedia('(pointer:fine)').matches;
  if (finePointer) {
    addEventListener('pointermove', event => { cursor.style.left = `${event.clientX}px`; cursor.style.top = `${event.clientY}px`; }, {passive:true});
    document.querySelectorAll('a,button,input,textarea').forEach(el => {
      el.addEventListener('pointerenter', () => cursor.classList.add('hover'));
      el.addEventListener('pointerleave', () => cursor.classList.remove('hover'));
    });
  }

  const canvas = document.getElementById('ember-canvas');
  const ctx = canvas.getContext('2d');
  let width, height, dpr, particles = [], targets = [], stars = [], frame = 0, lastFrame = 0, animationId;
  const pointer = {x: -1000, y: -1000};
  const title = document.querySelector('.ember-title');
  const rand = (a,b) => a + Math.random() * (b-a);
  function resize() {
    const box = canvas.getBoundingClientRect(); dpr = Math.min(devicePixelRatio || 1, 1.5); width = box.width; height = box.height;
    canvas.width = width * dpr; canvas.height = height * dpr; ctx.setTransform(dpr,0,0,dpr,0,0);
    makeTargets();
    makeStars();
  }
  function makeStars() {
    stars = Array.from({length: width < 600 ? 28 : 48}, () => ({x:rand(0,width),y:rand(0,height),vx:rand(-.045,.045),vy:rand(-.035,.035),r:rand(.45,1.25),a:rand(.22,.68),phase:rand(0,8)}));
  }
  function makeTargets() {
    const off = document.createElement('canvas'); const oc = off.getContext('2d');
    off.width = Math.floor(width); off.height = Math.floor(height);
    const rect = title.getBoundingClientRect(); const scale = Math.min(width * .72 / rect.width, height * .28 / rect.height, 1);
    const fontSize = Math.min(140, Math.max(62, width * .105));
    oc.fillStyle = '#fff'; oc.textAlign='center'; oc.textBaseline='middle';
    oc.font = `600 ${fontSize}px Manrope, sans-serif`;
    oc.fillText('Ideas into', width/2, height/2 - fontSize*.38, width*.84);
    oc.fillText('intelligence.', width/2, height/2 + fontSize*.48, width*.94);
    const pixels = oc.getImageData(0,0,off.width,off.height).data; targets=[];
    const step = width < 600 ? 5 : 6;
    for(let yy=0; yy<off.height; yy+=step) for(let xx=0; xx<off.width; xx+=step) if(pixels[(yy*off.width+xx)*4+3] > 100) targets.push({x:xx,y:yy});
    const n=Math.min(targets.length, width < 600 ? 480 : 900);
    while(particles.length<n) particles.push({x:rand(0,width),y:rand(0,height),vx:0,vy:0,size:rand(.5,1.7),seed:rand(0,10),alpha:rand(.3,.9)});
    particles.length=n;
    for(let i=0;i<n;i++){const t=targets[Math.floor(i*targets.length/n)]; particles[i].tx=t.x;particles[i].ty=t.y;}
  }
  addEventListener('resize',resize); addEventListener('pointermove',e=>{pointer.x=e.clientX;pointer.y=e.clientY;}); resize();
  function draw(now=0){animationId=requestAnimationFrame(draw);if(document.hidden||now-lastFrame<33)return;lastFrame=now;frame++;ctx.clearRect(0,0,width,height);
    for (const star of stars) {
      star.x += star.vx; star.y += star.vy;
      if (star.x < -4) star.x = width + 4; if (star.x > width + 4) star.x = -4;
      if (star.y < -4) star.y = height + 4; if (star.y > height + 4) star.y = -4;
    }
    for (let i=0;i<stars.length;i++) for (let j=i+1;j<stars.length;j++) {
      const a=stars[i],b=stars[j],dist=Math.hypot(a.x-b.x,a.y-b.y);
      if (dist<145) {
        ctx.beginPath();
        ctx.strokeStyle='rgba(65,105,225,'+((1-dist/145)*.15)+')';
        ctx.lineWidth=.55;ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
      }
    }
    for (const star of stars) {
      const pulse=.72+.28*Math.sin(frame*.025+star.phase);
      ctx.beginPath();ctx.fillStyle='rgba(190,210,255,'+(star.a*pulse)+')';
      ctx.arc(star.x,star.y,star.r*pulse,0,Math.PI*2);ctx.fill();
    }
    for(const p of particles){
      const dx=p.tx-p.x,dy=p.ty-p.y; p.vx+=dx*.012;p.vy+=dy*.012;
      p.vx*=.91;p.vy*=.91;
      const mx=p.x-pointer.x,my=p.y-pointer.y,dist=Math.hypot(mx,my);
      if(dist<110){const force=(1-dist/110)*.65;p.vx+=(mx/(dist||1))*force;p.vy+=(my/(dist||1))*force;}
      p.x+=p.vx;p.y+=p.vy;
      const flicker=.65+.35*Math.sin(frame*.055+p.seed);
      ctx.beginPath();ctx.fillStyle=`rgba(${Math.floor(160+70*flicker)},${Math.floor(135+55*flicker)},255,${p.alpha*flicker})`;
      ctx.shadowBlur=0;ctx.arc(p.x,p.y,p.size*flicker,0,Math.PI*2);ctx.fill();
    }
    ctx.shadowBlur=0;
    if(Math.random()<.18){const sx=rand(width*.16,width*.84),sy=rand(height*.2,height*.8);ctx.beginPath();ctx.fillStyle='#dfe8ff';ctx.arc(sx,sy,rand(.5,1.2),0,Math.PI*2);ctx.fill();}
      }
  document.addEventListener("visibilitychange",()=>{if(document.hidden){cancelAnimationFrame(animationId);}else{lastFrame=0;animationId=requestAnimationFrame(draw);}});
  draw();

  const contactForm = document.getElementById('contact-form');
  const formStatus = document.getElementById('form-status');
  contactForm.addEventListener('submit', async event => {
    event.preventDefault();
    if (location.protocol === 'file:') {
      formStatus.textContent = 'Open this page through a web server (http://localhost) or a hosted website to send a message.';
      formStatus.dataset.state = 'error';
      return;
    }
    const button = contactForm.querySelector('button[type=submit]');
    const label = button.querySelector('span:first-child');
    const originalLabel = label.textContent;
    button.disabled = true;
    label.textContent = 'Sending…';
    formStatus.textContent = '';
    delete formStatus.dataset.state;
    const formData = new FormData(contactForm);
    const payload = Object.fromEntries(formData.entries());
    payload._replyto = payload.email;
    payload._url = location.origin + location.pathname;
    try {
      const response = await fetch('https://formsubmit.co/ajax/bhargava8484@gmail.com', {
        method: 'POST',
        headers: {'Content-Type':'application/json','Accept':'application/json'},
        body: JSON.stringify(payload)
      });
      const result = await response.json();
      if (!response.ok || result.success === false) throw new Error(result.message || 'The message could not be sent.');
      contactForm.reset();
      formStatus.textContent = 'Message sent — thanks for reaching out. I’ll get back to you as soon as I can.';
      formStatus.dataset.state = 'success';
    } catch (error) {
      formStatus.textContent = error.message || 'Could not reach the email service. Please try again.';
      formStatus.dataset.state = 'error';
    } finally {
      label.textContent = originalLabel;
      button.disabled = false;
    }
  });

  document.querySelectorAll('.skill-card').forEach(card => {
    const front = card.querySelector('.skill-front');
    const back = card.querySelector('.skill-back');
    card.addEventListener('click', () => {
      const flipped = card.classList.toggle('is-flipped');
      card.setAttribute('aria-expanded', String(flipped));
      front.setAttribute('aria-hidden', String(flipped));
      back.setAttribute('aria-hidden', String(!flipped));
    });
  });

  const activePresses = new WeakMap();
  document.addEventListener('pointerdown', event => {
    const target = event.target.closest('a,button,.project,.education');
    if (!target || target.classList.contains('skill-card')) return;
    const previous = activePresses.get(target);
    if (previous) clearTimeout(previous);
    target.classList.remove('press-3d');
    void target.offsetWidth;
    target.classList.add('press-3d');
    activePresses.set(target, setTimeout(() => target.classList.remove('press-3d'), 560));
  }, {passive:true});

  const glowTargets = [...document.querySelectorAll(
    '.hero h1,.section-heading h2,.skills-heading h2,.about h2,.contact h2,.hero-sub,.project-info h3,.project-info>p,.about-copy,.education h3,.contact-grid>div>p,.skill-front strong'
  )];
  glowTargets.forEach(element => element.classList.add('radial-type'));
  let activeGlowTarget = null;
  let glowFrame = 0;
  addEventListener('pointermove', event => {
    if (!matchMedia('(pointer:fine)').matches) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    if (glowFrame) return;
    glowFrame = requestAnimationFrame(() => {
      glowFrame = 0;
      let nearest = null;
      let nearestDistance = 86;
      for (const element of glowTargets) {
        const rect = element.getBoundingClientRect();
        const x = Math.max(rect.left, Math.min(pointer.x, rect.right));
        const y = Math.max(rect.top, Math.min(pointer.y, rect.bottom));
        const distance = Math.hypot(pointer.x - x, pointer.y - y);
        if (distance < nearestDistance) {
          nearest = element;
          nearestDistance = distance;
        }
      }
      if (activeGlowTarget !== nearest) {
        activeGlowTarget?.classList.remove('glow-near');
        activeGlowTarget = nearest;
        activeGlowTarget?.classList.add('glow-near');
      }
      if (activeGlowTarget) {
        const rect = activeGlowTarget.getBoundingClientRect();
        const x = ((pointer.x - rect.left) / rect.width) * 100;
        const y = ((pointer.y - rect.top) / rect.height) * 100;
        activeGlowTarget.style.setProperty('--glow-x', x.toFixed(1) + '%');
        activeGlowTarget.style.setProperty('--glow-y', y.toFixed(1) + '%');
      }
    });
  }, {passive:true});
  addEventListener('pointerleave', () => {
    activeGlowTarget?.classList.remove('glow-near');
    activeGlowTarget = null;
  });

  const observer = new IntersectionObserver(entries => entries.forEach(entry => { if(entry.isIntersecting){entry.target.classList.add('visible');observer.unobserve(entry.target);} }), {threshold:.12});
  document.querySelectorAll('.section-kicker,.section-heading,.skills-heading,.skill-card,.project,.about-grid,.contact-grid').forEach(el=>{el.classList.add('reveal');observer.observe(el);});
})();

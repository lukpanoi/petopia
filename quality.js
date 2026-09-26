/* Application workflows. All demo records are scoped to this browser tab. */
const escapeHTML = PetopiaCore.escapeHTML;
const demoStorage = (() => {
  const memory = new Map();
  const prefix = 'petopia_v2_';
  return {
    getItem(key) { try { return sessionStorage.getItem(prefix + key); } catch { return memory.get(key) ?? null; } },
    setItem(key, value) { memory.set(key, String(value)); try { sessionStorage.setItem(prefix + key, String(value)); } catch {} },
    removeItem(key) { memory.delete(key); try { sessionStorage.removeItem(prefix + key); } catch {} }
  };
})();
function readDemo(key, fallback) {
  try {
    const result = JSON.parse(demoStorage.getItem(key));
    if (result === null) return fallback;
    if (Array.isArray(fallback) && !Array.isArray(result)) return fallback;
    if (fallback && !Array.isArray(fallback) && typeof fallback === 'object' && (typeof result !== 'object' || Array.isArray(result))) return fallback;
    return result;
  } catch { return fallback; }
}
let modalReturnFocus = null;
let fieldSequence = 0;
function labelFields(root = document) {
  root.querySelectorAll('label').forEach(label => {
    if (label.control) return;
    const control = label.nextElementSibling;
    if (!control?.matches('input,select,textarea')) return;
    if (!control.id) control.id = 'field-' + (++fieldSequence);
    label.htmlFor = control.id;
  });
}
function openModal(title, sub, html, onReady) {
  const modal = $('#genericModal');
  if (!modal.classList.contains('open')) modalReturnFocus = document.activeElement;
  $('#modalTitle').textContent = title;
  $('#modalSub').textContent = sub || '';
  $('#modalBody').innerHTML = html;
  modal.classList.add('open');
  document.body.classList.add('modal-open');
  document.querySelectorAll('body > header,body > main,body > footer,body > .demo-notice').forEach(el => el.inert = true);
  if (onReady) onReady();
  labelFields(modal);
  applyLang(modal);
  $('#modalClose').focus();
}
function closeModal() {
  $('#genericModal').classList.remove('open');
  document.body.classList.remove('modal-open');
  document.querySelectorAll('body > [inert]').forEach(el => el.inert = false);
  if (modalReturnFocus?.isConnected && modalReturnFocus.getClientRects().length) modalReturnFocus.focus();
  modalReturnFocus = null;
}
function showPage(name, updateHistory = true) {
  if (name === 'profile' && !user) { demoStorage.setItem('petopia_after_login', name); name = 'auth'; }
  const target = $('#page-' + name);
  if (!target) return;
  $$('.page').forEach(page => page.classList.toggle('active', page === target));
  $$('.navlink').forEach(button => { button.classList.toggle('active', button.dataset.page === name); button.setAttribute('aria-current', button.dataset.page === name ? 'page' : 'false'); });
  window.petopiaCloseMenu?.();
  $('#nav').classList.remove('menuopen');
  if (updateHistory) {
    const hash = '#' + name + (name === 'detail' ? '/' + currentPet : '');
    if (location.hash !== hash) history.pushState(null, '', hash);
  }
  if (name === 'favorites') renderFavorites();
  if (name === 'profile') renderProfile();
  if (name === 'shop') renderProducts();
  if (name === 'community') renderPosts();
  if (name === 'quiz') renderQuiz();
  applyLang(target);
  document.title = 'Petopia · ' + (target.querySelector('h1,h2')?.textContent || name);
  window.scrollTo({ top: 0, behavior: 'instant' });
  const heading = target.querySelector('h1,h2');
  if (heading) { heading.tabIndex = -1; heading.focus({ preventScroll: true }); }
}
function routeFromHash() {
  if (location.hash === '#main-content') { $('#main-content').focus(); return; }
  const [page, id] = location.hash.slice(1).split('/');
  if (page === 'detail' && PETS.some(p => p.id === Number(id))) openDetail(Number(id), false);
  else showPage($('#page-' + page) ? page : 'browse', false);
}
function matchSummary(pet) {
  const result = PetopiaCore.match(pet, quizAnswers);
  if (!compat || !result) return '';
  const labels = lang === 'th' ? ['พื้นที่อยู่อาศัย','ระดับกิจกรรม','เวลาดูแล','บุคลิก'] : ['Living space','Activity level','Time together','Personality'];
  const best = result.values.map((value, i) => ({ value, label: labels[i] })).sort((a,b) => b.value - a.value)[0];
  return (lang === 'th' ? 'เหมาะด้าน: ' : 'Strongest fit: ') + best.label;
}
function petCard(p) {
  const result = compat ? PetopiaCore.match(p, quizAnswers) : null;
  const badge = p.verified ? '✓ Verified demo listing' : 'Verification pending';
  return `<article class="petcard"><div class="petphoto"><img loading="lazy" src="${p.image}" alt="${p.name}"><span class="petlabel">${result ? result.score + '% Match' : 'Free Adoption'}</span><span class="verifiedBadge ${p.verified ? '' : 'pending-badge'}">${badge}</span><button class="heart ${favorites.has(p.id) ? 'saved' : ''}" data-fav="${p.id}" aria-label="${lang === 'th' ? 'บันทึก ' : 'Favorite '}${p.name}" aria-pressed="${favorites.has(p.id)}">${favorites.has(p.id) ? '♥' : '♡'}</button></div><div class="petbody"><div class="nameRow"><div><h3>${p.name}</h3><div class="breed">${p.breed}</div></div><strong>Free</strong></div><div class="age">${p.age} ${p.age === 1 ? 'year' : 'years'} old</div><div class="tags">${p.tags.slice(0,3).map(t => `<span class="tag">${t}</span>`).join('')}</div><div class="location">⌖ <span>${p.location}</span></div>${result ? `<p class="match-reason">${matchSummary(p)}</p><button class="matchWhy" data-match="${p.id}">Why this match?</button>` : ''}<button class="viewbtn" data-detail="${p.id}">View Details</button></div></article>`;
}
function bindPetButtons(root = document) {
  root.querySelectorAll('[data-fav]').forEach(button => button.onclick = () => {
    const id = Number(button.dataset.fav);
    favorites.has(id) ? favorites.delete(id) : favorites.add(id);
    save('petopia_favs', [...favorites]); updateUserUI(); renderPets(); renderFavorites();
    root.querySelector(`[data-fav="${id}"]`)?.focus({ preventScroll: true });
    toast(favorites.has(id) ? 'Added to Favorites' : 'Removed from Favorites');
  });
  root.querySelectorAll('[data-detail]').forEach(button => button.onclick = () => openDetail(Number(button.dataset.detail)));
  root.querySelectorAll('[data-match]').forEach(button => button.onclick = () => explainMatch(Number(button.dataset.match)));
}
function renderPets() {
  const query = $('#searchInput').value;
  const loc = $('#locationFilter').value;
  const list = PETS.filter(p => (species === 'all' || p.species === species) && (ageFilter === 'all' || ageBucket(p) === ageFilter) && (loc === 'all' || p.location === loc) && PetopiaCore.searchable(p, query));
  if (compat && PetopiaCore.validAnswers(quizAnswers)) list.sort((a,b) => PetopiaCore.match(b,quizAnswers).score - PetopiaCore.match(a,quizAnswers).score);
  $('#petGrid').innerHTML = list.length ? list.map(petCard).join('') : '<div class="empty"><p>No pets match your filters.</p><button id="emptyReset" class="smallgreen">Reset filters</button></div>';
  $('#emptyReset')?.addEventListener('click', () => $('#clearFilters').click());
  $('#statPets').textContent = PETS.length;
  $('#resultCount').textContent = lang === 'th' ? `พบ ${list.length} จาก ${PETS.length} ตัว` : `Showing ${list.length} of ${PETS.length} pets`;
  $('#compatSwitch').setAttribute('aria-checked', String(compat));
  $('#matchExplanation').hidden = !compat;
  bindPetButtons($('#petGrid')); applyLang($('#petGrid')); refreshMatchHighlights();
}
function refreshMatchHighlights() {
  const luna = compat ? PetopiaCore.match(PETS[0],quizAnswers) : null;
  const mochi = compat ? PetopiaCore.match(PETS[1],quizAnswers) : null;
  $('.floatMatch small').textContent = luna ? 'YOUR MATCH' : 'MEET LUNA';
  $('.floatMatch b').textContent = luna ? luna.score + '% · Luna' : 'Luna';
  $('.matchResult strong').textContent = mochi ? mochi.score + '%' : '4';
  $('.matchResult small').textContent = mochi ? 'YOUR MATCH' : 'QUICK QUESTIONS';
  $('.matchResult b').textContent = mochi ? 'Mochi · Your lifestyle match' : 'Find a companion for your lifestyle';
  $('.matchResult span').textContent = mochi ? matchSummary(PETS[1]) : 'Start with your home and routine';
  applyLang($('.floatMatch')); applyLang($('.matchResult'));
}
function explainMatch(id) {
  const p = PETS.find(p => p.id === id), result = PetopiaCore.match(p,quizAnswers);
  if (!result) return;
  const labels = ['Living space','Activity level','Time together','Personality'];
  openModal(p.name + ' · ' + result.score + '%', 'A transparent lifestyle guide, not a guarantee of adoption suitability.', `<p>Based on your four answers and sample pet profiles.</p><dl>${result.values.map((value,i) => `<dt>${labels[i]}</dt><dd>${(value * result.weights[i]).toFixed(1)} / ${result.weights[i]}</dd>`).join('')}</dl><p>Meet the pet and discuss individual care needs with a real shelter before deciding.</p>`);
}
function openDetail(id, updateHistory = true) {
  const p = PETS.find(p => p.id === id); if (!p) return;
  currentPet = id;
  $('#detailImage').src = p.image; $('#detailImage').alt = p.name;
  $('#detailName').textContent = p.name; $('#detailBreed').textContent = p.breed;
  $('#detailTags').innerHTML = p.tags.map(t => `<span class="tag">${t}</span>`).join('');
  $('#detailStats').innerHTML = [['AGE',p.age + (p.age === 1 ? ' year old' : ' years old')],['LOCATION',p.location],['GENDER',p.gender],['SIZE',p.size]].map(([label,value]) => `<div class="detailStat"><small>${label}</small><b>${value}</b></div>`).join('');
  $('#detailStory').textContent = p.story; $('#mapLabel').textContent = p.location;
  const text = p.verified ? '✓ Verified demo listing' : 'Verification pending';
  $('#detailVerify').textContent = text; $('#detailBadge').textContent = text; $('#detailTrustTitle').textContent = text;
  $('#detailBadge').classList.toggle('pending-badge', !p.verified);
  $('#page-detail .noticeIcon').textContent = p.verified ? '✓' : '…';
  $('#detailVerify').classList.toggle('pending-badge', !p.verified);
  $('#detailHeart').classList.toggle('saved',favorites.has(id)); $('#detailHeart').textContent = favorites.has(id) ? '♥' : '♡';
  $('#detailHeart').setAttribute('aria-label', (lang === 'th' ? 'บันทึก ' : 'Favorite ') + p.name);
  $('#detailHeart').setAttribute('aria-pressed', String(favorites.has(id)));
  showPage('detail', updateHistory);
}
function openAdoption(draft) {
  if (!requireLogin('detail')) return;
  const p = PETS.find(p => p.id === currentPet);
  if (applications.some(a => a.petId === p.id)) { toast('You already saved a demo application for this pet.'); showPage('profile'); return; }
  const value = draft && typeof draft === 'object' && 'reason' in draft ? draft : { living:user.living || 'Apartment',petsOwned:user.petsOwned || 0,budget:'',reason:'' };
  openModal('Adopt ' + p.name, 'Demo only. Use sample details; nothing is sent to a shelter.', `<form id="adoptForm"><p class="review-note">No ID number, password or real contact information is needed.</p><div class="formGrid"><div class="field full"><label>Demo display name</label><input value="${escapeHTML(user.name)}" disabled></div><div class="field"><label>Living space</label><select id="adoptLiving">${['Apartment','Small house','Large house','Farm / rural'].map(v => `<option value="${v}" ${value.living === v ? 'selected' : ''}>${v}</option>`).join('')}</select></div><div class="field"><label>Pets already owned</label><input id="adoptPets" type="number" min="0" max="50" step="1" required value="${escapeHTML(value.petsOwned)}"></div><div class="field full"><label>Sample monthly care budget (THB, optional)</label><input id="adoptBudget" type="number" min="0" step="1" value="${escapeHTML(value.budget ?? '')}"></div><div class="field full"><label>Why would you like to adopt ${p.name}?</label><textarea id="adoptReason" minlength="10" maxlength="1500" required>${escapeHTML(value.reason)}</textarea></div></div><p class="form-error" id="adoptError" role="alert"></p><div class="modalActions"><button type="button" class="cancel" id="modalCancel">Cancel</button><button class="submit">Review Application</button></div></form>`, () => {
    $('#modalCancel').onclick = closeModal;
    $('#adoptForm').onsubmit = event => {
      event.preventDefault();
      try {
        const record = PetopiaCore.application(p,user,{living:$('#adoptLiving').value,petsOwned:$('#adoptPets').value,budget:$('#adoptBudget').value,reason:$('#adoptReason').value});
        reviewApplication(record);
      } catch { $('#adoptError').textContent = lang === 'th' ? 'ตรวจสอบข้อมูลและเขียนเหตุผลอย่างน้อย 10 ตัวอักษร' : 'Check the fields and write a reason of at least 10 characters.'; }
    };
  });
}
function applicationDetails(a) {
  return `<dl><dt>Pet</dt><dd>${escapeHTML(a.pet)}</dd><dt>Demo display name</dt><dd>${escapeHTML(a.applicant)}</dd><dt>Living space</dt><dd>${escapeHTML(a.living)}</dd><dt>Pets already owned</dt><dd>${a.petsOwned}</dd><dt>Sample monthly care budget (THB, optional)</dt><dd>${a.budget === null ? 'Not provided' : fmt(a.budget)}</dd><dt>Care plan</dt><dd>${escapeHTML(a.reason)}</dd></dl>`;
}
function reviewApplication(record) {
  openModal('Review Application','Review your sample details before saving.', applicationDetails(record) + '<p class="review-note">Saved in this tab only. No shelter receives this request.</p><div class="modalActions"><button class="cancel" id="editApplication">Edit details</button><button class="submit" id="saveApplication">Save Demo Application</button></div>', () => {
    $('#editApplication').onclick = () => openAdoption(record);
    $('#saveApplication').onclick = () => {
      if (!applications.some(a => a.petId === record.petId)) { applications.unshift(record); save('petopia_apps',applications); }
      closeModal(); showPage('profile'); toast('Demo application saved. No request was sent.');
    };
  });
}
function renderProfile() {
  if (!user) return;
  $('#profileName').textContent=user.name; $('#profileEmail').textContent='Demo profile · This tab only';
  $('#profileLocation').textContent=user.location || 'Bangkok'; $('#profileFavs').textContent=favorites.size+' pets';
  $('#profileMembership').textContent=user.membership || 'Free'; $('#profileApps').textContent=applications.length;
  $('#profileLiving').textContent=user.living || 'Not set'; $('#profilePetsOwned').textContent=user.petsOwned ?? 0;
  $('#profileBadge').textContent='Demo profile · This tab only';
  $('#applicationList').innerHTML=applications.length ? applications.map(a => `<div class="dashItem"><div><b>${escapeHTML(a.pet)}</b><p>${escapeHTML(a.status)}</p></div><button data-application="${a.id}">View application</button></div>`).join('') : '<p>No applications yet.</p>';
  $$('[data-application]').forEach(button => button.onclick=()=>{const a=applications.find(a=>String(a.id)===button.dataset.application);openModal('Adopt '+a.pet,'Saved in this tab only. No shelter receives this request.',applicationDetails(a));});
  $('#bookingList').innerHTML=bookings.length ? bookings.map(a=>`<div class="dashItem"><div><b>${escapeHTML(a.type)}: ${escapeHTML(a.service)}</b><p>${escapeHTML(a.pet)} · ${escapeHTML(a.date)}${a.end ? ' → '+escapeHTML(a.end) : ''}</p><p>${escapeHTML(a.notes || '')}</p></div><span class="status">${escapeHTML(a.status)}</span></div>`).join(''):'<p>No bookings or quotes yet.</p>';
  $('#orderList').innerHTML=orders.length ? orders.map(o=>`<div class="dashItem"><span>${escapeHTML(o.date)}</span><span>${fmt(o.total)}</span></div>`).join(''):'<p>No orders yet.</p>';
  $$('#journeySteps .journeyStep').forEach((step,i)=>{step.classList.toggle('done',i===0 || (applications.length>0 && i===1));step.classList.toggle('active',i===1 && !applications.length);});
}
function editProfile() {
  if (!requireLogin('profile')) return;
  openModal('Edit demo profile','Use a nickname and sample care preferences.',`<form id="editProfileForm"><div class="field"><label>Demo display name</label><input id="epName" maxlength="60" required value="${escapeHTML(user.name)}"></div><div class="field"><label>Location</label><select id="epLocation">${['Bangkok','Chiang Mai','Ratchaburi'].map(v=>`<option value="${v}" ${user.location===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Living space</label><select id="epLiving">${['Apartment','Small house','Large house','Farm / rural'].map(v=>`<option value="${v}" ${user.living===v?'selected':''}>${v}</option>`).join('')}</select></div><div class="field"><label>Pets already owned</label><input id="epPets" type="number" min="0" max="50" step="1" required value="${user.petsOwned || 0}"></div><div class="modalActions"><button type="button" class="cancel" id="modalCancel">Cancel</button><button class="submit">Save Profile</button></div></form>`,()=>{
    $('#modalCancel').onclick=closeModal; $('#editProfileForm').onsubmit=e=>{e.preventDefault();if(!$('#epName').value.trim())return;user={...user,name:$('#epName').value.trim(),location:$('#epLocation').value,living:$('#epLiving').value,petsOwned:Number($('#epPets').value)};save('petopia_user',user);save('petopia_demo_profile',user);closeModal();renderProfile();applyLang($('#page-profile'));};
  });
}
function setAuthMode() { /* The public demo has no real account registration. */ }
function renderQuiz() {
  const question=QUIZ[quizIndex];
  $('#quizStepLabel').textContent=`Question ${quizIndex+1} of ${QUIZ.length}`;
  const pct=Math.round(Object.keys(quizAnswers).length / QUIZ.length * 100);
  $('#quizPct').textContent=pct+'%';$('#quizProgress').style.width=pct+'%';
  $('#quizQuestion').textContent=question.q;
  $('#quizOptions').innerHTML=question.o.map((option,i)=>`<button class="quizChoice ${quizAnswers[quizIndex]===i?'selected':''}" data-q="${i}" aria-pressed="${quizAnswers[quizIndex]===i}"><span aria-hidden="true">${option[0]}</span><b>${option[1]}</b></button>`).join('');
  $$('[data-q]').forEach(button=>button.onclick=()=>{quizAnswers[quizIndex]=Number(button.dataset.q);renderQuiz();$(`[data-q="${button.dataset.q}"]`).focus();});
  $('#quizBack').disabled=quizIndex===0;$('#quizNext').textContent=quizIndex===QUIZ.length-1?'See Matches':'Next →';
  applyLang($('#page-quiz'));
}
function openPolicy(kind) {
  const policies={
    privacy:['Privacy','Your demo data stays in this tab.', '<p>Petopia is an interactive demonstration. There is no real account registration or server database.</p><ul><li>Favorites, quiz answers, demo applications, messages and bookings use session storage in this browser tab.</li><li>Do not enter real passwords, ID numbers, financial details or private contact information.</li><li>No application or chat message is sent to a shelter. Closing the tab normally ends the session; your browser may restore sessions.</li><li>Images load from Unsplash and the site is hosted on GitHub Pages. These providers receive normal web requests.</li></ul>'],
    terms:['Terms','Explore with sample information.', '<p>All pets, verification badges, services, stories and transactions here are demonstration content. They are not live adoption offers, partner endorsements or paid services.</p><p>Matching is a weighted lifestyle illustration, not a guarantee or professional assessment. No money is collected and no booking is confirmed.</p>'],
    safety:['Safety','A careful start for a future adoption.', '<p>Before a real adoption, verify the shelter independently, meet the pet, check care and health records, and agree on responsibilities.</p><p>Never send ID documents, passwords or payment details through this demonstration. A demo verification badge does not establish the identity of a real shelter.</p>']
  };
  const [title,sub,body]=policies[kind] || policies.privacy;
  openModal(title,sub,body);
}
function initializeQuality() {
  labelFields();
  $('#genericModal').setAttribute('aria-labelledby','modalTitle');$('#genericModal').setAttribute('aria-describedby','modalSub');
  $('#compatSwitch').setAttribute('role','switch');
  $('#searchInput').setAttribute('aria-label','Search by name, breed, or location');
  $('#locationFilter').setAttribute('aria-label','Location');
  $('#chatInput').setAttribute('aria-label','Demo message');
  $('#postInput').setAttribute('aria-label','Demo community post');
  $('#favBtn').setAttribute('aria-label','Favorites');$('#cartBtn').setAttribute('aria-label','Cart');
  document.addEventListener('keydown',event=>{
    const modal=$('#genericModal');if(!modal.classList.contains('open'))return;
    if(event.key==='Escape'){event.preventDefault();closeModal();return;}
    if(event.key!=='Tab')return;
    const focusable=[...modal.querySelectorAll('button,input,select,textarea,a[href],[tabindex="0"]')].filter(el=>!el.disabled&&el.getClientRects().length);
    const first=focusable[0],last=focusable[focusable.length-1];
    if(event.shiftKey&&document.activeElement===first){event.preventDefault();last.focus();}
    else if(!event.shiftKey&&document.activeElement===last){event.preventDefault();first.focus();}
  });
  $$('[data-policy]').forEach(button=>button.onclick=()=>openPolicy(button.dataset.policy));
  $('#demoLogin').onclick=()=>{user=readDemo('petopia_demo_profile',null)||{...DEMO};save('petopia_user',user);updateUserUI();const next=demoStorage.getItem('petopia_after_login') || 'profile';demoStorage.removeItem('petopia_after_login');showPage(next);toast('Demo session started');};
  $('#authForm').onsubmit=event=>{event.preventDefault();$('#demoLogin').click();};
  $('#quizNext').onclick=()=>{
    if(quizAnswers[quizIndex]===undefined)return toast('Choose an answer first');
    if(quizIndex<QUIZ.length-1){quizIndex++;renderQuiz();$('#quizQuestion').focus();return;}
    compat=true;save('petopia_quiz',quizAnswers);demoStorage.setItem('petopia_compat','1');$('#compatSwitch').classList.add('on');$('#compatState').textContent='Enabled';showPage('browse');renderPets();scrollToExplorer();toast('Your lifestyle matches are ready');
  };
  $('#retakeQuiz').onclick=()=>{quizIndex=0;showPage('quiz');};
  $('#langBtn').onclick=()=>{lang=lang==='en'?'th':'en';demoStorage.setItem('petopia_lang',lang);applyLang();renderPets();if($('#page-favorites').classList.contains('active'))renderFavorites();if($('#page-detail').classList.contains('active'))openDetail(currentPet,false);};
  window.addEventListener('popstate',routeFromHash);
  window.addEventListener('hashchange',routeFromHash);
}

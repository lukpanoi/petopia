/* Shared, deterministic rules for the Petopia demonstration. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.PetopiaCore = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const profiles = {
    1: { space: [0.5, 0.8, 1, 1], activity: 2, time: 2, personality: [0.7, 1, 0.9, 0.9] },
    2: { space: [1, 1, 1, 0.9], activity: 1, time: 1, personality: [1, 0.8, 1, 0.7] },
    3: { space: [1, 1, 1, 0.7], activity: 0, time: 1, personality: [0.8, 0.8, 0.6, 1] },
    4: { space: [1, 1, 0.9, 0.6], activity: 0, time: 1, personality: [1, 0.6, 0.4, 0.8] },
    5: { space: [0.4, 0.7, 1, 1], activity: 3, time: 2, personality: [0.3, 1, 1, 0.7] },
    6: { space: [1, 1, 1, 0.8], activity: 1, time: 1, personality: [0.8, 1, 0.8, 0.8] }
  };
  function validAnswers(answers) {
    return answers != null && [0, 1, 2, 3].every(k => Number.isInteger(answers[k]) && answers[k] >= 0 && answers[k] <= 3);
  }
  function match(pet, answers) {
    if (!validAnswers(answers) || !profiles[pet.id]) return null;
    const p = profiles[pet.id];
    const values = [p.space[answers[0]], Math.max(0, 1 - Math.abs(p.activity - answers[1]) / 3),
      Math.max(0, 1 - Math.max(0, p.time - answers[2]) / 3), p.personality[answers[3]]];
    const weights = [25, 30, 25, 20];
    return { score: Math.round(values.reduce((sum, value, i) => sum + value * weights[i], 0)), values, weights };
  }
  const aliases = {
    'Bangkok': 'กรุงเทพ กรุงเทพฯ กรุงเทพมหานคร', 'Chiang Mai': 'เชียงใหม่', 'Ratchaburi': 'ราชบุรี',
    'dog': 'สุนัข หมา', 'cat': 'แมว', 'Golden Retriever': 'โกลเด้น รีทรีฟเวอร์ โกลเดน',
    'Scottish Terrier': 'สก็อตติช เทอร์เรีย', 'Siamese': 'วิเชียรมาศ แมวไทย', 'Persian': 'เปอร์เซีย',
    'Beagle': 'บีเกิล', 'Domestic Shorthair': 'แมวขนสั้น', 'friendly': 'เป็นมิตร', 'calm': 'สงบ',
    'playful': 'ขี้เล่น', 'affectionate': 'ชอบอ้อน', 'active': 'กระตือรือร้น', 'indoor': 'เลี้ยงในบ้าน',
    'vaccinated': 'ฉีดวัคซีนแล้ว', 'good with kids': 'เข้ากับเด็กได้', 'trained': 'ฝึกพื้นฐานแล้ว', 'neutered': 'ทำหมันแล้ว'
  };
  const normalize = value => String(value || '').normalize('NFKC').toLowerCase().replace(/\s+/g, ' ').trim();
  function searchable(pet, query) {
    const fields = [pet.name, pet.species, pet.breed, pet.location, ...(pet.tags || [])];
    const haystack = normalize(fields.map(value => value + ' ' + (aliases[value] || '')).join(' '));
    return normalize(query).split(' ').every(word => haystack.includes(word));
  }
  function escapeHTML(value) {
    return String(value ?? '').replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]));
  }
  function application(pet, profile, input, now = Date.now()) {
    const petsOwned = Number(input.petsOwned);
    const budget = input.budget === '' ? null : Number(input.budget);
    const reason = String(input.reason || '').trim();
    const living = String(input.living || '');
    if (!['Apartment', 'Small house', 'Large house', 'Farm / rural'].includes(living) ||
      !Number.isInteger(petsOwned) || petsOwned < 0 || petsOwned > 50 ||
      (budget !== null && (!Number.isFinite(budget) || budget < 0)) || reason.length < 10 || reason.length > 1500) {
      throw new Error('Please check your care details and write at least 10 characters.');
    }
    return { id: now, petId: pet.id, pet: pet.name, date: new Date(now).toISOString(), status: 'Demo request saved',
      applicant: String(profile.name || 'Demo User'), living, petsOwned, budget, reason };
  }
  function validDates(start, end, today) {
    const isDate = value => {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
      const date = new Date(value + 'T00:00:00Z');
      return Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === value;
    };
    return isDate(start) && isDate(today) && start >= today && (!end || (isDate(end) && end > start));
  }
  return { match, validAnswers, searchable, escapeHTML, application, validDates };
});

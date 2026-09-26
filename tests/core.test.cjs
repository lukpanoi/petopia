const test = require('node:test');
const assert = require('node:assert/strict');
const core = require('../core.js');

test('lifestyle answers change recommendations, not just visibility', () => {
  const quiet = [0,0,1,0], active = [3,3,3,2];
  assert(core.match({id:4},quiet).score > core.match({id:5},quiet).score);
  assert(core.match({id:5},active).score > core.match({id:4},active).score);
  assert.notEqual(core.match({id:1},quiet).score,core.match({id:1},active).score);
});
test('all possible quiz profiles have bounded, explainable scores', () => {
  for(let a=0;a<4;a++)for(let b=0;b<4;b++)for(let c=0;c<4;c++)for(let d=0;d<4;d++)for(let id=1;id<=6;id++) {
    const r=core.match({id},[a,b,c,d]);
    assert(r.score>=0&&r.score<=100);
    assert.equal(r.weights.reduce((a,b)=>a+b),100);
  }
  for(const invalid of [null,{},[0,1,2],[-1,0,0,0],[4,0,0,0],['0',1,2,3]])assert.equal(core.match({id:1},invalid),null);
});
test('Thai and English city, species, breed and care queries agree', () => {
  const pet={name:'Nala',species:'cat',breed:'Siamese',location:'Chiang Mai',tags:['affectionate','indoor']};
  for(const q of ['เชียงใหม่','Chiang Mai','CHIANG MAI','แมว เชียงใหม่','วิเชียรมาศ','ชอบอ้อน',''])assert(core.searchable(pet,q),q);
  assert.equal(core.searchable(pet,'Bangkok'),false);
  assert.equal(core.searchable(pet,'zzzaudit'),false);
});
test('application persists all reviewed fields and keeps user text inert', () => {
  const a=core.application({id:2,name:'Mochi'},{name:'Tester'},{living:'Small house',petsOwned:'2',budget:'2400',reason:'Sample care plan for this pet.'},1000);
  assert.equal(a.living,'Small house');assert.equal(a.petsOwned,2);assert.equal(a.budget,2400);
  assert.equal(a.reason,'Sample care plan for this pet.');assert.equal(a.applicant,'Tester');assert.equal(a.petId,2);
  assert.equal(core.application({id:2,name:'Mochi'},{name:'Tester'},{living:'Apartment',petsOwned:0,budget:'',reason:'Sample care plan.'}).budget,null);
  assert.throws(()=>core.application({id:1},{},{living:'Apartment',petsOwned:-1,budget:0,reason:'Sample care plan.'}));
  assert.throws(()=>core.application({id:1},{},{living:'Apartment',petsOwned:0,budget:0,reason:'    '}));
  assert.equal(core.escapeHTML('<img src=x onerror="alert(1)">'), '&lt;img src=x onerror=&quot;alert(1)&quot;&gt;');
});
test('hotel dates cannot be in the past, reversed, or same day', () => {
  assert(core.validDates('2026-09-26','2026-09-27','2026-09-26'));
  assert(core.validDates('2026-09-26','','2026-09-26'));
  assert(!core.validDates('2026-09-25','2026-09-27','2026-09-26'));
  assert(!core.validDates('2026-09-27','2026-09-26','2026-09-26'));
  assert(!core.validDates('2026-09-27','2026-09-27','2026-09-26'));
  assert(!core.validDates('2026-99-99','','2026-09-26'));
  assert(!core.validDates('2027-02-30','','2026-09-26'));
});

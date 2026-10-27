const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');
const sql=fs.readFileSync('candidaturas-por-comunidad.sql','utf8');
const demoSql=fs.readFileSync('sondeo-ejemplo.sql','utf8');
const region=(l)=>{const m=sql.match(new RegExp(`WHEN '${l}' THEN ARRAY\\[([^\\]]*)\\]`));return m?m[1].split(',').map(s=>s.trim().replace(/'/g,'')):null;};
test('ERC and Junts only in Cataluña',()=>{assert.deepEqual(region('ERC'),['Cataluña']);assert.deepEqual(region('Junts per Catalunya'),['Cataluña']);});
test('EH Bildu in País Vasco and Navarra, PNV only País Vasco',()=>{assert.deepEqual(region('EH Bildu'),['País Vasco','Navarra']);assert.deepEqual(region('EAJ-PNV'),['País Vasco']);});
test('BNG Galicia, CC Canarias, UPN Navarra',()=>{assert.deepEqual(region('BNG'),['Galicia']);assert.deepEqual(region('Coalición Canaria'),['Canarias']);assert.deepEqual(region('UPN'),['Navarra']);});
test('server rejects votes outside the candidatura comunidad',()=>{assert.match(sql,/regions IS NULL OR trim\(voter_region\) = ANY\(regions\)/);});
test('renamed votes follow their candidatura',()=>{assert.match(sql,/UPDATE public\.votes SET candidate=r\.new_label WHERE candidate=r\.old_label/);});
test('demo data does not make PP win every autonomous community',()=>{
  const catalonia = demoSql.slice(demoSql.indexOf("('Cataluña'"), demoSql.indexOf("('Extremadura'"));
  assert.match(catalonia, /\('Cataluña','PSOE',98\)/);
  assert.match(catalonia, /\('Cataluña','ERC',86\)/);
  assert.match(catalonia, /\('Cataluña','PP',42\)/);
});

import { test } from 'node:test'; import assert from 'node:assert/strict'; import fs from 'node:fs';
const src = fs.readFileSync('src/App.jsx','utf8');
const fn = src.match(/export function regionResults[\s\S]*?\n}\n/)[0].replace('export ','');
const regionResults = new Function(fn + '; return regionResults;')();
test('comunidad breakdown sorts by votes and computes shares', () => {
  const { total, rows } = regionResults({ PP: 3, ERC: 1 });
  assert.equal(total, 4); assert.equal(rows[0].name, 'PP'); assert.equal(rows[0].pct, 75); assert.equal(rows[1].pct, 25);
});
test('empty comunidad has zero total', () => { assert.equal(regionResults({}).total, 0); });
test('Sumar is renamed to Frente Amplio, votes included', () => {
  const sql = fs.readFileSync('frente-amplio.sql','utf8');
  assert.match(sql, /SET label = 'Frente Amplio'.*WHERE label = 'Sumar'/);
  assert.match(sql, /UPDATE public\.votes SET candidate = 'Frente Amplio' WHERE candidate = 'Sumar'/);
  assert.doesNotMatch(fs.readFileSync('sondeo-ejemplo.sql','utf8'), /'Sumar'/);
});

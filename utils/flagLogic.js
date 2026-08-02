// Works out High / Low / Normal / NA for a single parameter reading
function computeFlag(param) {
  const raw = (param.value ?? '').toString().trim();
  if (raw === '') return 'NA';

  const num = Number(raw);
  if (Number.isNaN(num)) return 'NA'; // non-numeric result (e.g. "Negative", "Reactive")

  if (typeof param.normalMin === 'number' && num < param.normalMin) return 'Low';
  if (typeof param.normalMax === 'number' && num > param.normalMax) return 'High';
  if (typeof param.normalMin === 'number' || typeof param.normalMax === 'number') return 'Normal';

  return 'NA';
}

// Applies computeFlag across a full values array, returns a new array
function applyFlags(values) {
  return values.map((v) => ({ ...v, flag: computeFlag(v) }));
}

module.exports = { computeFlag, applyFlags };

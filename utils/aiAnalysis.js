// Produces a short clinical-style summary for a report that may bundle
// several test panels together. Uses the Anthropic API if ANTHROPIC_API_KEY
// is set in .env, otherwise falls back to a built-in rule-based analyzer so
// the feature always works.

// `tests` is an array of { testName, values }
function ruleBasedSummary(tests) {
  const allValues = tests.flatMap((t) => t.values.map((v) => ({ ...v, testName: t.testName })));
  const abnormal = allValues.filter((v) => v.flag === 'High' || v.flag === 'Low');
  const unfilled = allValues.filter((v) => v.flag === 'NA');

  if (allValues.length && unfilled.length === allValues.length) {
    return 'No values entered yet. Enter results and save to generate an AI-assisted summary.';
  }

  if (abnormal.length === 0) {
    const names = tests.map((t) => t.testName).join(', ');
    return `All reported parameters across ${names} fall within their normal reference ranges. No abnormal findings flagged.`;
  }

  const parts = abnormal.map((v) => {
    const direction = v.flag === 'High' ? 'elevated' : 'reduced';
    return `${v.name} (${v.testName}) is ${direction} (${v.value} ${v.unit || ''}, normal ${v.normalMin ?? ''}-${v.normalMax ?? ''})`.trim();
  });

  const lead =
    abnormal.length === 1
      ? '1 parameter is outside the normal range: '
      : `${abnormal.length} parameters are outside the normal range: `;

  return `${lead}${parts.join('; ')}. Clinical correlation with the patient's history and symptoms is advised before final interpretation.`;
}

async function callAnthropic(tests, patient) {
  const testBlocks = tests
    .map(
      (t) =>
        `${t.testName}:\n` +
        t.values
          .map((v) => `- ${v.name}: ${v.value} ${v.unit || ''} (normal ${v.normalMin ?? '?'}-${v.normalMax ?? '?'}, flag: ${v.flag})`)
          .join('\n')
    )
    .join('\n\n');

  const prompt = `You are assisting a hospital lab. Patient: ${patient.name}, ${patient.age} ${patient.ageUnit}, ${patient.gender}.
This report bundles the following test panel(s):

${testBlocks}

Write a concise (2-5 sentence) plain-language summary for the reviewing pathologist covering all panels above, highlighting any abnormal values and their likely significance. Do not give a diagnosis, only an observational summary.`;

  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: 'claude-sonnet-4-6',
      max_tokens: 350,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) throw new Error(`Anthropic API responded with ${response.status}`);

  const data = await response.json();
  const text = (data.content || [])
    .map((block) => block.text || '')
    .filter(Boolean)
    .join('\n')
    .trim();

  return text || ruleBasedSummary(tests);
}

async function generateSummary(tests, patient) {
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return await callAnthropic(tests, patient);
    } catch (err) {
      console.warn('Anthropic AI summary failed, falling back to rule-based analyzer:', err.message);
      return ruleBasedSummary(tests);
    }
  }
  return ruleBasedSummary(tests);
}

module.exports = { generateSummary, ruleBasedSummary };

function clean(text) {
  return String(text || "").trim().toLowerCase();
}

function scoreMatch({ skills, needed, city, otherCity, college, otherCollege }) {
  const have = (skills || []).map(clean);
  const matchedSkills = (needed || []).filter((s) => have.includes(clean(s)));

  let score = matchedSkills.length * 10;
  if (city && otherCity && clean(city) === clean(otherCity)) score += 3;
  if (college && otherCollege && clean(college) === clean(otherCollege)) score += 1;

  return { score, matchedSkills };
}

module.exports = { scoreMatch };
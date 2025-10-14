export function getProductRecommendations(product, allProducts){
  if(!product?.name || !Array.isArray(allProducts)) return [];

  const keywords = extractKeywords(product.name);

  const similar = allProducts.filter((p) => {
    if(p.id === product.id) return false;
    const name = p.name.toLowerCase();
    return keywords.some((kw) => name.includes(kw));
  });

  const ranked = similar.map((p) => ({
    ...p,
    score: countMathes(p.name.toLowerCase(), keywords),
  }))
  .sort((a,b) => b.score - a.score);

  return ranked.slice(0,5);
}

function extractKeywords(name){
  const stopWords = ["de", "para", "el", "la", "los", "las", "un", "una"];
  return name.toLowerCase().split(/\s+/).filter((w) => w.length > 2 && !stopWords.includes(w));
}

function countMathes(text, keywords){
  return keywords.reduce((acc, kw) => (text.includes(kw) ? acc +1 : acc), 0);
}

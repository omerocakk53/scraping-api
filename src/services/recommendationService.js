const buildProjectRecommendations = (projectInsights) => {
  const recommendations = [];
  const { totalRuns, failedRuns, totalTargets, sourceBreakdown } = projectInsights;

  if (totalRuns === 0) {
    recommendations.push({
      type: "setup",
      priority: "high",
      message: "Bu proje için ilk scrape çalıştırılmalı veya en az bir target eklenmeli.",
    });
  }

  if (failedRuns > 0) {
    recommendations.push({
      type: "stability",
      priority: "high",
      message: "Hatalı çalışmaları azaltmak için selector ve timeout ayarları gözden geçirilmeli.",
    });
  }

  if (totalTargets < 2) {
    recommendations.push({
      type: "coverage",
      priority: "medium",
      message: "Proje kapsamını genişletmek için en az bir ek kaynak targetı tanımlanabilir.",
    });
  }

  const sourceCount = Object.keys(sourceBreakdown || {}).length;
  if (sourceCount === 1) {
    recommendations.push({
      type: "diversification",
      priority: "medium",
      message: "Tek kaynağa bağlı kalmamak için ikinci bir platform eklemek veri kalitesini artırır.",
    });
  }

  if (recommendations.length === 0) {
    recommendations.push({
      type: "health",
      priority: "low",
      message: "Proje sağlıklı görünüyor. Yeni kaynaklar ve export otomasyonları eklenebilir.",
    });
  }

  return {
    generatedAt: new Date().toISOString(),
    recommendations,
  };
};

module.exports = {
  buildProjectRecommendations,
};

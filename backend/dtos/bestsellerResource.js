export const toBestsellerResource = (row = {}) => {
  return {
    _id: row._id,
    name: row.name,
    price: row.price,
    image: row.image,
    images: row.images,
    category: row.category,
    rating: row.rating,
    numReviews: row.numReviews,
    stock: row.stock,
    createdAt: row.createdAt,
    trendingScore: row.bestsellerScore,
    isTrending: true,
    bestseller: {
      score: row.bestsellerScore,
      totalSales: row.totalSales,
      sales24h: row.sales24h,
      sales7d: row.sales7d,
      sales30d: row.sales30d,
      revenue: row.revenue,
      refundCount: row.refundCount,
    },
  };
};

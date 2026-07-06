const Item = require('../models/Item');
const Transaction = require('../models/Transaction');

// GET /api/ledger
const getLedger = async (req, res) => {
  const { page = 1, limit = 20 } = req.query;

  // We want to fetch all items that have been successfully given away
  const itemQuery = { status: 'given' };
  
  // We want to fetch all financial donations that were successful
  const trxQuery = { status: 'successful', type: { $in: ['donation', 'fundraiser_contribution'] } };

  const [items, totalItems, transactions, totalTrx] = await Promise.all([
    Item.find(itemQuery)
      .sort('-updatedAt')
      .populate('giver', 'name')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(),
    Item.countDocuments(itemQuery),
    Transaction.find(trxQuery)
      .sort('-createdAt')
      .populate('user', 'name')
      .populate('fundraiser', 'title category')
      .skip((page - 1) * limit)
      .limit(parseInt(limit))
      .lean(),
    Transaction.countDocuments(trxQuery)
  ]);

  // Combine items and transactions into a unified ledger stream
  const combined = [];
  
  for (const item of items) {
    combined.push({
      _id: item._id,
      ledgerType: 'item',
      title: item.title,
      category: item.category,
      giver: { name: item.giver?.name },
      updatedAt: item.updatedAt
    });
  }

  for (const tx of transactions) {
    combined.push({
      _id: tx._id,
      ledgerType: 'donation',
      title: `Financial Donation (${(tx.amount || 0).toLocaleString()} XAF)`,
      category: tx.fundraiser?.category || 'General Fund',
      giver: { name: tx.user?.name },
      updatedAt: tx.createdAt,
      amount: tx.amount,
      fundraiserTitle: tx.fundraiser?.title
    });
  }

  // Sort unified list descending by date
  combined.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));

  const finalList = combined.slice(0, parseInt(limit));
  const total = totalItems + totalTrx;

  res.set('Cache-Control', 'public, s-maxage=60, stale-while-revalidate=300');
  res.json({
    success: true,
    data: {
      ledger: finalList,
      totalDonations: totalItems, 
      totalFinancial: totalTrx,
      page: parseInt(page),
      pages: Math.ceil(total / parseInt(limit)),
    }
  });
};

module.exports = { getLedger };

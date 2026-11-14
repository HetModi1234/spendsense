const request = require('supertest');
const app = require('../app');
const { getCurrentMonthStr } = require('../utils/dateUtils');

describe('Budget Management & Calculation API', () => {
  let token;
  const currentMonth = getCurrentMonthStr();

  beforeEach(async () => {
    const res = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'Bob Martin',
        email: 'bob@example.com',
        password: 'password123',
        monthlyBudget: 20000
      });
    token = res.body.token;
  });

  it('should set total and category budgets', async () => {
    const res = await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        month: currentMonth,
        totalBudget: 25000,
        categoryBudgets: [
          { category: 'Food', limit: 8000 },
          { category: 'Transportation', limit: 4000 }
        ]
      });

    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.data.totalBudget).toBe(25000);
    expect(res.body.data.categoryBudgets.length).toBe(2);
  });

  it('should accurately calculate budget remaining and utilization percentage', async () => {
    // Set budget
    await request(app)
      .post('/api/budgets')
      .set('Authorization', `Bearer ${token}`)
      .send({
        month: currentMonth,
        totalBudget: 10000,
        categoryBudgets: [{ category: 'Food', limit: 5000 }]
      });

    // Add 2500 Food expense
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${token}`)
      .send({
        type: 'expense',
        amount: 2500,
        category: 'Food',
        description: 'Groceries'
      });

    const getRes = await request(app)
      .get(`/api/budgets?month=${currentMonth}`)
      .set('Authorization', `Bearer ${token}`);

    expect(getRes.status).toBe(200);
    expect(getRes.body.data.totalBudget).toBe(10000);
    expect(getRes.body.data.totalSpent).toBe(2500);
    expect(getRes.body.data.remaining).toBe(7500);
    expect(getRes.body.data.utilization).toBe(25);
  });
});

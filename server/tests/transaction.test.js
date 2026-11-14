const request = require('supertest');
const app = require('../app');

describe('Transaction Management & Ownership API', () => {
  let tokenA;
  let tokenB;
  let userAId;

  beforeEach(async () => {
    // Register User A
    const resA = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User A',
        email: 'userA@test.com',
        password: 'password123'
      });
    tokenA = resA.body.token;
    userAId = resA.body.user.id;

    // Register User B
    const resB = await request(app)
      .post('/api/auth/register')
      .send({
        name: 'User B',
        email: 'userB@test.com',
        password: 'password123'
      });
    tokenB = resB.body.token;
  });

  it('should create an expense transaction for authenticated user', async () => {
    const res = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'expense',
        amount: 450,
        category: 'Food',
        merchant: 'Swiggy',
        description: 'Dinner delivery',
        paymentMethod: 'UPI'
      });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.data.amount).toBe(450);
    expect(res.body.data.merchant).toBe('Swiggy');
  });

  it('should flag duplicate transaction when same amount and merchant added within 24 hours', async () => {
    // First transaction
    await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'expense',
        amount: 450,
        category: 'Food',
        merchant: 'Swiggy',
        description: 'Dinner delivery',
        paymentMethod: 'UPI'
      });

    // Second identical transaction
    const dupRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'expense',
        amount: 450,
        category: 'Food',
        merchant: 'Swiggy',
        description: 'Dinner delivery',
        paymentMethod: 'UPI'
      });

    expect(dupRes.status).toBe(201);
    expect(dupRes.body.duplicateWarning).toBeDefined();
    expect(dupRes.body.data.duplicateStatus).toBe('potential');
  });

  it('should prevent User B from updating or deleting User A transactions', async () => {
    // User A creates transaction
    const createRes = await request(app)
      .post('/api/transactions')
      .set('Authorization', `Bearer ${tokenA}`)
      .send({
        type: 'expense',
        amount: 1200,
        category: 'Shopping',
        description: 'Book purchase'
      });

    const txId = createRes.body.data._id;

    // User B attempts to update
    const updateRes = await request(app)
      .put(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${tokenB}`)
      .send({ amount: 999 });

    expect(updateRes.status).toBe(404);

    // User B attempts to delete
    const deleteRes = await request(app)
      .delete(`/api/transactions/${txId}`)
      .set('Authorization', `Bearer ${tokenB}`);

    expect(deleteRes.status).toBe(404);
  });
});

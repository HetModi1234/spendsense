const request = require('supertest');
const app = require('../app');
const { computeExpenseSplits } = require('../services/sharedExpenseService');

describe('Shared Expenses & Roommate Settlement Algorithm', () => {
  let hetToken, hetId;
  let rahulToken, rahulId;
  let jayToken, jayId;
  let groupId;

  beforeEach(async () => {
    // Het
    const r1 = await request(app).post('/api/auth/register').send({
      name: 'Het',
      email: 'het@room.com',
      password: 'password123'
    });
    hetToken = r1.body.token;
    hetId = r1.body.user.id;

    // Rahul
    const r2 = await request(app).post('/api/auth/register').send({
      name: 'Rahul',
      email: 'rahul@room.com',
      password: 'password123'
    });
    rahulToken = r2.body.token;
    rahulId = r2.body.user.id;

    // Jay
    const r3 = await request(app).post('/api/auth/register').send({
      name: 'Jay',
      email: 'jay@room.com',
      password: 'password123'
    });
    jayToken = r3.body.token;
    jayId = r3.body.user.id;

    // Create group with Het, Rahul, Jay
    const groupRes = await request(app)
      .post('/api/groups')
      .set('Authorization', `Bearer ${hetToken}`)
      .send({
        name: 'Roommates Apartment',
        memberEmails: ['rahul@room.com', 'jay@room.com']
      });

    groupId = groupRes.body.data._id;
  });

  it('should accurately split an expense equally across 3 members', () => {
    const rawSplits = [
      { userId: 'u1' },
      { userId: 'u2' },
      { userId: 'u3' }
    ];

    const splits = computeExpenseSplits(3000, 'equal', rawSplits);
    expect(splits.length).toBe(3);
    expect(splits[0].amount).toBe(1000);
    expect(splits[1].amount).toBe(1000);
    expect(splits[2].amount).toBe(1000);
  });

  it('should correctly calculate that Rahul owes Het ₹1000 and Jay owes Het ₹1000 when Het pays ₹3000', async () => {
    // Het pays ₹3000 electricity bill
    const expenseRes = await request(app)
      .post(`/api/groups/${groupId}/expenses`)
      .set('Authorization', `Bearer ${hetToken}`)
      .send({
        title: 'Electricity Bill',
        amount: 3000,
        paidBy: hetId,
        splitType: 'equal',
        splits: [
          { userId: hetId },
          { userId: rahulId },
          { userId: jayId }
        ]
      });

    expect(expenseRes.status).toBe(201);

    // Fetch balances
    const balanceRes = await request(app)
      .get(`/api/groups/${groupId}/balances`)
      .set('Authorization', `Bearer ${hetToken}`);

    expect(balanceRes.status).toBe(200);

    const balances = balanceRes.body.data.memberBalances;
    const hetBal = balances.find(b => String(b.member.id) === String(hetId));
    const rahulBal = balances.find(b => String(b.member.id) === String(rahulId));
    const jayBal = balances.find(b => String(b.member.id) === String(jayId));

    // Het is owed +2000 (paid 3000, his share 1000)
    expect(hetBal.netBalance).toBe(2000);
    // Rahul owes -1000
    expect(rahulBal.netBalance).toBe(-1000);
    // Jay owes -1000
    expect(jayBal.netBalance).toBe(-1000);

    // Verify suggested simplified settlements
    const settlements = balanceRes.body.data.suggestedSettlements;
    expect(settlements.length).toBe(2);

    const rahulSettlement = settlements.find(s => String(s.from) === String(rahulId));
    expect(rahulSettlement.to).toBe(hetId);
    expect(rahulSettlement.amount).toBe(1000);

    const jaySettlement = settlements.find(s => String(s.from) === String(jayId));
    expect(jaySettlement.to).toBe(hetId);
    expect(jaySettlement.amount).toBe(1000);
  });

  it('should clear debts when a settlement is recorded', async () => {
    // Het pays ₹3000
    await request(app)
      .post(`/api/groups/${groupId}/expenses`)
      .set('Authorization', `Bearer ${hetToken}`)
      .send({
        title: 'Electricity Bill',
        amount: 3000,
        paidBy: hetId,
        splitType: 'equal',
        splits: [{ userId: hetId }, { userId: rahulId }, { userId: jayId }]
      });

    // Rahul settles ₹1000 to Het
    await request(app)
      .post(`/api/groups/${groupId}/settlements`)
      .set('Authorization', `Bearer ${rahulToken}`)
      .send({
        payerId: rahulId,
        payeeId: hetId,
        amount: 1000,
        paymentMethod: 'UPI'
      });

    const balanceRes = await request(app)
      .get(`/api/groups/${groupId}/balances`)
      .set('Authorization', `Bearer ${hetToken}`);

    const rahulBal = balanceRes.body.data.memberBalances.find(b => String(b.member.id) === String(rahulId));
    expect(rahulBal.netBalance).toBe(0);
  });
});

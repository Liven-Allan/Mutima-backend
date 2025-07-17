const mongoose = require('mongoose');
const dotenv = require('dotenv');
const User = require('./models/User');
const CashExpenditure = require('./models/CashExpenditure');
const bcrypt = require('bcryptjs');
const CommodityRequest = require('./models/CommodityRequest');
const Customer = require('./models/Customer');

dotenv.config({ path: __dirname + '/.env' });

async function createAdmin() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Check if admin already exists
    const existingAdmin = await User.findOne({ email: 'admin@example.com' });
    if (existingAdmin) {
      console.log('Admin user already exists');
      return;
    }

    // Hash password before saving
    const hashedPassword = await bcrypt.hash('admin1234', 12);

    const admin = new User({
      username: 'adminuser',
      email: 'admin@example.com',
      password: hashedPassword,
      first_name: 'Liven',
      last_name: 'Allan',
      phone: '0700000000',
      role: 'SalesManager'
    });

    await admin.save();
    console.log('Admin user created successfully');
  } catch (err) {
    console.error('Error creating admin:', err);
    throw err;
  }
}

const purposes = [
  'Food', 'Transport', 'Fuel', 'Sacco', 'Abatapowa', 
  'Office Supplies', 'Internet', 'Maintenance', 'Utilities', 'Other'
];

async function seedExpenses() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB');

    // Clear old seed data to avoid duplicates
    await CashExpenditure.deleteMany({});
    const now = new Date();
    const expenses = [];
    for (let m = 0; m < 5; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 5);
      const year = monthDate.getFullYear();
      const month = (monthDate.getMonth() + 1).toString().padStart(2, '0');
      for (let i = 0; i < 5; i++) {
        const day = 2 + i * 5;
        const date = new Date(year, monthDate.getMonth(), day);
        // Skip if date is in the future
        if (date > now) continue;
        const transaction_reference = `EXP-${year}${month}-${(i + 1).toString().padStart(5, '0')}`;
        expenses.push({
          amount: Math.floor(Math.random() * 100000) + 1000,
          purpose: purposes[Math.floor(Math.random() * purposes.length)],
          expenditure_date: date,
          expense_type: 'Cash Expenditure',
          payment_source: 'petty_cash',
          expenditure_category: 'other',
          status: 'pending',
          transaction_reference,
        });
      }
    }
    for (const expense of expenses) {
      await new CashExpenditure(expense).save();
    }
    console.log('Seeded CashExpenditure records for the past 5 months.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding expenses:', err);
    throw err;
  }
}

async function seedCommodityRequests() {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB for CommodityRequest seeding');
    await CommodityRequest.deleteMany({});
    // Get all customer_ids
    const customers = await Customer.find({}, '_id phone');
    const customerIds = customers.map(c => ({ id: c._id, phone: c.phone }));
    const fallbackCustomer = { id: '6866eb5f4889c3808385717c', phone: '0788989006' };
    const now = new Date();
    const productTypes = ['other', 'unit_based', 'weight_based'];
    const priorities = ['low', 'medium', 'high'];
    const statuses = ['pending', 'approved', 'rejected', 'fulfilled', 'partially_fulfilled'];
    const commodityNames = ['Basmatti', 'White star', 'Pilao', 'Gnuts', 'Kick Snacks', 'Maize', 'Beans', 'Sugar', 'Salt', 'Rice'];
    const requests = [];
    for (let m = 0; m < 5; m++) {
      const monthDate = new Date(now.getFullYear(), now.getMonth() - m, 5);
      for (let i = 0; i < 5; i++) {
        const day = 2 + i * 5;
        const date = new Date(monthDate.getFullYear(), monthDate.getMonth(), day);
        if (date > now) continue;
        const customer = customerIds.length > 0 ? customerIds[Math.floor(Math.random() * customerIds.length)] : fallbackCustomer;
        requests.push({
          commodity_name: commodityNames[Math.floor(Math.random() * commodityNames.length)],
          requested_date: date,
          quantity_desired: Math.floor(Math.random() * 100) + 10,
          product_type: productTypes[Math.floor(Math.random() * productTypes.length)],
          status: statuses[Math.floor(Math.random() * statuses.length)],
          customer_id: customer.id,
          customer_contact: customer.phone,
          priority: priorities[Math.floor(Math.random() * priorities.length)],
          fulfilled_quantity: 0,
        });
      }
    }
    for (const req of requests) {
      await new CommodityRequest(req).save();
    }
    console.log('Seeded CommodityRequest records for the past 5 months.');
    process.exit(0);
  } catch (err) {
    console.error('Error seeding commodity requests:', err);
    process.exit(1);
  }
}

async function main() {
  try {
    await createAdmin();
    // await seedExpenses(); // CashExpenditure seeder is now commented out
    await seedCommodityRequests();
    process.exit(0);
  } catch (err) {
    console.error('Script failed:', err);
    process.exit(1);
  }
}

if (require.main === module) {
  (async () => {
    await createAdmin();
    // await seedExpenses(); // CashExpenditure seeder is now commented out
    await seedCommodityRequests();
    process.exit(0);
  })();
}
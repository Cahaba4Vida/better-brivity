// lib/storage.js
// Persistent storage wrapper using localStorage (window.storage API fallback)

const PREFIX = 'rp_';

export const storage = {
  get(key) {
    try {
      const raw = localStorage.getItem(PREFIX + key);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  },
  set(key, value) {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
      return true;
    } catch { return false; }
  },
  delete(key) {
    try {
      localStorage.removeItem(PREFIX + key);
      return true;
    } catch { return false; }
  }
};

// Default data model seeds
export const DEFAULT_DEALS = [
  {
    id: 'deal_001',
    address: '2847 Magnolia Drive',
    city: 'Austin, TX 78704',
    type: 'listing',
    status: 'active',
    price: 895000,
    client: 'The Harrington Family',
    clientPhone: '(512) 555-0192',
    clientEmail: 'harrington@email.com',
    mlsNumber: 'MLS-2024-8812',
    listDate: '2025-04-18',
    expiryDate: '2025-07-18',
    daysOnMarket: 13,
    showings: 7,
    openHouses: 1,
    notes: 'Motivated sellers, already found new home. Staged by Maria Chen.',
    photo: null,
    tasks: [
      { id: 't1', text: 'Follow up on Sunday open house feedback', done: false, urgent: true },
      { id: 't2', text: 'Send weekly activity report to sellers', done: false, urgent: false },
      { id: 't3', text: 'Confirm professional photos delivered to MLS', done: true, urgent: false },
    ]
  },
  {
    id: 'deal_002',
    address: '519 Riverside Court',
    city: 'Austin, TX 78701',
    type: 'transaction',
    status: 'under_contract',
    price: 1250000,
    client: 'Marcus & Elena Delgado',
    clientPhone: '(512) 555-0341',
    clientEmail: 'mdelgado@email.com',
    mlsNumber: 'MLS-2024-7741',
    listDate: '2025-03-22',
    contractDate: '2025-04-10',
    closeDate: '2025-05-15',
    earnestMoney: 25000,
    lender: 'First National Bank – Jeff Cortez',
    titleCompany: 'Austin Title Co.',
    inspectionDate: '2025-04-17',
    optionPeriodEnd: '2025-04-20',
    notes: 'Buyers are relocating from NYC. Tight timeline. Inspection report was mostly minor items.',
    tasks: [
      { id: 't4', text: 'Confirm appraisal has been ordered', done: false, urgent: true },
      { id: 't5', text: 'Request seller repair response by EOD', done: false, urgent: true },
      { id: 't6', text: 'Send final walkthrough reminder to buyers', done: false, urgent: false },
      { id: 't7', text: 'Verify earnest money deposited', done: true, urgent: false },
    ],
    contingencies: [
      { name: 'Option Period', deadline: '2025-04-20', done: true },
      { name: 'Appraisal', deadline: '2025-04-28', done: false },
      { name: 'Financing', deadline: '2025-05-05', done: false },
      { name: 'Final Walkthrough', deadline: '2025-05-13', done: false },
    ]
  },
  {
    id: 'deal_003',
    address: '104 Elm Park Lane',
    city: 'Round Rock, TX 78664',
    type: 'buyer',
    status: 'searching',
    price: 550000,
    client: 'Dr. Sarah Kim',
    clientPhone: '(512) 555-0887',
    clientEmail: 'sarahkim.md@email.com',
    preApprovalAmount: 600000,
    lender: 'Chase – Rachel Torres',
    notes: 'Looking for 4/3, good schools, home office. Pre-approved. Moving from Houston in July.',
    tasks: [
      { id: 't8', text: 'Schedule 3 new showings for this weekend', done: false, urgent: false },
      { id: 't9', text: 'Send updated MLS search with new criteria', done: false, urgent: false },
    ]
  }
];

export const DEFAULT_CONTACTS = [
  { id: 'c1', name: 'The Harrington Family', type: 'seller', email: 'harrington@email.com', phone: '(512) 555-0192', dealId: 'deal_001' },
  { id: 'c2', name: 'Marcus & Elena Delgado', type: 'buyer', email: 'mdelgado@email.com', phone: '(512) 555-0341', dealId: 'deal_002' },
  { id: 'c3', name: 'Dr. Sarah Kim', type: 'buyer', email: 'sarahkim.md@email.com', phone: '(512) 555-0887', dealId: 'deal_003' },
  { id: 'c4', name: 'Jeff Cortez – First National', type: 'lender', email: 'jcortez@firstnational.com', phone: '(512) 555-0210' },
  { id: 'c5', name: 'Austin Title Co.', type: 'title', email: 'escrow@austintitle.com', phone: '(512) 555-0445' },
];

export const AGENT_PROFILE_DEFAULT = {
  name: 'Your Name',
  brokerage: 'Your Brokerage',
  license: '',
  phone: '',
  email: '',
  apiKey: '',
};

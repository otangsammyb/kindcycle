const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const crypto = require('crypto');

const ENCRYPTION_KEY = (process.env.ENCRYPTION_KEY || 'kindcycle_enc_key_32chars_secure!').padEnd(32).slice(0, 32);
const IV_LENGTH = 16;

function encrypt(text) {
  if (!text) return text;
  const iv = crypto.randomBytes(IV_LENGTH);
  const cipher = crypto.createCipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
  let encrypted = cipher.update(text);
  encrypted = Buffer.concat([encrypted, cipher.final()]);
  return iv.toString('hex') + ':' + encrypted.toString('hex');
}

function decrypt(text) {
  if (!text) return text;
  try {
    const [ivHex, encryptedHex] = text.split(':');
    const iv = Buffer.from(ivHex, 'hex');
    const encryptedText = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(ENCRYPTION_KEY), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
  } catch { return null; }
}

const userSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true, select: false },
  phone: { type: String, trim: true },
  role: { type: String, enum: ['giver', 'receiver', 'admin'], default: 'receiver' },

  // ID Verification
  idScanFileId: { type: mongoose.Schema.Types.ObjectId, default: null }, // GridFS ref (encrypted)
  idScanOriginalName: { type: String, default: null },
  idVerified: { type: Boolean, default: false },
  idVerificationNote: { type: String, default: '' },

  // Profile
  avatar: { type: String, default: null },
  bio: { type: String, default: '' },
  location: {
    type: { type: String, enum: ['Point'], default: 'Point' },
    coordinates: { type: [Number], default: [0, 0] }, // [lng, lat]
    city: { type: String, default: '' },
    country: { type: String, default: '' },
  },

  // Settings
  isActive: { type: Boolean, default: true },
  isBanned: { type: Boolean, default: false },
  banReason: { type: String, default: '' },
  emailNotifications: { type: Boolean, default: true },
  pushNotifications: { type: Boolean, default: true },

  // Advanced hook fields
  aiNeedScore: { type: Number, default: null }, // AI need detection hook
  blockchainAddress: { type: String, default: null }, // Blockchain hook

  // Social
  trustScore: { type: Number, default: 0 },
  reviewCount: { type: Number, default: 0 },

  refreshToken: { type: String, select: false },
}, { timestamps: true });

// Geospatial index
userSchema.index({ location: '2dsphere' });

// Hash password before save
userSchema.pre('save', async function (next) {
  if (!this.isModified('password')) return next();
  this.password = await bcrypt.hash(this.password, 12);
  next();
});

// Compare password
userSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Encrypt sensitive data helper
userSchema.statics.encrypt = encrypt;
userSchema.statics.decrypt = decrypt;

// Remove sensitive fields from JSON output
userSchema.methods.toPublicJSON = function () {
  const obj = this.toObject();
  delete obj.password;
  delete obj.refreshToken;
  delete obj.idScanFileId;
  return obj;
};

module.exports = mongoose.model('User', userSchema);

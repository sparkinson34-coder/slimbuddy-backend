import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();

const payload = {
  sub: 'ca2a7bd6-cfc4-428a-b643-746d83414b16', // 👤 Must match the dummy user in Supabase
  email: 'sparkinson01@googlemail.com',
  role: 'authenticated'
};

const token = jwt.sign(payload, process.env.SUPABASE_JWT_SECRET, {
  algorithm: 'HS256',
  expiresIn: '1h'
});

console.log('Your test token:\n');
console.log(token);

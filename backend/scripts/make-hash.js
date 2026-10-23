import bcrypt from 'bcryptjs';

const plain = process.argv[2] || "Admin1234!";

bcrypt.hash(plain, 10).then(hash => {
  console.log(`Password : ${plain}`);
  console.log(`HASH     : ${hash}`);
});

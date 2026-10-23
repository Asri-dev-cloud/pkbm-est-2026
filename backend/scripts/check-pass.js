import bcrypt from 'bcryptjs';

const hash = process.argv[2] || "<HASH_PASSWORD>";
const plainPassword = process.argv[3] || "Admin1234!";

console.log(`Menguji password "${plainPassword}" terhadap hash...`);
bcrypt.compare(plainPassword, hash).then(res => {
  if (res) {
    console.log("✅ Password cocok!");
  } else {
    console.log("❌ Password TIDAK cocok!");
  }
});

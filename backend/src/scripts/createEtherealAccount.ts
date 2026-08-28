import nodemailer from "nodemailer"


async function main() {
  const testAccount = await nodemailer.createTestAccount();
  console.log("Ethereal test account created — save these to your .env:\n");
  console.log(`ETHEREAL_USER="${testAccount.user}"`);
  console.log(`ETHEREAL_PASS="${testAccount.pass}"`);
  console.log(`\nSMTP host: ${testAccount.smtp.host}, port: ${testAccount.smtp.port}`);
}

main();
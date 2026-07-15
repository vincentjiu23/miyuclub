const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://postgres@localhost:5432/miyuclub" } } });

async function main() {
  const admin = await prisma.user_miyu.findUnique({ where: { username: 'admin' } });
  if (admin) {
    console.log("=== ADMIN FOUND ===");
    console.log("Username:", admin.username);
    console.log("Password:", admin.password);
    console.log("Email:", admin.email);
    console.log("ID:", admin.id);
  } else {
    console.log("=== NO ADMIN USER FOUND ===");
    console.log("Listing all users...");
    const users = await prisma.user_miyu.findMany({ select: { username: true, password: true, email: true } });
    users.forEach(u => console.log(`  @${u.username} | ${u.email} | pw: ${u.password}`));
    if (users.length === 0) console.log("  (no users in database)");
  }
  await prisma.$disconnect();
}
main().catch(e => { console.error(e); process.exit(1); });

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({ datasources: { db: { url: "postgresql://postgres@localhost:5432/miyuclub" } } });

async function main() {
  // Set yuri and igor as admin
  const admins = ['yuri', 'igor'];
  
  for (const username of admins) {
    const result = await prisma.user_miyu.updateMany({
      where: { username },
      data: { role: 'admin' }
    });
    if (result.count > 0) {
      console.log(`✅ @${username} → role set to "admin"`);
    } else {
      console.log(`⚠️  @${username} not found in database`);
    }
  }

  // Verify
  console.log("\n--- All users with roles ---");
  const users = await prisma.user_miyu.findMany({
    select: { username: true, email: true, role: true }
  });
  users.forEach(u => console.log(`  @${u.username} | ${u.email} | role: ${u.role}`));

  await prisma.$disconnect();
}

main().catch(e => { console.error(e); process.exit(1); });

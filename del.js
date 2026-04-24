const { PrismaClient } = require("@prisma/client")
const p = new PrismaClient()
p.certificate.deleteMany({ where: { userId: "cmniv4lan000084natgh4o5sp" } }).then(r => console.log("Deleted:", r.count)).finally(() => p.$disconnect())
const{PrismaClient}=require("@prisma/client")
const p=new PrismaClient()
p.certificate.deleteMany({}).then(r=>console.log("Deleted:",r.count)).finally(()=>p.$disconnect())

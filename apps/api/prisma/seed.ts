import { PrismaClient, Role } from "@prisma/client";
const db = new PrismaClient();
async function main(){
  const farmer=await db.user.upsert({where:{wallet:"0x000000000000000000000000000000000000dE01"},update:{},create:{wallet:"0x000000000000000000000000000000000000dE01",displayName:"Meera Patil (Sample)",role:Role.FARMER}});
  await db.farm.create({data:{ownerId:farmer.id,name:"Riverbend Farm (Sample)",region:"Wardha, Maharashtra",geohash:"teknz",crop:"Soybean",acreage:12.5}});
  console.log("Seeded deterministic SAMPLE data; no real person, farm, or chain transaction is represented.");
}
main().finally(()=>db.$disconnect());

const { PrismaClient } = require("@prisma/client");
const crypto = require("crypto");
const prisma = new PrismaClient();

async function main() {
  console.log("Starting seeding...");

  // Clear database tables
  await prisma.message.deleteMany();
  await prisma.match.deleteMany();
  await prisma.session.deleteMany();
  await prisma.cafe.deleteMany();
  await prisma.user.deleteMany();
  await prisma.systemSetting.deleteMany();

  // Set default simulated offset time (0)
  await prisma.systemSetting.create({
    data: {
      key: "time_offset_hours",
      value: "0",
    },
  });

  // Seed Tehran Cafes
  const cafes = [
    {
      name: "کافه شمیران (Cafe Shemiran)",
      zone: "NORTH",
      address: "تهران، میدان تجریش، انتهای خیابان فناخسرو",
      lat: 35.8061,
      lng: 51.4239,
      description: "فضای دنج و آرام در دل تجریش با منظره کوه. مناسب برای اولین قرار ملاقات.",
      features: JSON.stringify(["وای‌فای رایگان", "محیط آرام", "مناسب قرار ملاقات", "قهوه تخصصی"]),
      isVerified: true,
    },
    {
      name: "کافه طهرون (Cafe Tehroon)",
      zone: "CENTER",
      address: "تهران، خیابان کریمخان، خیابان نجات‌اللهی (ویلا)، کوچه خسرو",
      lat: 35.7262,
      lng: 51.4182,
      description: "کافه‌ای با دکور مدرن و موسیقی ملایم در محدوده کریمخان.",
      features: JSON.stringify(["موسیقی زنده", "دسر و کیک", "دسترسی آسان مترو", "فضای باز"]),
      isVerified: true,
    },
    {
      name: "کافه کارمان (Cafe Karman)",
      zone: "WEST",
      address: "تهران، شهرک غرب، خیابان ایران زمین، پارک فدک",
      lat: 35.7554,
      lng: 51.3702,
      description: "کافه‌ای در پارک فدک با فضای سبز و تراس. ایده‌آل برای قرارهای عصرانه.",
      features: JSON.stringify(["فضای باز", "پارکینگ", "بدون سیگار", "مناسب قرار ملاقات"]),
      isVerified: true,
    },
    {
      name: "کافه روبرو (Cafe Rooberoo)",
      zone: "CENTER",
      address: "تهران، چهارراه ولیعصر، کوچه بالاور، پلاک ۴",
      lat: 35.7008,
      lng: 51.4071,
      description: "کافه‌ای صمیمی نزدیک ولیعصر با فضای داخلی گرم و نور ملایم.",
      features: JSON.stringify(["وای‌فای رایگان", "محیط آرام", "قهوه تخصصی", "دسترسی آسان مترو"]),
      isVerified: true,
    },
  ];

  for (const c of cafes) {
    await prisma.cafe.create({ data: c });
  }
  console.log(`Seeded ${cafes.length} cafes.`);

  // Seed Admin User
  await prisma.user.create({
    data: {
      email: "admin@luckytwo.ir",
      firstName: "ادمین",
      role: "admin",
      gender: "MALE",
      age: 30,
      isVerified: true,
      selfieStatus: "APPROVED",
    },
  });
  console.log("Seeded admin user (admin@luckytwo.ir).");

  // Seed Users with email addresses
  // Approved Male
  await prisma.user.create({
    data: {
      email: "amir@example.com",
      firstName: "امیر",
      age: 26,
      gender: "MALE",
      occupation: "برنامه‌نویس",
      selfieUrl: "/uploads/selfies/placeholder-male.jpg",
      isVerified: true,
      selfieStatus: "APPROVED",
      mbtiType: "INTJ",
      interests: JSON.stringify(["Tech/Startup", "Gaming", "Vinyl Music", "Minimalist", "Books"]),
      zones: JSON.stringify(["NORTH", "CENTER", "WEST"]),
      walletBalance: 500,
      height: 180,
      clothing: "یک تیشرت مشکی اورسایز و شلوار کتان طوسی",
    },
  });

  // Approved Female
  await prisma.user.create({
    data: {
      email: "sara@example.com",
      firstName: "سارا",
      age: 25,
      gender: "FEMALE",
      occupation: "طراح محصول",
      selfieUrl: "/uploads/selfies/placeholder-female.jpg",
      isVerified: true,
      selfieStatus: "APPROVED",
      mbtiType: "ENFP",
      interests: JSON.stringify(["Tech/Startup", "Camping", "Vinyl Music", "Anime", "Photography"]),
      zones: JSON.stringify(["NORTH", "CENTER", "EAST"]),
      walletBalance: 0,
      height: 168,
      clothing: "یک مانتو لنین سبز روشن و شال سفید",
    },
  });

  // Pending Male
  await prisma.user.create({
    data: {
      email: "reza@example.com",
      firstName: "رضا",
      age: 29,
      gender: "MALE",
      occupation: "معمار",
      selfieUrl: "/uploads/selfies/placeholder-male2.jpg",
      isVerified: false,
      selfieStatus: "PENDING",
      mbtiType: "INFJ",
      interests: JSON.stringify(["Minimalist", "Books", "Photography", "Boardgames", "Fitness"]),
      zones: JSON.stringify(["WEST", "CENTER", "NORTH"]),
      walletBalance: 100,
    },
  });

  // Pending Female
  await prisma.user.create({
    data: {
      email: "yasaman@example.com",
      firstName: "یاسمن",
      age: 24,
      gender: "FEMALE",
      occupation: "پزشک عمومی",
      selfieUrl: "/uploads/selfies/placeholder-female2.jpg",
      isVerified: false,
      selfieStatus: "PENDING",
      mbtiType: "ISTJ",
      interests: JSON.stringify(["Camping", "Books", "Fitness", "Gaming", "Anime"]),
      zones: JSON.stringify(["WEST", "NORTH", "CENTER"]),
      walletBalance: 0,
    },
  });

  console.log("Seeded mock users.");
  console.log("Seeding completed successfully!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

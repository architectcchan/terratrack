import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { sql } from "drizzle-orm";
import bcrypt from "bcryptjs";
import * as schema from "./schema";

const client = neon(process.env.DATABASE_URL!);
const db = drizzle(client, { schema });

// ─── Helpers ────────────────────────────────────────────────────────────────

const now = new Date();
function daysAgo(n: number) {
  const d = new Date(now);
  d.setDate(d.getDate() - n);
  return d;
}
function daysFromNow(n: number) {
  const d = new Date(now);
  d.setDate(d.getDate() + n);
  return d;
}
function dateStr(d: Date) {
  return d.toISOString().split("T")[0];
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

async function seed() {
  console.log("🌱 Seeding TerraTrack database...\n");

  // ─── 1. Delete all existing data ────────────────────────────────────────

  console.log("🗑️  Clearing existing data...");
  await db.execute(sql`TRUNCATE TABLE account_velocity_metrics CASCADE`);
  await db.execute(sql`TRUNCATE TABLE notifications CASCADE`);
  await db.execute(sql`TRUNCATE TABLE daily_routes CASCADE`);
  await db.execute(sql`TRUNCATE TABLE vendor_events CASCADE`);
  await db.execute(sql`TRUNCATE TABLE tasks CASCADE`);
  await db.execute(sql`TRUNCATE TABLE order_stage_history CASCADE`);
  await db.execute(sql`TRUNCATE TABLE order_line_items CASCADE`);
  await db.execute(sql`TRUNCATE TABLE orders CASCADE`);
  await db.execute(sql`TRUNCATE TABLE samples CASCADE`);
  await db.execute(sql`TRUNCATE TABLE visits CASCADE`);
  await db.execute(sql`TRUNCATE TABLE contacts CASCADE`);
  await db.execute(sql`TRUNCATE TABLE products CASCADE`);
  await db.execute(sql`TRUNCATE TABLE accounts CASCADE`);
  await db.execute(sql`TRUNCATE TABLE territories CASCADE`);
  await db.execute(sql`TRUNCATE TABLE account_chains CASCADE`);
  await db.execute(sql`TRUNCATE TABLE users CASCADE`);
  await db.execute(sql`TRUNCATE TABLE organizations CASCADE`);
  console.log("   ✓ All tables cleared\n");

  // ─── 2. Organization ───────────────────────────────────────────────────

  console.log("🏢 Creating organization...");
  const [org] = await db
    .insert(schema.organizations)
    .values({
      name: "Purp Dragon",
      slug: "purp-dragon",
      primaryState: "WA",
      orgSettings: { visitFrequencyDays: 14, sampleFollowUpDays: 7, atRiskDays: 30 },
    })
    .returning();
  const orgId = org.id;
  console.log(`   ✓ Purp Dragon (${orgId})\n`);

  // ─── 3. Users ──────────────────────────────────────────────────────────

  console.log("👥 Creating users...");
  const hash = await bcrypt.hash("demo123", 12);

  const [calvin] = await db
    .insert(schema.users)
    .values({
      orgId,
      email: "admin@purpdragon.com",
      passwordHash: hash,
      firstName: "Calvin",
      lastName: "Chen",
      phone: "(206) 555-0100",
      role: "admin",
      status: "active",
      lastActiveAt: daysAgo(0),
    })
    .returning();

  const [sarah] = await db
    .insert(schema.users)
    .values({
      orgId,
      email: "sarah@purpdragon.com",
      passwordHash: hash,
      firstName: "Sarah",
      lastName: "Kim",
      phone: "(206) 555-0101",
      role: "sales_manager",
      status: "active",
      lastActiveAt: daysAgo(0),
    })
    .returning();

  const [jake] = await db
    .insert(schema.users)
    .values({
      orgId,
      email: "jake@purpdragon.com",
      passwordHash: hash,
      firstName: "Jake",
      lastName: "Morrison",
      phone: "(206) 555-0102",
      role: "sales_rep",
      status: "active",
      lastActiveAt: daysAgo(1),
    })
    .returning();

  const [maya] = await db
    .insert(schema.users)
    .values({
      orgId,
      email: "maya@purpdragon.com",
      passwordHash: hash,
      firstName: "Maya",
      lastName: "Rodriguez",
      phone: "(253) 555-0103",
      role: "sales_rep",
      status: "active",
      lastActiveAt: daysAgo(0),
    })
    .returning();

  console.log(`   ✓ Calvin Chen (admin), Sarah Kim (manager), Jake Morrison (rep), Maya Rodriguez (rep)\n`);

  // ─── 4. Territories ───────────────────────────────────────────────────

  console.log("🗺️  Creating territories...");
  const [seattleTerritory] = await db
    .insert(schema.territories)
    .values({
      orgId,
      name: "Seattle Metro",
      description: "Seattle, Bellevue, Kirkland, Redmond, Renton area",
      zipCodes: ["98101","98102","98103","98104","98105","98107","98109","98112","98115","98116","98117","98118","98119","98121","98122","98125","98126","98133","98136","98144","98155","98177","98178","98188","98198"],
      assignedRepIds: [jake.id],
    })
    .returning();

  const [southTerritory] = await db
    .insert(schema.territories)
    .values({
      orgId,
      name: "South Sound",
      description: "Tacoma, Kent, Auburn, Federal Way, Puyallup area",
      zipCodes: ["98001","98002","98003","98030","98031","98032","98042","98047","98055","98057","98058","98092","98148","98158","98166","98168","98188","98198","98354","98371","98372","98374","98387","98402","98403","98404","98405","98406","98407","98408"],
      assignedRepIds: [maya.id],
    })
    .returning();
  console.log(`   ✓ Seattle Metro, South Sound\n`);

  // ─── 5. Account Chains ────────────────────────────────────────────────

  console.log("🔗 Creating account chains...");
  const [haveAHeart] = await db
    .insert(schema.accountChains)
    .values({ orgId, name: "Have a Heart", storeCount: 3, notes: "Great chain, consistent orders across all locations." })
    .returning();

  const [greenTheory] = await db
    .insert(schema.accountChains)
    .values({ orgId, name: "Green Theory", storeCount: 2, notes: "Premium positioning. They care about indoor-grown flower." })
    .returning();
  console.log(`   ✓ Have a Heart (3 stores), Green Theory (2 stores)\n`);

  // ─── 6. Accounts ──────────────────────────────────────────────────────

  console.log("🏪 Creating accounts...");
  const accountsData = [
    // A-tier active (4)
    { name: "Have a Heart — Capitol Hill", addressLine1: "1927 E Madison St", city: "Seattle", zip: "98122", lat: "47.6163500", lng: "-122.3052000", status: "active" as const, tier: "A" as const, rep: jake.id, territory: seattleTerritory.id, chain: haveAHeart.id, terms: "net_30" as const, license: "WA-412879", tags: ["top-account","indica-focused"] },
    { name: "Have a Heart — Ballard", addressLine1: "5632 NW Market St", city: "Seattle", zip: "98107", lat: "47.6688300", lng: "-122.3790900", status: "active" as const, tier: "A" as const, rep: jake.id, territory: seattleTerritory.id, chain: haveAHeart.id, terms: "net_30" as const, license: "WA-412880", tags: ["top-account"] },
    { name: "Green Theory — Bellevue", addressLine1: "14339 NE 20th St", city: "Bellevue", zip: "98007", lat: "47.6301200", lng: "-122.1465100", status: "active" as const, tier: "A" as const, rep: jake.id, territory: seattleTerritory.id, chain: greenTheory.id, terms: "net_15" as const, license: "WA-408231", tags: ["premium","top-account"] },
    { name: "Ruckus Recreational", addressLine1: "9750 Greenwood Ave N", city: "Seattle", zip: "98103", lat: "47.6972100", lng: "-122.3542500", status: "active" as const, tier: "A" as const, rep: jake.id, territory: seattleTerritory.id, chain: null, terms: "net_15" as const, license: "WA-415092", tags: ["top-account","flower-heavy"] },
    // B-tier active (4)
    { name: "Have a Heart — Greenwood", addressLine1: "8515 Greenwood Ave N", city: "Seattle", zip: "98103", lat: "47.6909300", lng: "-122.3543700", status: "active" as const, tier: "B" as const, rep: jake.id, territory: seattleTerritory.id, chain: haveAHeart.id, terms: "net_30" as const, license: "WA-412881", tags: [] },
    { name: "Green Theory — Renton", addressLine1: "3850 NE 4th St", city: "Renton", zip: "98056", lat: "47.4979900", lng: "-122.1762100", status: "active" as const, tier: "B" as const, rep: maya.id, territory: southTerritory.id, chain: greenTheory.id, terms: "net_15" as const, license: "WA-408232", tags: ["premium"] },
    { name: "The Bakeréé", addressLine1: "5601 Rainier Ave S", city: "Seattle", zip: "98118", lat: "47.5520000", lng: "-122.2843000", status: "active" as const, tier: "B" as const, rep: jake.id, territory: seattleTerritory.id, chain: null, terms: "cod" as const, license: "WA-419330", tags: ["budtender-friendly"] },
    { name: "World of Weed", addressLine1: "4305 Pacific Hwy E", city: "Tacoma", zip: "98424", lat: "47.2247700", lng: "-122.3924200", status: "active" as const, tier: "B" as const, rep: maya.id, territory: southTerritory.id, chain: null, terms: "net_15" as const, license: "WA-421782", tags: ["high-traffic","events-friendly"] },
    // sample_sent (3)
    { name: "Greenside Recreational", addressLine1: "12345 Lake City Way NE", city: "Seattle", zip: "98125", lat: "47.7189000", lng: "-122.2946000", status: "sample_sent" as const, tier: "unranked" as const, rep: jake.id, territory: seattleTerritory.id, chain: null, terms: "cod" as const, license: "WA-425100", tags: ["new-prospect"] },
    { name: "Rainier Cannabis", addressLine1: "5420 S Tacoma Way", city: "Tacoma", zip: "98409", lat: "47.2186000", lng: "-122.4714000", status: "sample_sent" as const, tier: "unranked" as const, rep: maya.id, territory: southTerritory.id, chain: null, terms: "cod" as const, license: "WA-428443", tags: ["new-prospect"] },
    { name: "Kushmart South", addressLine1: "8901 S Hosmer St", city: "Tacoma", zip: "98444", lat: "47.1815000", lng: "-122.4398000", status: "sample_sent" as const, tier: "unranked" as const, rep: maya.id, territory: southTerritory.id, chain: null, terms: "cod" as const, license: "WA-430211", tags: [] },
    // prospect (3)
    { name: "Zips Cannabis", addressLine1: "6401 NE Bothell Way", city: "Kenmore", zip: "98028", lat: "47.7571000", lng: "-122.2590000", status: "prospect" as const, tier: "unranked" as const, rep: jake.id, territory: seattleTerritory.id, chain: null, terms: "cod" as const, license: "WA-432001", tags: [] },
    { name: "Mary Mart", addressLine1: "6525 S Tacoma Way", city: "Tacoma", zip: "98409", lat: "47.2103000", lng: "-122.4714000", status: "prospect" as const, tier: "unranked" as const, rep: maya.id, territory: southTerritory.id, chain: null, terms: "cod" as const, license: "WA-418990", tags: [] },
    { name: "Emerald Haze", addressLine1: "22507 Marine View Dr S", city: "Des Moines", zip: "98198", lat: "47.3900000", lng: "-122.3171000", status: "prospect" as const, tier: "unranked" as const, rep: maya.id, territory: southTerritory.id, chain: null, terms: "cod" as const, license: "WA-435112", tags: [] },
    // at_risk (3)
    { name: "Lux Pot Shop", addressLine1: "11543 1st Ave NE", city: "Seattle", zip: "98125", lat: "47.7145000", lng: "-122.3271000", status: "at_risk" as const, tier: "B" as const, rep: jake.id, territory: seattleTerritory.id, chain: null, terms: "net_15" as const, license: "WA-409850", tags: ["needs-attention"], notes: "Haven't ordered in 5 weeks. Buyer said they're testing Phat Panda flower." },
    { name: "Dockside Cannabis — SoDo", addressLine1: "1728 4th Ave S", city: "Seattle", zip: "98134", lat: "47.5887000", lng: "-122.3301000", status: "at_risk" as const, tier: "C" as const, rep: jake.id, territory: seattleTerritory.id, chain: null, terms: "cod" as const, license: "WA-411203", tags: ["needs-attention"], notes: "Shelf is mostly competitor brands now. Need a vendor day to regain space." },
    { name: "Clear Choice Cannabis", addressLine1: "15506 Pacific Ave S", city: "Tacoma", zip: "98444", lat: "47.1808000", lng: "-122.4467000", status: "at_risk" as const, tier: "C" as const, rep: maya.id, territory: southTerritory.id, chain: null, terms: "cod" as const, license: "WA-423900", tags: ["needs-attention"], notes: "Was ordering monthly, stopped after quality complaint on last batch." },
    // C-tier (2) — included above in at_risk
    // dormant (1)
    { name: "Uncle Ike's — Lake City", addressLine1: "12511 Lake City Way NE", city: "Seattle", zip: "98125", lat: "47.7200000", lng: "-122.2930000", status: "dormant" as const, tier: "D" as const, rep: jake.id, territory: seattleTerritory.id, chain: null, terms: "cod" as const, license: "WA-406000", tags: ["dormant"], notes: "Buyer left, new buyer not interested. Revisit Q2." },
    // Extra accounts for 20 total
    { name: "Trees Cannabis — Fremont", addressLine1: "4720 Leary Ave NW", city: "Seattle", zip: "98107", lat: "47.6635000", lng: "-122.3601000", status: "active" as const, tier: "B" as const, rep: jake.id, territory: seattleTerritory.id, chain: null, terms: "net_15" as const, license: "WA-417500", tags: ["edible-focus"] },
    { name: "Herban Legends", addressLine1: "55 Bell St", city: "Seattle", zip: "98121", lat: "47.6146000", lng: "-122.3489000", status: "active" as const, tier: "A" as const, rep: jake.id, territory: seattleTerritory.id, chain: null, terms: "net_30" as const, license: "WA-407210", tags: ["top-account","downtown"] },
  ];

  const insertedAccounts = [];
  for (const a of accountsData) {
    const [acc] = await db
      .insert(schema.accounts)
      .values({
        orgId,
        name: a.name,
        addressLine1: a.addressLine1,
        city: a.city,
        state: "WA",
        zip: a.zip,
        latitude: a.lat,
        longitude: a.lng,
        phone: `(${pick(["206","253","425"])}) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
        email: a.name.toLowerCase().replace(/[^a-z0-9]/g, "").slice(0, 12) + "@gmail.com",
        licenseNumber: a.license,
        licenseType: "retailer",
        licenseExpiration: "2027-06-30",
        status: a.status,
        revenueTier: a.tier,
        chainId: a.chain,
        assignedRepId: a.rep,
        territoryId: a.territory,
        paymentTerms: a.terms,
        notes: (a as { notes?: string }).notes ?? null,
        tags: a.tags.length > 0 ? a.tags : null,
        createdBy: calvin.id,
      })
      .returning();
    insertedAccounts.push(acc);
  }
  console.log(`   ✓ ${insertedAccounts.length} accounts created\n`);

  // ─── 7. Contacts ──────────────────────────────────────────────────────

  console.log("📇 Creating contacts...");
  const contactTemplates = [
    { firstName: "Mike", lastName: "Thompson", role: "buyer" as const, primary: true, method: "phone" as const, days: ["Tuesday","Thursday"], times: "10am-2pm" },
    { firstName: "Lisa", lastName: "Nguyen", role: "store_manager" as const, primary: false, method: "email" as const, days: ["Monday","Wednesday","Friday"], times: "9am-11am" },
    { firstName: "Devon", lastName: "Brooks", role: "budtender" as const, primary: false, method: "in_person" as const, days: ["Saturday"], times: "Afternoon" },
    { firstName: "Rachel", lastName: "Kim", role: "buyer" as const, primary: true, method: "text" as const, days: ["Tuesday","Wednesday"], times: "11am-3pm" },
    { firstName: "Carlos", lastName: "Reyes", role: "owner" as const, primary: true, method: "phone" as const, days: ["Monday","Friday"], times: "Morning" },
    { firstName: "Amanda", lastName: "Foster", role: "assistant_manager" as const, primary: false, method: "email" as const, days: ["Wednesday","Thursday"], times: "10am-12pm" },
    { firstName: "Tyler", lastName: "Jenkins", role: "budtender" as const, primary: false, method: "in_person" as const, days: ["Friday","Saturday"], times: "Afternoon" },
    { firstName: "Samantha", lastName: "Lee", role: "buyer" as const, primary: true, method: "phone" as const, days: ["Monday","Tuesday","Thursday"], times: "9am-1pm" },
    { firstName: "Marcus", lastName: "Davis", role: "store_manager" as const, primary: false, method: "text" as const, days: ["Tuesday","Wednesday"], times: "10am-3pm" },
    { firstName: "Jessica", lastName: "Patel", role: "buyer" as const, primary: true, method: "email" as const, days: ["Wednesday","Friday"], times: "11am-2pm" },
  ];

  const allContacts: (typeof schema.contacts.$inferSelect)[] = [];
  for (const acc of insertedAccounts) {
    const numContacts = 3 + Math.floor(Math.random() * 2);
    const shuffled = [...contactTemplates].sort(() => Math.random() - 0.5);
    for (let i = 0; i < numContacts; i++) {
      const t = shuffled[i % shuffled.length];
      const [contact] = await db
        .insert(schema.contacts)
        .values({
          accountId: acc.id,
          orgId,
          firstName: t.firstName,
          lastName: t.lastName,
          role: t.role,
          isPrimaryDecisionMaker: t.primary && i === 0,
          phone: `(${pick(["206","253","425"])}) ${Math.floor(Math.random() * 900 + 100)}-${Math.floor(Math.random() * 9000 + 1000)}`,
          email: `${t.firstName.toLowerCase()}.${t.lastName.toLowerCase()}@email.com`,
          preferredContactMethod: t.method,
          bestVisitDays: t.days,
          bestVisitTimes: t.times,
          isActive: true,
        })
        .returning();
      allContacts.push(contact);
    }
  }
  console.log(`   ✓ ${allContacts.length} contacts created\n`);

  // ─── 8. Products ──────────────────────────────────────────────────────

  console.log("📦 Creating products...");
  const productsData = [
    { name: "Purple Dragon OG 3.5g", sku: "PD-FLW-001", category: "flower" as const, strain: "Purple Dragon OG", strainType: "indica" as const, thcMin: "28.00", thcMax: "32.00", unit: "3.5g", wholesale: "22.00", msrp: "40.00", inventory: 420, status: "active" as const, grow: "Indoor Hydro", desc: "Our flagship indica. Dense purple buds, gas & grape nose. Top seller across all accounts." },
    { name: "Purple Dragon OG 7g", sku: "PD-FLW-002", category: "flower" as const, strain: "Purple Dragon OG", strainType: "indica" as const, thcMin: "28.00", thcMax: "32.00", unit: "7g", wholesale: "40.00", msrp: "70.00", inventory: 200, status: "active" as const, grow: "Indoor Hydro", desc: "Quarter ounce of our signature Purple Dragon OG." },
    { name: "Dragon's Breath 3.5g", sku: "PD-FLW-003", category: "flower" as const, strain: "Dragon's Breath", strainType: "sativa" as const, thcMin: "25.00", thcMax: "29.00", unit: "3.5g", wholesale: "20.00", msrp: "35.00", inventory: 350, status: "active" as const, grow: "Living Soil", desc: "Uplifting sativa with citrus terps. Great for daytime consumers." },
    { name: "Mystic Haze 3.5g", sku: "PD-FLW-004", category: "flower" as const, strain: "Mystic Haze", strainType: "hybrid" as const, thcMin: "24.00", thcMax: "28.00", unit: "3.5g", wholesale: "18.00", msrp: "32.00", inventory: 280, status: "active" as const, grow: null, desc: "Balanced hybrid, smooth smoke. Appeals to a broad audience." },
    { name: "Purple Dragon Pre-Roll 1g", sku: "PD-PRE-001", category: "pre_roll" as const, strain: "Purple Dragon OG", strainType: "indica" as const, thcMin: "28.00", thcMax: "32.00", unit: "1g", wholesale: "6.00", msrp: "12.00", inventory: 600, status: "active" as const, grow: null, desc: "Single 1g pre-roll of Purple Dragon OG." },
    { name: "Dragon's Breath Pre-Roll 3pk", sku: "PD-PRE-002", category: "pre_roll" as const, strain: "Dragon's Breath", strainType: "sativa" as const, thcMin: "25.00", thcMax: "29.00", unit: "3x0.5g", wholesale: "12.00", msrp: "22.00", inventory: 400, status: "active" as const, grow: null, desc: "Three 0.5g sativa pre-rolls in a convenient pack." },
    { name: "Purp Dragon Infused Pre-Roll", sku: "PD-PRE-003", category: "pre_roll" as const, strain: "Purple Dragon OG", strainType: "hybrid" as const, thcMin: "35.00", thcMax: "40.00", unit: "1g", wholesale: "10.00", msrp: "18.00", inventory: 150, status: "limited" as const, grow: null, desc: "Infused pre-roll with live rosin. Premium offering, limited batches." },
    { name: "Dragon Gummies 10pk", sku: "PD-EDI-001", category: "edible" as const, strain: null, strainType: "hybrid" as const, thcMin: null, thcMax: null, unit: "100mg (10x10mg)", wholesale: "12.00", msrp: "25.00", inventory: 500, status: "active" as const, grow: null, desc: "Mixed fruit gummies, 10mg each. Consistent dosing, great reviews." },
    { name: "Purple Dragon Vape Cart 1g", sku: "PD-VAP-001", category: "vape" as const, strain: "Purple Dragon OG", strainType: "indica" as const, thcMin: "85.00", thcMax: "92.00", unit: "1g", wholesale: "18.00", msrp: "35.00", inventory: 300, status: "active" as const, grow: null, desc: "510-thread vape cart with Purple Dragon OG distillate." },
    { name: "Dragon Live Rosin 1g", sku: "PD-CON-001", category: "concentrate" as const, strain: "Dragon's Breath", strainType: "hybrid" as const, thcMin: "70.00", thcMax: "80.00", unit: "1g", wholesale: "25.00", msrp: "45.00", inventory: 120, status: "active" as const, grow: null, desc: "Solventless live rosin, full spectrum terps." },
    { name: "Purple Dragon Diamonds 1g", sku: "PD-CON-002", category: "concentrate" as const, strain: "Purple Dragon OG", strainType: "indica" as const, thcMin: "90.00", thcMax: "95.00", unit: "1g", wholesale: "30.00", msrp: "55.00", inventory: 60, status: "limited" as const, grow: null, desc: "THC-A diamonds with terp sauce. Ultra premium, limited drops." },
    { name: "Dragon's Breath Tincture 30ml", sku: "PD-TIN-001", category: "tincture" as const, strain: "Dragon's Breath", strainType: "cbd" as const, thcMin: null, thcMax: null, unit: "30ml", wholesale: "15.00", msrp: "30.00", inventory: 200, status: "active" as const, grow: null, desc: "500mg CBD tincture. MCT oil base, natural flavor." },
  ];

  const insertedProducts = [];
  for (const p of productsData) {
    const [prod] = await db
      .insert(schema.products)
      .values({
        orgId,
        name: p.name,
        sku: p.sku,
        category: p.category,
        strainName: p.strain,
        strainType: p.strainType,
        thcPercentMin: p.thcMin,
        thcPercentMax: p.thcMax,
        cbdPercentMin: p.category === "tincture" ? "500.00" : null,
        cbdPercentMax: p.category === "tincture" ? "500.00" : null,
        unitSize: p.unit,
        wholesalePrice: p.wholesale,
        msrp: p.msrp,
        availableInventory: p.inventory,
        status: p.status,
        growType: p.grow,
        turnaroundTime: "3-5 business days",
        minimumOrder: "10 units",
        description: p.desc,
      })
      .returning();
    insertedProducts.push(prod);
  }
  console.log(`   ✓ ${insertedProducts.length} products created\n`);

  // ─── 9. Visits ─────────────────────────────────────────────────────────

  console.log("📍 Creating visits...");
  const activeAccounts = insertedAccounts.filter(
    (a) => a.status === "active" || a.status === "at_risk" || a.status === "sample_sent",
  );

  const visitNotes = [
    "Buyer Mike loved the Purple Dragon OG look and smell. Said pricing is competitive with Phat Panda. Has shelf opening for 2 new indica strains. Wants us to call back next Tuesday with a quote for 50 units.",
    "Quick drop-in to check inventory levels. They're running low on Dragon's Breath pre-rolls — placed a reorder for 30 units on the spot. Budtender Devon says customers are asking for our edibles too.",
    "Met with store manager Lisa. She wants to do a vendor day next month. Showed her the new infused pre-rolls and she's excited about the 35-40% THC. Left samples of the Dragon Gummies.",
    "Buyer was out for the day. Left business card and product menu with the budtender. Need to schedule a proper meeting — the assistant manager said Tuesdays work best.",
    "Great meeting with Rachel. She placed an order for Purple Dragon OG (both sizes), Dragon's Breath, and the vape carts. Total order ~$1,200 wholesale. Wants net-15 terms.",
    "Training session with 3 budtenders. Covered our full product line, strain profiles, and talking points. They were really impressed with the live rosin quality. Left staff samples.",
    "Delivered last week's order. Everything checked out. Buyer mentioned competitor (Lifted) is offering 10% lower on flower — may need to adjust pricing or add value.",
    "Sampled the Purple Dragon Diamonds to the owner Carlos. He said it's the best concentrate he's seen this quarter. Wants to trial 20 units and see how they move.",
    "Follow-up on samples dropped last week. Feedback is positive across the board — budtenders love the Purple Dragon OG nose. Buyer wants to place a full order next visit.",
    "Vendor day prep meeting. Confirmed date for next Friday, 11am-4pm. They'll give us a table near the entrance. Expecting 200+ customers. Need to bring display materials.",
    "Routine check-in. Shelf is well-stocked with our products. Purple Dragon OG is their #3 seller in flower. Discussed increasing order frequency from monthly to bi-weekly.",
    "First visit to this location. Met the buyer and walked the floor. They carry Artizen and Constellation Cannabis heavily. Shelf space is tight but they're open to testing 2-3 SKUs.",
    "Dropped off samples of our full flower line plus the gummies. Buyer Jessica was receptive and said she'd review over the weekend. Scheduled follow-up for next Wednesday.",
    "Delivered order and did a quick budtender education session. Two new hires didn't know our product line. Left sell sheets and sample jars for the display case.",
    "Discussed Q2 pricing with the chain buyer for all 3 locations. They want volume discounts for 200+ unit orders across locations. Need to run this by Sarah.",
    "Quick stop — noticed competitor Phat Panda had a vendor day setup. Our shelf space was reduced by 1 facing. Talked to manager about getting it back next restock.",
    "Popup event at the store. Sold 45 units in 4 hours. Purple Dragon pre-rolls were the top seller. Great customer feedback on taste and burn quality.",
    "Check-in after their buyer transition. New buyer Marcus is more data-driven — wants to see velocity reports and margin analysis before expanding our shelf space.",
    "Sampled the new Mystic Haze to the buyer. First impression was positive — liked the nose and bag appeal. Pricing at $18 wholesale feels right for their customer base.",
    "Delivery run — dropped off 40 units of Purple Dragon OG and 20 Dragon's Breath pre-roll packs. Buyer confirmed they want to reorder in 2 weeks.",
    "Budtender training at the Tacoma location. Covered strain differences, terpene profiles, and recommended pairings. Staff of 5 attended, all very engaged.",
    "Met with owner about becoming an exclusive indica supplier. They're interested but want to see 3 months of consistent supply first. Good long-term opportunity.",
    "Pop-in to check displays. Our products are well-positioned at eye level. Took photos for the team. Budtender said Purple Dragon OG is outselling Lifted by 2:1.",
    "Follow-up on the quality complaint from last month. Brought replacement product and a COA for the new batch. Buyer seemed satisfied — willing to give us another chance.",
    "Introduced the Dragon Live Rosin to a concentrate-focused store. Buyer was impressed with the solventless process. Wants to start with 15 units to test demand.",
    "Weekly check-in. Store is doing well with our vape carts — their #1 seller in the category. Discussed launching our diamonds there once we have consistent supply.",
    "First meeting with the Renton location buyer. Different vibe from the Bellevue store — more price-sensitive customers. Recommended our Mystic Haze and gummies for the best margin play.",
    "Dropped off menu updates and new COAs. Quick visit — buyer was in a meeting. Left materials at the front desk. Confirmed our delivery slot for Thursday.",
    "Strategy meeting with Sarah and the Have a Heart chain buyer. Discussed joint marketing, volume pricing, and potential exclusivity for our infused pre-rolls in their 3 locations.",
    "End-of-month check-in. Reviewed the month's numbers — we're up 15% in units across their locations. Buyer is happy. Planning to increase their standing order starting next month.",
  ];

  const visitTypes: (typeof schema.visitTypeEnum.enumValues)[number][] = [
    "scheduled_meeting","drop_in","delivery","budtender_training","sample_drop","vendor_day","popup_event","scheduled_meeting","drop_in","delivery",
  ];
  const outcomes: (typeof schema.visitOutcomeEnum.enumValues)[number][] = [
    "order_placed","reorder_confirmed","sample_left","follow_up_needed","no_decision","order_placed","follow_up_needed","reorder_confirmed","sample_left","no_decision",
  ];

  const insertedVisits: (typeof schema.visits.$inferSelect)[] = [];
  for (let i = 0; i < 30; i++) {
    const acc = activeAccounts[i % activeAccounts.length];
    const rep = acc.assignedRepId === jake.id ? jake : maya;
    const daysBack = Math.floor(Math.random() * 55) + 2;
    const checkIn = daysAgo(daysBack);
    const checkOut = new Date(checkIn.getTime() + (30 + Math.random() * 60) * 60 * 1000);
    const accContacts = allContacts.filter((c) => c.accountId === acc.id);
    const hasFeedback = Math.random() > 0.5;

    const [visit] = await db
      .insert(schema.visits)
      .values({
        orgId,
        accountId: acc.id,
        repId: rep.id,
        visitType: visitTypes[i % visitTypes.length],
        outcome: outcomes[i % outcomes.length],
        contactsMet: accContacts.slice(0, 1 + Math.floor(Math.random() * 2)).map((c) => c.id),
        productsDiscussed: insertedProducts.slice(0, 2 + Math.floor(Math.random() * 3)).map((p) => p.id),
        notes: visitNotes[i % visitNotes.length],
        checkInLat: acc.latitude,
        checkInLng: acc.longitude,
        checkInTime: checkIn,
        checkOutTime: checkOut,
        nextFollowUpDate: dateStr(daysFromNow(Math.floor(Math.random() * 14))),
        nextFollowUpNotes: pick(["Call to confirm reorder", "Schedule vendor day", "Follow up on samples", "Send updated menu", "Discuss Q2 pricing"]),
        buyerFeedbackLook: hasFeedback ? pick(["positive", "positive", "neutral"]) as "positive" | "neutral" | "negative" : null,
        buyerFeedbackSmell: hasFeedback ? pick(["positive", "positive", "positive", "neutral"]) as "positive" | "neutral" | "negative" : null,
        buyerFeedbackPackaging: hasFeedback ? pick(["positive", "neutral", "neutral"]) as "positive" | "neutral" | "negative" : null,
        buyerFeedbackPricing: hasFeedback ? pick(["fits", "fits", "too_high"]) as "fits" | "too_high" | "too_low" : null,
        shelfAvailability: pick(["has_opening", "full", "unknown"]) as "has_opening" | "full" | "unknown",
        competitorBrandsNoted: pick([
          ["Phat Panda", "Lifted"],
          ["Artizen", "Constellation Cannabis"],
          ["Phat Panda", "Artizen", "Lifted"],
          ["Constellation Cannabis"],
          ["Lifted", "Artizen"],
        ]),
      })
      .returning();
    insertedVisits.push(visit);
  }
  console.log(`   ✓ ${insertedVisits.length} visits created\n`);

  // ─── 10. Samples ───────────────────────────────────────────────────────

  console.log("🧪 Creating samples...");
  const sampleAccounts = insertedAccounts.filter((a) => a.status === "sample_sent" || a.status === "active");

  const sampleConfigs: { status: typeof schema.sampleStatusEnum.enumValues[number]; daysBack: number; feedbackDue: number; followUps: number; feedbackNotes: string | null }[] = [
    { status: "delivered", daysBack: 3, feedbackDue: 10, followUps: 0, feedbackNotes: null },
    { status: "delivered", daysBack: 5, feedbackDue: 12, followUps: 0, feedbackNotes: null },
    { status: "awaiting_feedback", daysBack: 18, feedbackDue: -4, followUps: 2, feedbackNotes: null },
    { status: "awaiting_feedback", daysBack: 21, feedbackDue: -7, followUps: 1, feedbackNotes: null },
    { status: "awaiting_feedback", daysBack: 14, feedbackDue: 0, followUps: 1, feedbackNotes: null },
    { status: "feedback_received", daysBack: 25, feedbackDue: -11, followUps: 3, feedbackNotes: "Buyer loved the Purple Dragon OG — great bag appeal, smooth smoke. Budtenders gave positive feedback from customer tastings. Ready to place initial order of 30 units." },
    { status: "converted_to_order", daysBack: 35, feedbackDue: -21, followUps: 2, feedbackNotes: "Converted to order #PD-0012. Started with 20 units Purple Dragon OG + 10 Dragon's Breath." },
    { status: "expired", daysBack: 50, feedbackDue: -36, followUps: 3, feedbackNotes: null },
  ];

  const insertedSamples = [];
  for (let i = 0; i < sampleConfigs.length; i++) {
    const cfg = sampleConfigs[i];
    const acc = sampleAccounts[i % sampleAccounts.length];
    const rep = acc.assignedRepId === jake.id ? jake : maya;
    const accContacts = allContacts.filter((c) => c.accountId === acc.id);
    const relatedVisit = insertedVisits.find((v) => v.accountId === acc.id);
    const sampledProducts = insertedProducts.slice(0, 2 + Math.floor(Math.random() * 2));

    const [sample] = await db
      .insert(schema.samples)
      .values({
        orgId,
        accountId: acc.id,
        visitId: relatedVisit?.id ?? null,
        repId: rep.id,
        droppedOffDate: dateStr(daysAgo(cfg.daysBack)),
        productsSampled: sampledProducts.map((p) => ({
          productId: p.id,
          productName: p.name,
          quantity: 1,
          unitSize: p.unitSize,
        })),
        recipientContactId: accContacts[0]?.id ?? null,
        status: cfg.status,
        feedbackDueDate: dateStr(daysFromNow(cfg.feedbackDue)),
        feedbackNotes: cfg.feedbackNotes,
        followUpCount: cfg.followUps,
        lastFollowUpDate: cfg.followUps > 0 ? dateStr(daysAgo(cfg.daysBack - 7)) : null,
        notes: cfg.status === "expired" ? "Multiple follow-up attempts with no response. Marking as expired." : null,
      })
      .returning();
    insertedSamples.push(sample);
  }
  console.log(`   ✓ ${insertedSamples.length} samples created\n`);

  // ─── 11. Orders ────────────────────────────────────────────────────────

  console.log("💰 Creating orders...");
  type OrderStage = typeof schema.orderStageEnum.enumValues[number];
  const orderConfigs: { stage: OrderStage; source: typeof schema.orderSourceEnum.enumValues[number]; daysBack: number; payStatus: typeof schema.paymentStatusEnum.enumValues[number]; loss?: typeof schema.lossReasonEnum.enumValues[number] }[] = [
    { stage: "lead", source: "in_person", daysBack: 1, payStatus: "unpaid" },
    { stage: "lead", source: "phone", daysBack: 2, payStatus: "unpaid" },
    { stage: "lead", source: "text", daysBack: 3, payStatus: "unpaid" },
    { stage: "quote_sent", source: "in_person", daysBack: 5, payStatus: "unpaid" },
    { stage: "quote_sent", source: "email", daysBack: 7, payStatus: "unpaid" },
    { stage: "confirmed", source: "in_person", daysBack: 8, payStatus: "unpaid" },
    { stage: "confirmed", source: "phone", daysBack: 10, payStatus: "unpaid" },
    { stage: "processing", source: "in_person", daysBack: 12, payStatus: "unpaid" },
    { stage: "ready_for_delivery", source: "in_person", daysBack: 14, payStatus: "unpaid" },
    { stage: "delivered", source: "in_person", daysBack: 20, payStatus: "unpaid" },
    { stage: "delivered", source: "phone", daysBack: 25, payStatus: "partial" },
    { stage: "delivered", source: "in_person", daysBack: 30, payStatus: "unpaid" },
    { stage: "paid", source: "in_person", daysBack: 40, payStatus: "paid" },
    { stage: "paid", source: "leaflink", daysBack: 45, payStatus: "paid" },
    { stage: "lost", source: "in_person", daysBack: 15, payStatus: "unpaid", loss: "competitor" },
  ];

  const stageSequence: OrderStage[] = ["lead","quote_sent","confirmed","processing","ready_for_delivery","delivered","paid"];

  const insertedOrders = [];
  for (let i = 0; i < orderConfigs.length; i++) {
    const cfg = orderConfigs[i];
    const acc = insertedAccounts[i % insertedAccounts.length];
    const rep = acc.assignedRepId === jake.id ? jake : maya;
    const relatedVisit = insertedVisits.find((v) => v.accountId === acc.id);

    const numItems = 2 + Math.floor(Math.random() * 4);
    const shuffledProducts = [...insertedProducts].sort(() => Math.random() - 0.5).slice(0, numItems);
    let subtotal = 0;
    const lineItemsToInsert = shuffledProducts.map((p) => {
      const qty = pick([5, 10, 15, 20, 25, 30]);
      const unitPrice = parseFloat(p.wholesalePrice);
      const discount = Math.random() > 0.7 ? 5 : 0;
      const lineTotal = Math.round(qty * unitPrice * (1 - discount / 100) * 100) / 100;
      subtotal += lineTotal;
      return { productId: p.id, quantity: qty, unitPrice: p.wholesalePrice, discountPercent: discount.toFixed(2), lineTotal: lineTotal.toFixed(2) };
    });

    const total = Math.round(subtotal * 100) / 100;
    const closeDate = cfg.stage === "paid" || cfg.stage === "delivered" ? dateStr(daysAgo(cfg.daysBack)) : null;

    const [order] = await db
      .insert(schema.orders)
      .values({
        orgId,
        accountId: acc.id,
        repId: rep.id,
        stage: cfg.stage,
        source: cfg.source,
        expectedCloseDate: dateStr(daysFromNow(7 - cfg.daysBack)),
        actualCloseDate: closeDate,
        deliveryDate: cfg.stage === "delivered" || cfg.stage === "paid" ? dateStr(daysAgo(cfg.daysBack - 2)) : null,
        subtotal: subtotal.toFixed(2),
        discountAmount: "0.00",
        taxAmount: "0.00",
        total: total.toFixed(2),
        paymentTerms: acc.paymentTerms ?? "cod",
        paymentStatus: cfg.payStatus,
        linkedVisitId: relatedVisit?.id ?? null,
        lossReason: cfg.loss ?? null,
        notes: cfg.stage === "lost" ? "Lost to Phat Panda — they undercut our pricing by 15% on flower." : null,
      })
      .returning();
    insertedOrders.push(order);

    for (const li of lineItemsToInsert) {
      await db.insert(schema.orderLineItems).values({
        orderId: order.id,
        productId: li.productId,
        quantity: li.quantity,
        unitPrice: li.unitPrice,
        discountPercent: li.discountPercent,
        lineTotal: li.lineTotal,
      });
    }

    const currentStageIdx = stageSequence.indexOf(cfg.stage);
    if (cfg.stage === "lost") {
      await db.insert(schema.orderStageHistory).values({ orderId: order.id, fromStage: null, toStage: "lead", changedBy: rep.id, changedAt: daysAgo(cfg.daysBack + 5) });
      await db.insert(schema.orderStageHistory).values({ orderId: order.id, fromStage: "lead", toStage: "quote_sent", changedBy: rep.id, changedAt: daysAgo(cfg.daysBack + 3) });
      await db.insert(schema.orderStageHistory).values({ orderId: order.id, fromStage: "quote_sent", toStage: "lost", changedBy: rep.id, changedAt: daysAgo(cfg.daysBack), notes: "Lost to competitor (Phat Panda)" });
    } else if (currentStageIdx >= 0) {
      for (let s = 0; s <= currentStageIdx; s++) {
        await db.insert(schema.orderStageHistory).values({
          orderId: order.id,
          fromStage: s === 0 ? null : stageSequence[s - 1],
          toStage: stageSequence[s],
          changedBy: rep.id,
          changedAt: daysAgo(cfg.daysBack + (currentStageIdx - s) * 2),
        });
      }
    }
  }
  console.log(`   ✓ ${insertedOrders.length} orders with line items and stage history\n`);

  // ─── 12. Tasks ─────────────────────────────────────────────────────────

  console.log("✅ Creating tasks...");
  type TaskType = typeof schema.taskTypeEnum.enumValues[number];
  type TaskPriority = typeof schema.taskPriorityEnum.enumValues[number];
  const taskConfigs: { dueDaysFromNow: number; type: TaskType; priority: TaskPriority; title: string; desc: string }[] = [
    // 5 overdue
    { dueDaysFromNow: -5, type: "follow_up_visit", priority: "urgent", title: "Follow up with Lux Pot Shop buyer", desc: "They haven't ordered in 5 weeks. Need to visit and find out what's going on with Phat Panda competition." },
    { dueDaysFromNow: -3, type: "sample_follow_up", priority: "high", title: "Get sample feedback from Rainier Cannabis", desc: "Dropped samples 3 weeks ago. Called twice with no response. Try visiting in person." },
    { dueDaysFromNow: -2, type: "reorder_check", priority: "medium", title: "Reorder check — The Bakeréé", desc: "Should be running low on Dragon's Breath pre-rolls by now. Confirm inventory and take reorder." },
    { dueDaysFromNow: -1, type: "send_menu", priority: "low", title: "Send updated menu to Zips Cannabis", desc: "New prospect — send digital menu with current pricing and COAs." },
    { dueDaysFromNow: -4, type: "follow_up_visit", priority: "high", title: "Revisit Clear Choice after quality complaint", desc: "Brought replacement product. Need to confirm they're satisfied and ready to reorder." },
    // 5 due today
    { dueDaysFromNow: 0, type: "follow_up_visit", priority: "high", title: "Visit Greenside Recreational for sample feedback", desc: "Samples were delivered 5 days ago. Time to get first impressions." },
    { dueDaysFromNow: 0, type: "reorder_check", priority: "medium", title: "Check Have a Heart Ballard inventory", desc: "Bi-weekly reorder check. They usually need 20-30 units of Purple Dragon OG." },
    { dueDaysFromNow: 0, type: "budtender_training", priority: "medium", title: "Budtender training at World of Weed", desc: "3 new hires need product education. Bring sell sheets and sample jars." },
    { dueDaysFromNow: 0, type: "sample_follow_up", priority: "high", title: "Follow up on Kushmart South samples", desc: "Feedback is 2 days overdue. Call buyer and try to schedule in-person visit." },
    { dueDaysFromNow: 0, type: "send_menu", priority: "low", title: "Email Q2 menu to all South Sound accounts", desc: "Updated pricing takes effect next week. Send to all Maya's accounts." },
    // 5 due this week
    { dueDaysFromNow: 2, type: "follow_up_visit", priority: "medium", title: "Follow up with Herban Legends on volume pricing", desc: "They requested a volume discount proposal. Need to bring pricing tiers approved by Sarah." },
    { dueDaysFromNow: 3, type: "vendor_day_prep", priority: "high", title: "Prep materials for World of Weed vendor day", desc: "Confirmed for next week. Need banner, product display, sell sheets, and sample stock." },
    { dueDaysFromNow: 4, type: "reorder_check", priority: "medium", title: "Green Theory Bellevue — monthly reorder", desc: "Top A-tier account. They usually order 80-100 units across 5-6 SKUs." },
    { dueDaysFromNow: 5, type: "follow_up_visit", priority: "low", title: "Introduction visit to Mary Mart", desc: "New prospect in Tacoma. Research their current brands and prepare a tailored pitch." },
    { dueDaysFromNow: 6, type: "sample_follow_up", priority: "medium", title: "Check on Emerald Haze prospect status", desc: "Haven't heard back after initial outreach. Try calling the buyer directly." },
    // 5 due next week
    { dueDaysFromNow: 8, type: "follow_up_visit", priority: "medium", title: "Quarterly review with Ruckus Recreational", desc: "A-tier account — do a full shelf check, review numbers, discuss Q2 goals." },
    { dueDaysFromNow: 9, type: "reorder_check", priority: "medium", title: "Reorder check — Trees Cannabis Fremont", desc: "B-tier account, orders every 3 weeks. Should be ready for a restock." },
    { dueDaysFromNow: 10, type: "manager_assigned", priority: "high", title: "Competitive analysis: Phat Panda pricing", desc: "Sarah asked for a report on Phat Panda's wholesale pricing vs ours. Gather data from buyer conversations." },
    { dueDaysFromNow: 12, type: "follow_up_visit", priority: "low", title: "Visit Uncle Ike's Lake City — new buyer check", desc: "Account was dormant. Heard they have a new buyer. Worth a cold visit to re-introduce." },
    { dueDaysFromNow: 14, type: "vendor_day_prep", priority: "medium", title: "Propose vendor day to Green Theory Renton", desc: "Buyer mentioned interest in a vendor day. Send proposal with date options and expected foot traffic." },
  ];

  for (let i = 0; i < taskConfigs.length; i++) {
    const cfg = taskConfigs[i];
    const acc = insertedAccounts[i % insertedAccounts.length];
    const assignee = i % 2 === 0 ? jake : maya;
    const creator = i < 5 ? sarah : (i % 3 === 0 ? sarah : assignee);

    await db.insert(schema.tasks).values({
      orgId,
      accountId: acc.id,
      assignedTo: assignee.id,
      createdBy: creator.id,
      taskType: cfg.type,
      title: cfg.title,
      description: cfg.desc,
      dueDate: dateStr(daysFromNow(cfg.dueDaysFromNow)),
      priority: cfg.priority,
      status: "open",
    });
  }
  console.log(`   ✓ ${taskConfigs.length} tasks created\n`);

  // ─── 13. Vendor Events ─────────────────────────────────────────────────

  console.log("🎪 Creating vendor events...");
  const eventAccount1 = insertedAccounts.find((a) => a.name.includes("World of Weed"))!;
  const eventAccount2 = insertedAccounts.find((a) => a.name.includes("Ruckus"))!;
  const eventAccount3 = insertedAccounts.find((a) => a.name.includes("Have a Heart — Capitol"))!;

  await db.insert(schema.vendorEvents).values({
    orgId,
    accountId: eventAccount1.id,
    repId: maya.id,
    eventType: "vendor_day",
    eventDate: dateStr(daysAgo(6)),
    startTime: "11:00",
    endTime: "16:00",
    status: "completed",
    customerInteractions: 87,
    unitsSold: 45,
    budtendersTrained: 4,
    notes: "Great turnout! Sold mostly pre-rolls and flower. Purple Dragon OG was the star. Several customers asked where else they can find our brand.",
  });

  await db.insert(schema.vendorEvents).values({
    orgId,
    accountId: eventAccount2.id,
    repId: jake.id,
    eventType: "vendor_day",
    eventDate: dateStr(daysFromNow(6)),
    startTime: "12:00",
    endTime: "17:00",
    status: "confirmed",
    notes: "Table near front entrance confirmed. Bringing full product display, sample jars, and sell sheets. Jake to arrive 30min early for setup.",
  });

  await db.insert(schema.vendorEvents).values({
    orgId,
    accountId: eventAccount3.id,
    repId: jake.id,
    eventType: "budtender_training",
    eventDate: dateStr(daysFromNow(13)),
    startTime: "10:00",
    endTime: "11:30",
    status: "proposed",
    notes: "Proposed training session for Have a Heart chain. Waiting on buyer approval for all 3 locations to send staff.",
  });
  console.log(`   ✓ 3 vendor events created\n`);

  // ─── 14. Daily Routes ──────────────────────────────────────────────────

  console.log("🛣️  Creating daily routes...");
  const routeAccountsYesterday = insertedAccounts.slice(0, 5);
  const routeAccountsTomorrow = insertedAccounts.slice(5, 11);

  await db.insert(schema.dailyRoutes).values({
    orgId,
    repId: jake.id,
    routeDate: dateStr(daysAgo(1)),
    status: "completed",
    stops: routeAccountsYesterday.map((a, idx) => ({
      accountId: a.id,
      accountName: a.name,
      sequence: idx + 1,
      estimatedArrival: `${9 + idx}:${idx % 2 === 0 ? "00" : "30"}`,
      actualArrival: idx < 4 ? `${9 + idx}:${idx * 5 + 10}` : null,
      visitId: insertedVisits.find((v) => v.accountId === a.id)?.id ?? null,
      status: idx < 4 ? "visited" : "skipped",
    })),
    totalDistanceMiles: "34.50",
    totalDriveTimeMinutes: 85,
    aiSuggested: false,
    notes: "Skipped last stop (Uncle Ike's Lake City) — ran out of time after long meeting at Ruckus.",
  });

  await db.insert(schema.dailyRoutes).values({
    orgId,
    repId: maya.id,
    routeDate: dateStr(daysFromNow(1)),
    status: "planned",
    stops: routeAccountsTomorrow.map((a, idx) => ({
      accountId: a.id,
      accountName: a.name,
      sequence: idx + 1,
      estimatedArrival: `${9 + Math.floor(idx * 1.2)}:${(idx * 15) % 60 < 10 ? "0" : ""}${(idx * 15) % 60}`,
      actualArrival: null,
      visitId: null,
      status: "pending",
    })),
    totalDistanceMiles: "42.80",
    totalDriveTimeMinutes: 105,
    aiSuggested: true,
    notes: "AI-optimized route for South Sound territory. Focus on sample follow-ups and reorder checks.",
  });
  console.log(`   ✓ 2 daily routes created\n`);

  // ─── Done ──────────────────────────────────────────────────────────────

  console.log("═══════════════════════════════════════════════");
  console.log("✅ Seed complete! Summary:");
  console.log(`   • 1 organization (Purp Dragon)`);
  console.log(`   • 4 users (1 admin, 1 manager, 2 reps)`);
  console.log(`   • 2 territories`);
  console.log(`   • 2 account chains`);
  console.log(`   • ${insertedAccounts.length} accounts`);
  console.log(`   • ${allContacts.length} contacts`);
  console.log(`   • ${insertedProducts.length} products`);
  console.log(`   • ${insertedVisits.length} visits`);
  console.log(`   • ${insertedSamples.length} samples`);
  console.log(`   • ${insertedOrders.length} orders with line items`);
  console.log(`   • ${taskConfigs.length} tasks`);
  console.log(`   • 3 vendor events`);
  console.log(`   • 2 daily routes`);
  console.log("═══════════════════════════════════════════════");
  console.log("\n🔑 Login credentials:");
  console.log("   admin@purpdragon.com / demo123 (Admin)");
  console.log("   sarah@purpdragon.com / demo123 (Sales Manager)");
  console.log("   jake@purpdragon.com  / demo123 (Sales Rep)");
  console.log("   maya@purpdragon.com  / demo123 (Sales Rep)");
}

seed()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("❌ Seed failed:", err);
    process.exit(1);
  });

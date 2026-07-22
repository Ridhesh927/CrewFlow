const { PrismaClient } = require('@prisma/client')
const bcrypt = require('bcryptjs')
require('dotenv').config()

const prisma = new PrismaClient()

// List of 10 Domains
const DOMAINS = [
  'MERN Stack',
  'Cybersecurity',
  'AI/ML',
  'Marketing',
  'HR & Talent',
  'UI/UX Design',
  'DevOps & Cloud',
  'Data Science',
  'Mobile App Dev',
  'Quality Assurance'
]

// Realistic Names Helper Pools
const FIRST_NAMES = [
  'Aarav', 'Ananya', 'Rohan', 'Priya', 'Aditya', 'Sneha', 'Rahul', 'Kavya',
  'Dev', 'Ishita', 'Arjun', 'Meera', 'Yash', 'Riya', 'Karan', 'Tanvi',
  'Siddharth', 'Nisha', 'Varun', 'Neha', 'Kabir', 'Simran', 'Akash', 'Pooja',
  'Vivaan', 'Shreya', 'Amit', 'Divya', 'Manish', 'Bhavna', 'Gautam', 'Kritika',
  'Nikhil', 'Tara', 'Rishabh', 'Aaliyah', 'Zain', 'Sanya', 'Farhan', 'Zara'
]

const LAST_NAMES = [
  'Sharma', 'Verma', 'Patel', 'Gupta', 'Singh', 'Kumar', 'Reddy', 'Nair',
  'Joshi', 'Mehta', 'Rao', 'Deshmukh', 'Chopra', 'Malhotra', 'Bhasin', 'Bhat',
  'Agarwal', 'Shah', 'Kapoor', 'Saxena', 'Trivedi', 'Pandey', 'Sen', 'Dutta'
]

function getRandomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)]
}

function generateName(index) {
  const first = FIRST_NAMES[index % FIRST_NAMES.length]
  const last = LAST_NAMES[Math.floor(index / FIRST_NAMES.length) % LAST_NAMES.length]
  return `${first} ${last}`
}

function generatePhone(index) {
  const suffix = String(10000000 + index).padStart(8, '0')
  return `+91 98${suffix}`
}

async function main() {
  console.log('🚀 Starting ultra-fast bulk database seeding...')

  // Clean existing database records cleanly in dependency order
  console.log('🧹 Cleaning existing database records...')
  await prisma.proof.deleteMany()
  await prisma.subTask.deleteMany()
  await prisma.task.deleteMany()
  await prisma.rating.deleteMany()
  await prisma.attendance.deleteMany()
  await prisma.leaveRequest.deleteMany()
  await prisma.announcement.deleteMany()
  await prisma.document.deleteMany()
  await prisma.user.deleteMany()

  const adminPassword = process.env.ADMIN_PASSWORD || 'admin@123'
  const seniorTlPassword = process.env.SENIORTL_PASSWORD || 'admin@123'
  const seedPassword = process.env.SEED_PASSWORD || 'password123'

  const adminHashed = await bcrypt.hash(adminPassword, 10)
  const seniorTlHashed = await bcrypt.hash(seniorTlPassword, 10)
  const hashedPassword = await bcrypt.hash(seedPassword, 10)

  // 1. Create 5 Admins
  console.log('👤 Creating 5 Admin users...')
  const adminData = [
    { name: 'Admin User', email: 'admin@gmail.com', password: adminHashed, department: 'Global Executive' },
    { name: 'Sarah Jenkins', email: 'admin2@company.com', password: hashedPassword, department: 'Operations' },
    { name: 'David Vance', email: 'admin3@company.com', password: hashedPassword, department: 'Executive Board' },
    { name: 'Elena Rostova', email: 'admin4@company.com', password: hashedPassword, department: 'Human Resources' },
    { name: 'Marcus Thorne', email: 'admin5@company.com', password: hashedPassword, department: 'Technology' }
  ]

  const admins = []
  for (let i = 0; i < adminData.length; i++) {
    const admin = await prisma.user.create({
      data: {
        name: adminData[i].name,
        email: adminData[i].email,
        password: adminData[i].password,
        role: 'ADMIN',
        department: adminData[i].department,
        specialId: `EMP-ADM-${String(i + 1).padStart(3, '0')}`,
        phoneNo: generatePhone(100 + i),
        points: 1000
      }
    })
    admins.push(admin)
  }

  // 2. Create 5 Senior TLs
  console.log('👔 Creating 5 Senior TL users...')
  const seniorTlConfigs = [
    { name: 'Senior TL User', email: 'seniortl@gmail.com', password: seniorTlHashed, dept: 'Software Development' },
    { name: 'Vikram Malhotra', email: 'seniortl2@company.com', password: hashedPassword, dept: 'Cyber & DevOps' },
    { name: 'Priya Sharma', email: 'seniortl3@company.com', password: hashedPassword, dept: 'AI & Data Science' },
    { name: 'Alex Rivera', email: 'seniortl4@company.com', password: hashedPassword, dept: 'Growth & Business' },
    { name: 'Ananya Patel', email: 'seniortl5@company.com', password: hashedPassword, dept: 'Design & Mobile' }
  ]

  const seniorTls = []
  for (let i = 0; i < seniorTlConfigs.length; i++) {
    const stl = await prisma.user.create({
      data: {
        name: seniorTlConfigs[i].name,
        email: seniorTlConfigs[i].email,
        password: seniorTlConfigs[i].password,
        role: 'SENIOR_TL',
        department: seniorTlConfigs[i].dept,
        specialId: `EMP-STL-${String(i + 1).padStart(3, '0')}`,
        phoneNo: generatePhone(200 + i),
        managerId: admins[i % admins.length].id,
        points: 750
      }
    })
    seniorTls.push(stl)
  }

  let userCounter = 1

  // 3. Bulk create 10 TLs
  console.log('⚡ Bulk creating 10 TLs...')
  const tlObjects = []
  for (let dIndex = 0; dIndex < DOMAINS.length; dIndex++) {
    const domain = DOMAINS[dIndex]
    const assignedSeniorTl = seniorTls[Math.floor(dIndex / 2)]

    const isFirstDomain = (dIndex === 0)
    const tlEmail = isFirstDomain ? 'tl@gmail.com' : `tl.${domain.toLowerCase().replace(/[^a-z0-9]/g, '')}@company.com`
    const tlName = isFirstDomain ? 'Team Lead User' : `${generateName(userCounter)} (TL)`
    userCounter++

    tlObjects.push({
      name: tlName,
      email: tlEmail,
      password: hashedPassword,
      role: 'TL',
      department: domain,
      specialId: `EMP-TL-${String(dIndex + 1).padStart(3, '0')}`,
      phoneNo: generatePhone(300 + dIndex),
      managerId: assignedSeniorTl.id,
      points: 500
    })
  }
  await prisma.user.createMany({ data: tlObjects })
  const tls = await prisma.user.findMany({ where: { role: 'TL' }, orderBy: { id: 'asc' } })

  // 4. Bulk create 30 Captains
  console.log('⚡ Bulk creating 30 Captains...')
  const capObjects = []
  for (let dIndex = 0; dIndex < DOMAINS.length; dIndex++) {
    const domain = DOMAINS[dIndex]
    const tl = tls.find(t => t.department === domain)

    for (let c = 1; c <= 3; c++) {
      const capIndex = dIndex * 3 + c
      const isFirstCap = (dIndex === 0 && c === 1)
      const capEmail = isFirstCap ? 'captain@gmail.com' : `captain.${domain.toLowerCase().replace(/[^a-z0-9]/g, '')}${c}@company.com`
      const capName = isFirstCap ? 'Captain User' : `${generateName(userCounter)} (Captain)`
      userCounter++

      capObjects.push({
        name: capName,
        email: capEmail,
        password: hashedPassword,
        role: 'CAPTAIN',
        department: domain,
        specialId: `EMP-CAP-${String(capIndex).padStart(3, '0')}`,
        phoneNo: generatePhone(400 + capIndex),
        managerId: tl.id,
        points: 300
      })
    }
  }
  await prisma.user.createMany({ data: capObjects })
  const captains = await prisma.user.findMany({ where: { role: 'CAPTAIN' }, orderBy: { id: 'asc' } })

  // 5. Bulk create 110 Interns
  console.log('⚡ Bulk creating 110 Interns...')
  const internObjects = []
  for (let dIndex = 0; dIndex < DOMAINS.length; dIndex++) {
    const domain = DOMAINS[dIndex]
    const domainCaptains = captains.filter(c => c.department === domain)

    for (let i = 1; i <= 11; i++) {
      const internIndex = dIndex * 11 + i
      const isFirstIntern = (dIndex === 0 && i === 1)
      const isSecondIntern = (dIndex === 0 && i === 2)
      
      let internEmail = `intern.${domain.toLowerCase().replace(/[^a-z0-9]/g, '')}${i}@company.com`
      let internName = `${generateName(userCounter)}`
      if (isFirstIntern) {
        internEmail = 'intern@gmail.com'
        internName = 'Intern User'
      } else if (isSecondIntern) {
        internEmail = 'intern2@gmail.com'
        internName = 'Intern User 2'
      }
      userCounter++

      const assignedCaptain = domainCaptains[(i - 1) % domainCaptains.length]

      internObjects.push({
        name: internName,
        email: internEmail,
        password: hashedPassword,
        role: 'INTERN',
        department: domain,
        specialId: `EMP-INT-${String(internIndex).padStart(3, '0')}`,
        phoneNo: generatePhone(500 + internIndex),
        managerId: assignedCaptain.id,
        points: Math.floor(Math.random() * 200) + 50
      })
    }
  }

  await prisma.user.createMany({ data: internObjects })
  const interns = await prisma.user.findMany({ where: { role: 'INTERN' }, orderBy: { id: 'asc' } })

  console.log(`✅ Successfully seeded total ${admins.length + seniorTls.length + tls.length + captains.length + interns.length} users!`)
  console.log(`📊 Breakdown: ${admins.length} Admins, ${seniorTls.length} Senior TLs, ${tls.length} TLs, ${captains.length} Captains, ${interns.length} Interns`)

  // 6. Create Sample Tasks
  console.log('📋 Creating tasks & proofs...')
  const tasks = []
  const domainTaskTemplates = [
    { title: 'Build Authentication API with Fastify', desc: 'Implement JWT auth with role middleware', audience: 'MERN Stack' },
    { title: 'Frontend Dashboard Optimization', desc: 'Refactor React components and memoize slow renders', audience: 'MERN Stack' },
    { title: 'Vulnerability Scan & Audit', desc: 'Perform OWASP vulnerability audit on backend APIs', audience: 'Cybersecurity' },
    { title: 'Fine-tune Classification Model', desc: 'Train intent classifier dataset with PyTorch', audience: 'AI/ML' },
    { title: 'LinkedIn Campaign Execution', desc: 'Publish technical blogs and repost marketing media', audience: 'All' }
  ]

  for (const t of domainTaskTemplates) {
    const task = await prisma.task.create({
      data: {
        title: t.title,
        description: t.desc,
        targetAudience: t.audience,
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
      }
    })
    tasks.push(task)
  }

  if (tasks.length > 0 && interns.length >= 2) {
    const subtask1 = await prisma.subTask.create({
      data: { taskId: tasks[0].id, title: 'Draft API Schema' }
    })
    const subtask2 = await prisma.subTask.create({
      data: { taskId: tasks[0].id, title: 'Write Unit Tests' }
    })

    await prisma.proof.create({
      data: {
        taskId: tasks[0].id,
        internId: interns[0].id,
        status: 'Approved',
        completedSubTasks: [subtask1.id, subtask2.id]
      }
    })

    await prisma.proof.create({
      data: {
        taskId: tasks[0].id,
        internId: interns[1].id,
        status: 'Pending',
        completedSubTasks: [subtask1.id]
      }
    })
  }

  // 7. Attendance Records
  console.log('📅 Seeding attendance...')
  const attendanceRecords = []
  const today = new Date()
  const statuses = ['Present', 'Present', 'Present', 'Present', 'Late', 'Absent']

  for (let i = 0; i < Math.min(40, interns.length); i++) {
    const intern = interns[i]
    for (let dayOffset = 0; dayOffset < 5; dayOffset++) {
      const d = new Date(today)
      d.setDate(d.getDate() - dayOffset)

      const status = getRandomItem(statuses)
      attendanceRecords.push({
        userId: intern.id,
        date: d,
        status: status,
        markedBy: intern.managerId || captains[0].id,
        remarks: status === 'Late' ? 'Traffic delay' : null
      })
    }
  }

  await prisma.attendance.createMany({
    data: attendanceRecords,
    skipDuplicates: true
  })

  // 8. Performance Ratings
  console.log('⭐ Seeding ratings...')
  const ratingRecords = []
  const currentMonth = 'July 2026'

  for (let i = 0; i < Math.min(50, interns.length); i++) {
    const intern = interns[i]
    const raterId = intern.managerId || captains[0].id

    ratingRecords.push({
      userId: intern.id,
      raterId: raterId,
      rating: parseFloat((3.8 + Math.random() * 1.2).toFixed(1)),
      comments: 'Consistently completes tasks on time with great quality.',
      month: currentMonth
    })
  }

  await prisma.rating.createMany({
    data: ratingRecords
  })

  // 9. Announcements
  console.log('📢 Seeding announcements...')
  await prisma.announcement.create({
    data: {
      title: 'Welcome to Q3 Sprint Season!',
      content: 'All team leads please align your sprint backlogs before Friday.',
      targetRole: null,
      authorId: admins[0].id
    }
  })

  await prisma.announcement.create({
    data: {
      title: 'MERN Stack Architecture Workshop',
      content: 'Mandatory workshop on micro-frontend architecture this Thursday at 4 PM.',
      targetRole: 'INTERN',
      targetDepartment: 'MERN Stack',
      authorId: seniorTls[0].id
    }
  })

  // 10. Leave Requests
  console.log('🏖️ Seeding leave requests...')
  if (interns.length >= 2) {
    await prisma.leaveRequest.create({
      data: {
        userId: interns[0].id,
        startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() + 4 * 24 * 60 * 60 * 1000),
        reason: 'Family event',
        status: 'PENDING'
      }
    })

    await prisma.leaveRequest.create({
      data: {
        userId: interns[1].id,
        startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
        endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
        reason: 'Medical Leave',
        status: 'APPROVED'
      }
    })
  }

  console.log('🎉 Ultra-fast bulk seeding completed successfully!')
}

main()
  .then(async () => {
    await prisma.$disconnect()
  })
  .catch(async (e) => {
    console.error('❌ Seeding failed:', e)
    await prisma.$disconnect()
    process.exit(1)
  })

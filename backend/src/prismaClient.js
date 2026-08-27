const { PrismaClient } = require('@prisma/client');

const basePrisma = new PrismaClient();

const prisma = basePrisma.$extends({
  query: {
    $allModels: {
      async $allOperations({ model, operation, args, query }) {
        const result = await query(args);
        
        const flattenDepartment = (obj) => {
          if (!obj) return;
          if (Array.isArray(obj)) {
            obj.forEach(flattenDepartment);
          } else if (typeof obj === 'object') {
            if (obj.department && typeof obj.department === 'object' && obj.department.name) {
              obj.department = obj.department.name;
            }
            
            for (const key of Object.keys(obj)) {
              if (typeof obj[key] === 'object' && obj[key] !== null) {
                flattenDepartment(obj[key]);
              }
            }
          }
        };

        flattenDepartment(result);
        return result;
      }
    }
  }
});

module.exports = prisma;

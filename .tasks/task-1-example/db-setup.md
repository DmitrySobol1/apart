package.json:

```
{
  "name": "@glindra-ai/db",
  "version": "0.0.0",
  "private": true,
  "type": "module",
  "description": "Shared database schemas and types for Glindra AI",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "default": "./dist/index.js"
    },
    "./schemas": {
      "types": "./dist/schemas/index.d.ts",
      "default": "./dist/schemas/index.js"
    }
  },
  "scripts": {
    "build": "tsc --project tsconfig.build.json && npx tsc-alias -p tsconfig.build.json --resolve-full-paths",
    "dev": "tsc --watch --preserveWatchOutput",
    "db:generate": "drizzle-kit generate",
    "db:migrate": "drizzle-kit migrate",
    "db:push": "drizzle-kit push",
    "db:studio": "drizzle-kit studio",
    "db:drop": "drizzle-kit drop",
    "db:check": "drizzle-kit check",
    "lint": "eslint src --ext .ts,.tsx",
    "format": "biome format src --write",
    "type-check": "tsc --noEmit",
    "clean": "rm -rf dist",
    "db:seed": "tsx --env-file=.env src/seeds/index.ts",
    "db:seed:users": "tsx --env-file=.env src/seeds/users.ts"
  },
  "dependencies": {
    "drizzle-orm": "^0.44.5",
    "pg": "^8.16.3",
    "zod": "^3.25.76"
  },
  "devDependencies": {
    "@biomejs/biome": "^2.1.3",
    "@glindra-ai/eslint-config-custom": "workspace:*",
    "@types/node": "^22.1.0",
    "@types/pg": "^8.15.5",
    "dotenv": "^17.2.1",
    "drizzle-kit": "^0.31.4",
    "eslint": "^9.32.0",
    "tsc-alias": "^1.8.16",
    "tsx": "^4.20.0",
    "typescript": "^5.9.2"
  }
}
```

drizzle.config.ts:

```
/**
 * @task TASK-006
 * Drizzle configuration for PostgreSQL migration
 * Following observability architecture for database operations monitoring
 */
import {defineConfig} from 'drizzle-kit';

export default defineConfig({
  schema: [
    './dist/drizzle/schema/users.js',
    './dist/drizzle/schema/presentations.js',
    './dist/drizzle/schema/templates.js',
    './dist/drizzle/schema/template-slides.js',
    './dist/drizzle/schema/template-slide-objects.js',
    './dist/drizzle/schema/relations.js',
    './dist/drizzle/schema/enums.js'
  ],
  out: './src/drizzle/migrations',
  dialect: 'postgresql',
  dbCredentials: {
    url: process.env.DATABASE_URL!,
  },
  tablesFilter: ['!pg_stat_statements', '!pg_stat_statements_info'],
  verbose: true,
  strict: true,
  // Enable observability for migration operations
  migrations: {
    prefix: 'supabase',
  },
});
```

tsconfig.build.json:

```
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@schema/*": ["./drizzle/schema/*"],
      "@schemas/*": ["./schemas/*"],
      "@lib/*": ["./lib/*"],
      "@seeds/*": ["./seeds/*"],
      "@migrations/*": ["./migrations/*"]
    },
    "strict": false,
    "esModuleInterop": true,
    "allowSyntheticDefaultImports": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "noEmit": false,
    "types": ["node"]
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

tsconfig.json:

```
{
  "extends": "../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "baseUrl": "./src",
    "paths": {
      "@schema/*": ["./drizzle/schema/*"],
      "@schemas/*": ["./schemas/*"],
      "@lib/*": ["./lib/*"],
      "@seeds/*": ["./seeds/*"],
      "@migrations/*": ["./migrations/*"]
    },
    "noEmit": false,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "composite": true,
    "noImplicitAny": false,
    "noImplicitReturns": false,
    "skipLibCheck": true,
    "strict": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

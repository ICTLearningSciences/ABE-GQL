# ABE-GQL Project Structure

## Tech Stack
- **Runtime**: Node.js + TypeScript (ES2018, commonjs)
- **API**: GraphQL (graphql package)
- **Database**: MongoDB + Mongoose (with custom plugins)
- **Deployment**: AWS Lambda (serverless)
- **Testing**: Mocha + Chai + Supertest + mongo-unit
- **Auth**: JWT tokens (stateless)
- **Optimization**: DataLoader (batch loading)

## Directory Structure

### Core Application
- `src/app.ts` - Express app factory, middleware, JWT parsing, context injection
- `src/exported-functions.ts` - Lambda handler exports
- `src/helpers.ts` - Shared business logic (version hydration, validation, enrollment management)
- `src/constants.ts` - Application constants
- `src/utils/` - Mongoose connection, logging (Winston), environment config

### GraphQL Schema
- `src/schemas/publicSchema.ts` - Role-based schema composition (ADMIN, CONTENT_MANAGER, USER)
- `src/schemas/models/` - Mongoose models + GraphQL types (PascalCase files)
- `src/schemas/query/` - Query resolvers (kebab-case files)
- `src/schemas/mutation/` - Mutation resolvers (kebab-case files)
- `src/schemas/types/` - GraphQL scalars, enums, type helpers

### Supporting Code
- `src/dataloaders/` - DataLoader instances for N+1 prevention
- `test/graphql/query/` - Query tests (mirrors src structure)
- `test/graphql/mutation/` - Mutation tests (mirrors src structure)
- `test/fixtures/mongodb/` - Mock data for mongo-unit
- `test/helpers.ts` - Token generation, GraphQL request helpers

## Model Architecture

### File Structure (all in one file)
Each model file contains 4-6 components in order:
1. **TypeScript interface** extending `Document` - type safety
2. **GraphQL ObjectType** - API output schema
3. **GraphQL InputType** - mutation input schema
4. **Mongoose Schema** - database structure with validation
5. **Mongoose Model interface** - custom method types (optional)
6. **Plugin applications** - pagination, custom plugins
7. **Default export** - mongoose.model() instance

### Model Conventions
- Always use `timestamps: true` in schema options
- Apply `collation: { locale: "en", strength: 2 }` for string comparisons
- Add indexes matching query patterns (compound indexes with `_id` last)
- Soft deletes via `.pre(/^find/, ...)` hooks filtering deleted records
- Use custom plugins from `schemas/models/plugins/` for shared behavior
- Pagination enabled via `pluginPagination(Schema)` for searchable models

## Query/Mutation Pattern

### Resolver Structure
Named export object with:
- `type` - GraphQL return type (ObjectType, List, etc.)
- `args` - GraphQL arguments with types
- `resolve` - async function with signature: `(_root, args, context) => result`

### Context Object
Injected by middleware, contains:
- `userId` - authenticated user ID from JWT
- `userRole` - UserRole enum (USER, CONTENT_MANAGER, ADMIN)
- `req/res` - Express request/response
- `subdomain` - extracted subdomain
- `googleDocVersionLoader` - DataLoader instance

### Authorization Pattern
**Resolver-level checks** (not schema composition):
- Check `context.userId` exists for authenticated endpoints
- Check `context.userRole` for role-based access
- Check ownership: `context.userId === resource.userId`
- Throw errors with descriptive messages: `throw new Error("unauthorized")`

### Common Patterns
- **Upsert**: `findOneAndUpdate({ _id }, { $set: {...} }, { new: true, upsert: true })`
- **Error handling**: try-catch with `console.log(e)` then `throw new Error(String(e))`
- **References**: Use `mongoose.Types.ObjectId` for foreign keys
- **Validation**: Use `validateIds()` helper from helpers.ts
- **ID generation**: Use `idOrNew()` helper for create-or-update flows

### File Naming
- Mutations: `kebab-case.ts` (e.g., `add-or-update-activity.ts`)
- Queries: `kebab-case.ts` (e.g., `fetch-courses.ts`)
- Models: `PascalCase.ts` (e.g., `User.ts`, `Course.ts`)
- Complex models: subdirectory (e.g., `BuiltActivity/BuiltActivity.ts`)

## Testing Requirements

### Test Coverage (for new mutations/queries)
1. **Happy path** - successful operation with valid data
2. **Authorization checks** - admin/user/unauthorized scenarios
3. **Edge cases** - missing data, invalid IDs, empty results, validation failures

### Test Setup
- Use `mongo-unit` for in-memory MongoDB with fixture data
- Load fixtures in `beforeEach`, clean in `afterEach`
- Generate JWT tokens via `getToken(userId, userRole)` helper
- Use `authGql()` helper for authenticated requests
- Use `supertest` to POST to `/graphql` endpoint

### Test Structure
- File mirrors src location (e.g., `test/graphql/query/fetch-courses.spec.ts`)
- Mocha `describe` blocks with nested contexts
- Chai assertions: `expect(response.status).to.equal(200)`
- App lifecycle: `appStart()` before, `appStop()` after

## Serverless Considerations

### Database Connection
- Lazy import in `appStart()` for connection pooling
- Connection reuse across Lambda invocations
- `appStop()` handles graceful shutdown with listener cleanup
- `mongoose.set('strictQuery', false)` for flexibility
- Index sync on startup via `Model.syncIndexes()`

### Configuration
- Environment variables with fallbacks
- `MONGO_URI` or composed from parts (MONGO_USER, MONGO_PASSWORD, etc.)
- JWT_SECRET for token signing
- LOG_LEVEL_GRAPHQL for Winston logging

## Key Libraries & Patterns

### Pagination
- `mongoose-paginate-v2` plugin applied via `pluginPagination(Schema)`
- Returns `PaginatedResolveResult` with results, next/previous cursors, boolean flags
- Use in queries returning lists: `Model.paginate(query, options)`

### DataLoader
- Created per-request: `createGoogleDocVersionLoader()`
- Injected via context
- Batches queries in single event loop tick
- Example: `context.googleDocVersionLoader.load(docId)`

### Role-Based Schema
- `publicQueries` - all users
- `publicMutations` - basic authenticated operations
- `contentManagerMutations` - extends public + content management
- `adminMutations` - extends content manager + admin operations
- Schema built dynamically in `getAuthenticatedSchema(userRole, userId)`

## Adding New Features

### New Query/Mutation Checklist
1. Create resolver file in `src/schemas/query/` or `src/schemas/mutation/`
2. Import and add to `publicQueries`/`publicMutations` in publicSchema.ts
3. Check authorization in resolver using `context.userRole` and `context.userId`
4. Use existing models from `src/schemas/models/`
5. Create test file in matching `test/graphql/` directory
6. Test happy path, authorization, and edge cases
7. Use helpers from `src/helpers.ts` for common operations

### New Model Checklist
1. Create PascalCase file in `src/schemas/models/`
2. Define TypeScript interface extending Document
3. Define GraphQL ObjectType for API output
4. Define GraphQL InputType for mutation input
5. Define Mongoose Schema with validation, timestamps, collation
6. Add indexes for query optimization
7. Apply pagination plugin if model is searchable
8. Export mongoose.model as default
9. Import and use in queries/mutations

### Complex Models
- Use subdirectory for models with multiple related types
- Example: `BuiltActivity/` contains BuiltActivity.ts, types.ts, objects.ts
- Keep GraphQL types co-located with model (even if in separate files within subdirectory)

## Important Files Reference
- `src/schemas/publicSchema.ts` - GraphQL schema entry point
- `src/app.ts` - Application setup and context
- `src/helpers.ts` - Business logic utilities (500+ lines)
- `src/utils/mongoose-connect.ts` - Database connection
- `test/init.spec.ts` - Test suite bootstrap
- `test/helpers.ts` - Test utilities

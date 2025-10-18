# RAG Module Tests

## Test Structure

### Unit Tests (src/rag/test/)

Unit tests for individual RAG services with mocked dependencies:

- **embedding.service.spec.ts** - Tests for HuggingFace embedding API integration
  - Mock axios to test API calls without hitting real API
  - Tests embedding creation, batching, validation, error handling
  - Run: `npm test -- embedding.service.spec.ts`

### Integration Tests (src/test/)

Integration tests for the complete RAG system:

- **rag-integration.spec.ts** - End-to-end RAG workflow tests
  - Requires real API keys in .env (HUGGINGFACE_API_KEY, PINECONE_API_KEY)
  - Tests actual API integration, vector storage, and search
  - Run: `npm test -- rag-integration.spec.ts`
  - ⚠️ These tests are slower and make real API calls

## Running Tests

```bash
# Run all RAG unit tests
npm test -- src/rag/test

# Run integration tests
npm test -- src/test/rag-integration

# Run all tests
npm test
```

## Manual Testing Scripts

For manual testing and debugging, use scripts in `/backend/scripts/`:

### Available Scripts

1. **test-embedding.ts** - Test embedding service manually
   ```bash
   npm run test:embedding
   ```

2. **test-pinecone.ts** - Test Pinecone connection and operations
   ```bash
   npm run test:pinecone
   ```

3. **test-scraper.ts** - Test web scraping functionality
   ```bash
   npm run test:scraper
   ```

4. **debug-scraper.ts** - Debug scraper selectors
   ```bash
   npm run debug:scraper
   ```

5. **seed-data.ts** - Seed Pinecone with crypto data
   ```bash
   npm run seed:rag
   ```

6. **reset-pinecone.ts** - Reset Pinecone index
   ```bash
   npm run reset:pinecone
   ```

See `/backend/scripts/README.md` for detailed documentation.

## Test Coverage

- ✅ EmbeddingService: 13 unit tests
- ✅ RAG Integration: 10+ integration tests
- ⚠️ ScraperService: Manual testing via scripts (complex to mock Puppeteer)
- ⚠️ VectorService: Integration tests only (requires Pinecone API)

## Notes

- Unit tests use mocked dependencies and run fast
- Integration tests require API keys and make real API calls
- Scraper tests are best done manually due to Puppeteer complexity
- Use scripts for debugging and one-time operations

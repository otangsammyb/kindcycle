---
description: how to start the KindCycle application
---

This workflow guide you through starting the KindCycle charity platform.

### Prerequisites

1.  **MongoDB**: Ensure MongoDB is installed and running on `mongodb://localhost:27017`.
2.  **Redis**: Ensure Redis is installed and running on `redis://localhost:6379`.
3.  **Environment Variables**: Check that `.env` is configured (a default one has been created for you).

### Steps

1. **Install Dependencies** (if not already done)
   ```bash
   npm install
   ```

2. **Seed the Database** (Recommended for first run to create admin and demo accounts)
   ```bash
   npm run seed
   ```

3. **Start the Application**
   ```bash
   npm run dev
   ```

4. **Access the Platform**
   Open your browser and navigate to: [http://localhost:5000](http://localhost:5000)

### Demo Accounts
- **Admin**: `admin@kindcycle.org` / `Admin@1234`
- **Giver**: `sophie@example.com` / `Password@1`
- **Receiver**: `marie@example.com` / `Password@1`

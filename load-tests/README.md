# K6 Load Testing Guide

## Prerequisites

Install K6:
```bash
# macOS
brew install k6

# Ubuntu/Debian
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Windows (via Chocolatey)
choco install k6
```

## Running Tests

### Quick Start (Local)
```bash
# Run all scenarios against localhost
./load-tests/run-load-tests.sh all local

# Run specific scenario
./load-tests/run-load-tests.sh 1 local  # Login + Dashboard
./load-tests/run-load-tests.sh 2 local  # Contract Creation
./load-tests/run-load-tests.sh 3 local  # Invoice Generation
```

### Against Staging/Production
```bash
./load-tests/run-load-tests.sh all staging
./load-tests/run-load-tests.sh all production  # Requires confirmation
```

## Test Scenarios

### Scenario 1: Login + Dashboard (High Frequency)
- **Load**: 50 → 100 users over 8 minutes
- **Thresholds**:
  - p95 < 500ms
  - p99 < 1000ms
  - Error rate < 1%
- **Metrics**: Login success rate, Dashboard fetch time

### Scenario 2: Contract Creation (Medium Frequency)
- **Load**: 20 users over 5 minutes
- **Thresholds**:
  - p95 < 1000ms
  - p99 < 2000ms
  - Error rate < 2%
- **Metrics**: Contract creation time, DB transaction time

### Scenario 3: Invoice Generation (Cron Simulation)
- **Load**: 10 users over 3 minutes
- **Thresholds**:
  - p95 < 2000ms
  - p99 < 5000ms
  - Error rate < 2%
- **Metrics**: Invoice generation time, PDF creation time

## Interpreting Results

Good baseline (MVP scale):
- **Login/Dashboard**: p95 < 200ms, p99 < 500ms
- **Contract Creation**: p95 < 800ms, p99 < 1500ms
- **Invoice Generation**: p95 < 1500ms, p99 < 3000ms

Optimization needed if:
- Any scenario exceeds p95 threshold consistently
- Error rate > 1%
- Response times increasing over test duration (memory leak indicator)

## Next Steps

1. **Establish Baseline**: Run tests once to get initial metrics
2. **Document Results**: Save p50/p95/p99 values in roadmap
3. **Optimize**: Focus on slowest scenario first
4. **Regression Test**: Run before each deployment

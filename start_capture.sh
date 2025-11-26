#!/bin/bash
# Start IDS Packet Capture - Captures ALL IP Traffic
# This script automatically starts when needed

cd /home/dilusha/ids-project

# Activate virtual environment
source .venv/bin/activate

# Run packet capture for ALL IP traffic (no filter)
# --mode live: Capture from network interface
# --iface eth0: Monitor eth0 interface
# --window 5: 5-second analysis windows
# --step 1: Move window every 1 second
# --post: Send data to API
# --api-url: Backend detection endpoint
# --bpf "ip": Capture ALL IP traffic (TCP, UDP, ICMP, everything)

echo "Starting IDS Packet Capture..."
echo "Capturing ALL IP traffic on interface eth0"
echo "Press Ctrl+C to stop"
echo ""

sudo $(which python3) realtime_agent/realtime_extractor.py \
  --mode live \
  --iface eth0 \
  --window 5 \
  --step 1 \
  --post \
  --api-url http://127.0.0.1:8000/detect \
  --bpf "ip"

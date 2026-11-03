#!/bin/bash
echo "=============================================="
echo " Dwarka Clinic PWA - Multi-Laptop Sync Push"
echo "=============================================="

COMMIT_MSG="$1"
if [ -z "$COMMIT_MSG" ]; then
  COMMIT_MSG="chore: sync work from laptop $(date)"
fi

git add .
git commit -m "$COMMIT_MSG"
git push origin main

echo ""
echo "[OK] Changes pushed successfully to origin main."


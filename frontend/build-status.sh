#!/bin/bash
timeout 420 npm run build > build-final.log 2>&1
BUILD_STATUS=$?
if [ $BUILD_STATUS -eq 0 ]; then
  echo "✅ BUILD SUCCESSFUL!"
  tail -100 build-final.log | grep -E "(✓|Route|Generating|Build|complete)" | tail -50
else
  echo "❌ BUILD FAILED"
  tail -50 build-final.log
fi
exit $BUILD_STATUS
